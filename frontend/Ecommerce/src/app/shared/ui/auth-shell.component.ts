import { Component, Input } from '@angular/core';

/**
 * Split-screen luxury auth layout (blueprint §3.1).
 * Wrap Login / Register / OTP / Reset forms with this shell.
 */
@Component({
  selector: 'lux-auth-shell',
  standalone: false,
  template: `
    <div class="lux-auth-shell">
      <aside class="lux-auth-shell__visual" data-lux-theme="noir" aria-hidden="true">
        <img [src]="imageUrl" [alt]="''" />
        <div class="lux-auth-shell__scrim"></div>
        <div class="lux-auth-shell__brand">
          <p class="lux-overline" style="color: var(--lux-champagne-soft); margin-bottom: 0.75rem;">
            {{ tagline }}
          </p>
          <h1 class="lux-display" style="color: #F7F3EC; font-size: clamp(2.5rem, 4vw, 3.5rem);">
            {{ brand }}
          </h1>
        </div>
      </aside>
      <section class="lux-auth-shell__panel">
        <div class="lux-auth-shell__form animate-slide-up">
          <ng-content></ng-content>
        </div>
      </section>
    </div>
  `,
})
export class AuthShellComponent {
  @Input() brand = 'Britium Gallery';
  @Input() tagline = 'Curated luxury, quietly.';
  @Input() imageUrl = 'assets/images/britium-logo.png';
}
