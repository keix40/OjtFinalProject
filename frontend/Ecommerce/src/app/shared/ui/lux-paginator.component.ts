import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'lux-paginator',
  standalone: false,
  template: `
    <nav class="lux-paginator" aria-label="Pagination">
      <p class="lux-paginator__meta" *ngIf="totalElements > 0">
        Showing {{ from }}–{{ to }} of {{ totalElements }}
      </p>
      <p class="lux-paginator__meta" *ngIf="totalElements === 0">No results</p>
      <div class="lux-paginator__controls">
        <button
          type="button"
          class="lux-paginator__btn"
          [disabled]="page <= 0"
          (click)="go(page - 1)"
        >
          Prev
        </button>
        <span class="lux-paginator__page">{{ page + 1 }} / {{ totalPages || 1 }}</span>
        <button
          type="button"
          class="lux-paginator__btn"
          [disabled]="page + 1 >= totalPages"
          (click)="go(page + 1)"
        >
          Next
        </button>
      </div>
    </nav>
  `,
  styles: [`
    :host { display: block; }
    .lux-paginator {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.75rem 0;
      font-family: var(--lux-font-sans);
      color: var(--lux-graphite);
      font-size: 0.8125rem;
    }
    .lux-paginator__controls {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .lux-paginator__btn {
      min-height: 2.25rem;
      padding: 0.4rem 0.9rem;
      border: 1px solid var(--lux-fog);
      border-radius: var(--lux-radius-sm);
      background: var(--lux-cream);
      color: var(--lux-ink);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-size: 0.7rem;
      cursor: pointer;
    }
    .lux-paginator__btn:hover:not(:disabled) {
      border-color: var(--lux-champagne);
      background: var(--lux-champagne-soft);
    }
    .lux-paginator__btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .lux-paginator__page {
      min-width: 4.5rem;
      text-align: center;
      color: var(--lux-ink);
      font-variant-numeric: tabular-nums;
    }
  `],
})
export class LuxPaginatorComponent {
  @Input() page = 0;
  @Input() size = 10;
  @Input() totalElements = 0;
  @Input() totalPages = 0;
  @Output() pageChange = new EventEmitter<number>();

  get from(): number {
    if (this.totalElements === 0) return 0;
    return this.page * this.size + 1;
  }

  get to(): number {
    return Math.min((this.page + 1) * this.size, this.totalElements);
  }

  go(next: number): void {
    if (next < 0 || (this.totalPages > 0 && next >= this.totalPages)) return;
    this.pageChange.emit(next);
  }
}
