import { booleanAttribute, Component, EventEmitter, Input, numberAttribute, Output } from '@angular/core';

@Component({
  selector: 'lux-async-state',
  standalone: false,
  template: `
    <div *ngIf="loading" class="lux-async-state__loading" aria-busy="true" [attr.aria-label]="loadingLabel">
      <span class="sr-only">{{ loadingLabel }}</span>
      <lux-skeleton
        *ngFor="let item of skeletonItems"
        width="100%"
        [height]="skeletonHeight"
      ></lux-skeleton>
    </div>

    <div *ngIf="!loading && error" class="lux-async-state__message" role="alert">
      <p class="lux-overline">Unable to load</p>
      <p class="lux-body">{{ error }}</p>
      <button type="button" class="lux-btn lux-btn--secondary" (click)="retry.emit()">Try again</button>
    </div>

    <lux-empty-state
      *ngIf="!loading && !error && empty"
      [eyebrow]="emptyEyebrow"
      [title]="emptyTitle"
      [message]="emptyMessage"
    >
      <ng-content select="[empty-action]"></ng-content>
    </lux-empty-state>

    <ng-container *ngIf="!loading && !error && !empty">
      <ng-content></ng-content>
    </ng-container>
  `,
  styles: [`
    :host { display: block; }
    .lux-async-state__loading {
      display: grid;
      grid-template-columns: repeat(var(--lux-skeleton-columns, 4), minmax(0, 1fr));
      gap: 1.5rem;
    }
    .lux-async-state__message {
      display: flex;
      padding: 3rem 1.5rem;
      align-items: center;
      flex-direction: column;
      gap: 1rem;
      text-align: center;
      border-block: var(--lux-border-hair);
    }
    .lux-async-state__message p { margin: 0; }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    @media (max-width: 900px) {
      .lux-async-state__loading { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  `],
})
export class LuxAsyncStateComponent {
  @Input({ transform: booleanAttribute }) loading = false;
  @Input() error = '';
  @Input({ transform: booleanAttribute }) empty = false;
  @Input() loadingLabel = 'Loading content';
  @Input({ transform: numberAttribute }) skeletonCount = 4;
  @Input() skeletonHeight = '20rem';
  @Input() emptyEyebrow = 'Collection';
  @Input() emptyTitle = 'Nothing here yet';
  @Input() emptyMessage = '';

  @Output() retry = new EventEmitter<void>();

  get skeletonItems(): number[] {
    return Array.from({ length: Math.max(1, this.skeletonCount || 1) }, (_, index) => index);
  }
}
