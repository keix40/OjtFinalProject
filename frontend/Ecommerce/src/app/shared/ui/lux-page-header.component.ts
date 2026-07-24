import { Component, Input } from '@angular/core';

@Component({
  selector: 'lux-page-header',
  standalone: false,
  template: `
    <header class="lux-page-header" [class.lux-page-header--admin]="variant === 'admin'">
      <div class="lux-page-header__copy">
        <p *ngIf="eyebrow" class="lux-overline">{{ eyebrow }}</p>
        <h1 class="lux-page-header__title">{{ title }}</h1>
        <p *ngIf="subtitle" class="lux-page-header__subtitle">{{ subtitle }}</p>
      </div>
      <div class="lux-page-header__actions">
        <ng-content select="[actions]"></ng-content>
        <ng-content></ng-content>
      </div>
    </header>
  `,
  styles: [`
    :host { display: block; }
    .lux-page-header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem 1.5rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid var(--lux-fog);
    }
    .lux-page-header__title {
      margin: 0.25rem 0 0;
      font-family: var(--lux-font-serif);
      font-size: clamp(1.75rem, 2.4vw, 2.25rem);
      font-weight: 500;
      line-height: 1.15;
      color: var(--lux-ink);
      letter-spacing: 0.01em;
    }
    .lux-page-header__subtitle {
      margin: 0.5rem 0 0;
      max-width: 40rem;
      color: var(--lux-graphite);
      font-size: 0.9375rem;
      line-height: 1.5;
    }
    .lux-page-header__actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
    }
    .lux-page-header--admin .lux-page-header__title {
      font-size: clamp(1.35rem, 1.8vw, 1.75rem);
    }
  `],
})
export class LuxPageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() eyebrow = '';
  @Input() variant: 'customer' | 'admin' = 'customer';
}
