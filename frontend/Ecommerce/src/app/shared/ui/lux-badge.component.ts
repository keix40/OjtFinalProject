import { Component, Input } from '@angular/core';

@Component({
  selector: 'lux-badge',
  standalone: false,
  template: `
    <span
      class="lux-badge"
      [class.lux-badge--success]="tone === 'success'"
      [class.lux-badge--warning]="tone === 'warning'"
      [class.lux-badge--danger]="tone === 'danger'"
      [class.lux-badge--info]="tone === 'info'"
    >
      <ng-content></ng-content>
    </span>
  `,
})
export class LuxBadgeComponent {
  @Input() tone: 'default' | 'success' | 'warning' | 'danger' | 'info' = 'default';
}
