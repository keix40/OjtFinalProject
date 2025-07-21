import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-banned-page',
  template: `
    <div class="banned-container">
      <h1>You are temporarily banned</h1>
      <p>Your access has been blocked for security reasons.</p>
      <p *ngIf="minutesLeft > 0">Time remaining: {{ minutesLeft }}m {{ secondsLeft }}s</p>
      <p *ngIf="minutesLeft <= 0 && secondsLeft <= 0">You may try again now.</p>
    </div>
  `,
  styles: [`
    .banned-container { text-align: center; margin-top: 100px; }
    h1 { color: #d32f2f; }
    p { font-size: 1.2em; }
  `]
})
export class BannedPageComponent implements OnInit {
  blockedUntil: string = '';
  minutesLeft: number = 0;
  secondsLeft: number = 0;
  private timer: any;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.blockedUntil = params['until'] || '';
      this.updateCountdown();
      this.timer = setInterval(() => this.updateCountdown(), 1000);
    });
  }

  updateCountdown() {
    if (!this.blockedUntil) return;
    const until = new Date(this.blockedUntil).getTime();
    const now = Date.now();
    const diff = Math.max(0, until - now);
    this.minutesLeft = Math.floor(diff / 60000);
    this.secondsLeft = Math.floor((diff % 60000) / 1000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
} 