import { Component, Input } from '@angular/core';

@Component({
  selector: 'lux-page-shell',
  standalone: false,
  template: `
    <div
      class="lux-page-shell"
      [class.lux-page-shell--admin]="variant === 'admin'"
      [class.lux-page-shell--customer]="variant === 'customer'"
      [ngClass]="shellClass"
    >
      <ng-content select="lux-page-header"></ng-content>
      <ng-content select="[filters]"></ng-content>
      <div class="lux-page-shell__body">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .lux-page-shell {
      min-height: 100%;
      color: var(--lux-ink);
    }
    .lux-page-shell--customer {
      background: var(--lux-ivory);
      padding: 1.5rem 0 3rem;
    }
    .lux-page-shell--admin {
      background: transparent;
      padding: 0.25rem 0 1.5rem;
    }
    .lux-page-shell__body {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
  `],
})
export class LuxPageShellComponent {
  @Input() variant: 'customer' | 'admin' = 'customer';
  @Input() shellClass = '';
}
