import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-blacklist-blocked',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './blacklist-blocked.component.html',
  styleUrls: ['./blacklist-blocked.component.css']
})
export class BlacklistBlockedComponent implements OnInit, OnDestroy {
  @Input() reason: string = '';
  @Input() expiryDate: Date | string | null = null;
  countdown: string = '';
  private timer: any;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (!this.reason && params['reason']) {
        this.reason = params['reason'];
      }
      if (!this.expiryDate && params['expiryDate']) {
        this.expiryDate = params['expiryDate'];
      }
      this.startCountdown();
    });
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  startCountdown() {
    if (!this.expiryDate) return;
    if (this.timer) clearInterval(this.timer);
    this.updateCountdown();
    this.timer = setInterval(() => this.updateCountdown(), 1000);
  }

  updateCountdown() {
    if (!this.expiryDate) {
      this.countdown = '';
      return;
    }
    const now = new Date();
    const expiry = new Date(this.expiryDate);
    let diff = Math.max(0, expiry.getTime() - now.getTime());
    if (diff === 0) {
      this.countdown = 'Blacklist expired';
      clearInterval(this.timer);
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * 1000 * 60 * 60 * 24;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * 1000 * 60 * 60;
    const minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * 1000 * 60;
    const seconds = Math.floor(diff / 1000);
    this.countdown =
      (days > 0 ? days + ' day' + (days > 1 ? 's ' : ' ') : '') +
      (hours > 0 ? hours + ' hour' + (hours > 1 ? 's ' : ' ') : '') +
      (minutes > 0 ? minutes + ' minute' + (minutes > 1 ? 's ' : ' ') : '') +
      seconds + ' second' + (seconds !== 1 ? 's' : '');
  }
} 