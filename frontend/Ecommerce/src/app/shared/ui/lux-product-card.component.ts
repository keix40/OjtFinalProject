import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'lux-product-card',
  standalone: false,
  template: `
    <article class="lux-product-card">
      <button
        type="button"
        class="lux-product-card__link"
        (click)="selected.emit()"
        [attr.aria-label]="'View ' + name"
      >
        <span class="lux-product-card__media">
          <img
            [src]="imageUrl"
            [alt]="name"
            loading="lazy"
            (error)="imageError.emit($event)"
          />
          <img
            *ngIf="secondaryImageUrl"
            class="lux-product-card__secondary"
            [src]="secondaryImageUrl"
            alt=""
            loading="lazy"
          />
          <span class="lux-product-card__labels" *ngIf="badge || saleLabel">
            <span *ngIf="badge" class="lux-product-card__badge">{{ badge }}</span>
            <span *ngIf="saleLabel" class="lux-product-card__badge lux-product-card__badge--sale">
              {{ saleLabel }}
            </span>
          </span>
        </span>

        <span class="lux-product-card__body">
          <span *ngIf="brand" class="lux-overline">{{ brand }}</span>
          <span class="lux-product-card__name">{{ name }}</span>
          <span *ngIf="rating !== null" class="lux-product-card__rating">
            <span aria-hidden="true">★</span>
            <span>{{ rating | number:'1.1-1' }}</span>
            <span *ngIf="reviewCount !== null">({{ reviewCount }})</span>
          </span>
          <span class="lux-product-card__price">
            <span [class.lux-product-card__price--sale]="originalPrice">{{ price }}</span>
            <span *ngIf="originalPrice" class="lux-product-card__price--was">{{ originalPrice }}</span>
          </span>
        </span>
      </button>
    </article>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .lux-product-card { height: 100%; margin: 0; }
    .lux-product-card__link {
      display: flex;
      width: 100%;
      height: 100%;
      padding: 0;
      flex-direction: column;
      text-align: left;
      color: var(--lux-ink);
      background: transparent;
      border: 0;
      cursor: pointer;
    }
    .lux-product-card__media {
      position: relative;
      display: block;
      width: 100%;
      aspect-ratio: 3 / 4;
      overflow: hidden;
      background: var(--lux-fog);
    }
    .lux-product-card__media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform var(--lux-dur-slow) var(--lux-ease), opacity var(--lux-dur-slow) var(--lux-ease);
    }
    .lux-product-card__secondary {
      position: absolute;
      inset: 0;
      opacity: 0;
    }
    .lux-product-card__link:hover img:first-child,
    .lux-product-card__link:focus-visible img:first-child { transform: scale(1.025); }
    .lux-product-card__link:hover .lux-product-card__secondary,
    .lux-product-card__link:focus-visible .lux-product-card__secondary { opacity: 1; }
    .lux-product-card__labels {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
      display: flex;
      max-width: calc(100% - 1.5rem);
      flex-wrap: wrap;
      gap: 0.375rem;
    }
    .lux-product-card__badge {
      padding: 0.35rem 0.55rem;
      color: var(--lux-ivory);
      background: var(--lux-ink);
      font: 500 0.625rem/1 var(--lux-font-sans);
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .lux-product-card__badge--sale {
      color: var(--lux-ink);
      background: var(--lux-champagne);
    }
    .lux-product-card__body {
      display: flex;
      padding-top: 1rem;
      flex-direction: column;
      gap: 0.35rem;
    }
    .lux-product-card__name {
      font: 600 1.25rem/1.25 var(--lux-font-serif);
    }
    .lux-product-card__rating {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      color: var(--lux-stone);
      font: 400 0.75rem/1.4 var(--lux-font-sans);
    }
    .lux-product-card__rating span:first-child { color: var(--lux-champagne-deep); }
    .lux-product-card__price {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 0.55rem;
      color: var(--lux-ink);
      font: 500 0.875rem/1.4 var(--lux-font-sans);
      font-variant-numeric: tabular-nums;
    }
    .lux-product-card__price--sale { color: var(--lux-danger); }
    .lux-product-card__price--was {
      color: var(--lux-stone);
      font-size: 0.75rem;
      text-decoration: line-through;
    }
    @media (prefers-reduced-motion: reduce) {
      .lux-product-card__media img { transition: none; }
      .lux-product-card__link:hover img:first-child,
      .lux-product-card__link:focus-visible img:first-child { transform: none; }
    }
  `],
})
export class LuxProductCardComponent {
  @Input({ required: true }) name = '';
  @Input({ required: true }) imageUrl = '';
  @Input({ required: true }) price = '';
  @Input() originalPrice = '';
  @Input() secondaryImageUrl = '';
  @Input() brand = '';
  @Input() badge = '';
  @Input() saleLabel = '';
  @Input() rating: number | null = null;
  @Input() reviewCount: number | null = null;

  @Output() selected = new EventEmitter<void>();
  @Output() imageError = new EventEmitter<Event>();
}
