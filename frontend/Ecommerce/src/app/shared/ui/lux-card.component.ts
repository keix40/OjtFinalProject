import { Component, Input } from '@angular/core';

@Component({
  selector: 'lux-card',
  standalone: false,
  template: `
    <article class="lux-card" [class.lux-card--interactive]="interactive">
      <div *ngIf="imageUrl" class="lux-card__media">
        <img [src]="imageUrl" [alt]="imageAlt || title || ''" loading="lazy" />
      </div>
      <div class="lux-card__body">
        <p *ngIf="eyebrow" class="lux-overline mb-2">{{ eyebrow }}</p>
        <h3 *ngIf="title" class="lux-h3 mb-1">{{ title }}</h3>
        <p *ngIf="price" class="lux-data" style="font-family: var(--lux-font-serif); font-size: 1.125rem; color: var(--lux-ink);">
          {{ price }}
        </p>
        <ng-content></ng-content>
      </div>
    </article>
  `,
  styles: [`
    :host { display: block; }
    .lux-card--interactive { cursor: pointer; }
    .mb-1 { margin-bottom: 0.25rem; }
    .mb-2 { margin-bottom: 0.5rem; }
  `],
})
export class LuxCardComponent {
  @Input() title = '';
  @Input() eyebrow = '';
  @Input() price = '';
  @Input() imageUrl = '';
  @Input() imageAlt = '';
  @Input() interactive = false;
}
