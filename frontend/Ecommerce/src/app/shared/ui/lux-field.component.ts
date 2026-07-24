import { Component, Input } from '@angular/core';

@Component({
  selector: 'lux-field',
  standalone: false,
  template: `
    <label class="lux-field" [attr.for]="inputId || null">
      <span *ngIf="label" class="lux-field-label">{{ label }}</span>
      <ng-content></ng-content>
      <span *ngIf="hint && !error" class="lux-field-hint">{{ hint }}</span>
      <span *ngIf="error" class="lux-field-error" role="alert">{{ error }}</span>
    </label>
  `,
  styles: [`
    :host { display: block; }
    .lux-field { display: block; }
    .lux-field-hint {
      display: block;
      margin-top: 0.375rem;
      font-size: 0.75rem;
      color: var(--lux-stone);
    }
  `],
})
export class LuxFieldComponent {
  @Input() label = '';
  @Input() hint = '';
  @Input() error = '';
  @Input() inputId = '';
}
