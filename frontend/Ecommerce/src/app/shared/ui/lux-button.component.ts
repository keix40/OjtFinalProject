import { booleanAttribute, Component, EventEmitter, Input, Output } from '@angular/core';

export type LuxButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost';
export type LuxButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'lux-button',
  standalone: false,
  template: `
    <button
      [attr.type]="type"
      class="lux-btn"
      [class.lux-btn--primary]="variant === 'primary'"
      [class.lux-btn--secondary]="variant === 'secondary'"
      [class.lux-btn--accent]="variant === 'accent'"
      [class.lux-btn--ghost]="variant === 'ghost'"
      [disabled]="disabled || loading"
      [style.width]="block ? '100%' : null"
      (click)="pressed.emit($event)"
    >
      <span *ngIf="loading" class="lux-btn__spinner" aria-hidden="true"></span>
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    :host { display: inline-block; }
    :host([block]) { display: block; width: 100%; }
    .lux-btn__spinner {
      width: 14px;
      height: 14px;
      border: 1.5px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: lux-spin 0.7s linear infinite;
    }
    @keyframes lux-spin { to { transform: rotate(360deg); } }
  `],
})
export class LuxButtonComponent {
  @Input() variant: LuxButtonVariant = 'primary';
  @Input() type: LuxButtonType = 'button';
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) loading = false;
  @Input({ transform: booleanAttribute }) block = false;
  @Output() pressed = new EventEmitter<MouseEvent>();
}
