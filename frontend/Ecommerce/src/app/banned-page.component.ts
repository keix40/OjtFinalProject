import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-banned-page',
  template: `
    <div class="lux-block-page">
      <div class="lux-block-card">
        <p class="lux-overline mb-4">Security</p>
        <div class="lux-block-icon" aria-hidden="true">
          <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 class="lux-h1 mb-3" style="font-size: clamp(1.75rem, 3vw, 2.25rem);">
          Temporarily restricted
        </h1>
        <p class="lux-body mb-6">
          Your access has been blocked for security reasons.
        </p>
        <div class="lux-block-notice" *ngIf="minutesLeft > 0 || secondsLeft > 0">
          <span class="lux-overline mb-2 block">Time remaining</span>
          <span class="lux-h3">{{ minutesLeft }}m {{ secondsLeft }}s</span>
        </div>
        <p class="lux-body-sm" *ngIf="minutesLeft <= 0 && secondsLeft <= 0">
          You may try again now.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .lux-block-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      background:
        radial-gradient(ellipse at top, rgba(232, 220, 194, 0.45), transparent 55%),
        var(--lux-ivory);
      color: var(--lux-ink);
    }
    .lux-block-card {
      width: 100%;
      max-width: 28rem;
      padding: 3rem 2rem;
      text-align: center;
      background: var(--lux-cream);
      border: var(--lux-border-hair);
      box-shadow: var(--lux-shadow-md);
    }
    .lux-block-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 4rem;
      height: 4rem;
      margin-bottom: 1.5rem;
      color: var(--lux-danger);
      background: rgba(158, 74, 67, 0.1);
      border: 1px solid rgba(158, 74, 67, 0.2);
    }
    .lux-block-notice {
      padding: 1.25rem 1.5rem;
      margin-bottom: 1rem;
      background: var(--lux-ivory);
      border: 1px solid var(--lux-fog);
    }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .block { display: block; }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class BannedPageComponent implements OnInit, OnDestroy {
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
