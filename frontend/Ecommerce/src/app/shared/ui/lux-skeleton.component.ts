import { Component, Input } from '@angular/core';

@Component({
  selector: 'lux-skeleton',
  standalone: false,
  template: `
    <div
      class="lux-skeleton"
      [style.width]="width"
      [style.height]="height"
      [attr.aria-hidden]="true"
    ></div>
  `,
  styles: [`:host { display: block; }`],
})
export class LuxSkeletonComponent {
  @Input() width = '100%';
  @Input() height = '1rem';
}
