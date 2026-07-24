import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ip-banned',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lux-block-page">
      <div class="lux-block-card">
        <p class="lux-overline mb-4">Security</p>
        <div class="lux-block-icon" aria-hidden="true">
          <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 class="lux-h1 mb-3" style="font-size: clamp(1.75rem, 3vw, 2.25rem);">IP address restricted</h1>
        <p class="lux-body mb-8">
          Your IP address has been temporarily restricted due to suspicious activity.
        </p>

        <dl class="lux-block-meta mb-8">
          <div class="lux-block-meta__row">
            <dt class="lux-overline">IP address</dt>
            <dd class="lux-body text-ink">{{ bannedIP }}</dd>
          </div>
          <div class="lux-block-meta__row">
            <dt class="lux-overline">Reason</dt>
            <dd class="lux-body text-ink">{{ banMessage }}</dd>
          </div>
          <div class="lux-block-meta__row">
            <dt class="lux-overline">Duration</dt>
            <dd class="lux-body text-ink">Temporary (usually 15 minutes)</dd>
          </div>
        </dl>

        <p class="lux-body-sm mb-6">
          If you believe this is an error, please contact support or try again later.
        </p>
        <button type="button" (click)="checkBanStatus()" class="lux-btn lux-btn--primary">
          Check ban status
        </button>
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
    .lux-block-meta {
      text-align: left;
      border-top: 1px solid var(--lux-fog);
      border-bottom: 1px solid var(--lux-fog);
    }
    .lux-block-meta__row {
      display: grid;
      gap: 0.35rem;
      padding: 1rem 0;
    }
    .lux-block-meta__row + .lux-block-meta__row {
      border-top: 1px solid var(--lux-fog);
    }
    .mb-3 { margin-bottom: 0.75rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mb-8 { margin-bottom: 2rem; }
    .text-ink { color: var(--lux-ink); }
  `]
})
export class IpBannedComponent implements OnInit {
  bannedIP: string = '';
  banMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.bannedIP = params['ip'] || localStorage.getItem('ipBanIP') || 'Unknown';
      this.banMessage = params['message'] || localStorage.getItem('ipBanMessage') || 'IP address banned due to suspicious activity';
    });
  }

  checkBanStatus() {
    localStorage.removeItem('ipBanned');
    localStorage.removeItem('ipBanMessage');
    localStorage.removeItem('ipBanIP');
    this.router.navigate(['/']);
  }
}
