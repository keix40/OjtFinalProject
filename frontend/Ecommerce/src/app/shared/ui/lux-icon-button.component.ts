import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'lux-icon-button',
  standalone: false,
  template: `
    <button
      type="button"
      class="lux-icon-btn"
      [class.lux-icon-btn--danger]="tone === 'danger'"
      [class.lux-icon-btn--ghost]="tone === 'ghost'"
      [disabled]="disabled"
      [attr.aria-label]="label"
      [attr.title]="label"
      (click)="pressed.emit($event)"
    >
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    :host { display: inline-flex; }
    .lux-icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      padding: 0;
      border: 1px solid var(--lux-fog);
      border-radius: var(--lux-radius-sm);
      background: var(--lux-cream);
      color: var(--lux-ink);
      cursor: pointer;
      transition:
        background-color var(--lux-dur) var(--lux-ease),
        border-color var(--lux-dur) var(--lux-ease),
        color var(--lux-dur) var(--lux-ease);
    }
    .lux-icon-btn:hover:not(:disabled) {
      border-color: var(--lux-champagne);
      background: var(--lux-champagne-soft);
    }
    .lux-icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .lux-icon-btn--ghost {
      border-color: transparent;
      background: transparent;
    }
    .lux-icon-btn--danger {
      color: var(--lux-danger);
      border-color: rgba(158, 74, 67, 0.25);
    }
    .lux-icon-btn--danger:hover:not(:disabled) {
      background: rgba(158, 74, 67, 0.1);
      border-color: var(--lux-danger);
    }
  `],
})
export class LuxIconButtonComponent {
  @Input() label = 'Action';
  @Input() tone: 'default' | 'ghost' | 'danger' = 'default';
  @Input() disabled = false;
  @Output() pressed = new EventEmitter<MouseEvent>();
}
