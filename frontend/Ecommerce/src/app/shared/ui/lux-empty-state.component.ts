import { Component, Input } from '@angular/core';

@Component({
  selector: 'lux-empty-state',
  standalone: false,
  template: `
    <div class="lux-empty">
      <p class="lux-overline mb-3">{{ eyebrow || 'Nothing here yet' }}</p>
      <h2 class="lux-h2 mb-3">{{ title }}</h2>
      <p *ngIf="message" class="lux-body mb-6">{{ message }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .lux-empty {
      text-align: center;
      padding: 4rem 1.5rem;
      background: var(--lux-cream);
      border: var(--lux-border-hair);
    }
    .mb-3 { margin-bottom: 0.75rem; }
    .mb-6 { margin-bottom: 1.5rem; }
  `],
})
export class LuxEmptyStateComponent {
  @Input() eyebrow = '';
  @Input() title = 'No results';
  @Input() message = '';
  /** Alias used by some pages */
  @Input() set description(value: string) {
    this.message = value;
  }
}
