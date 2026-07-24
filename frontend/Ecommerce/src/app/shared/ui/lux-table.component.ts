import {
  AfterContentInit,
  Component,
  ContentChildren,
  EventEmitter,
  Input,
  Output,
  QueryList,
  Directive,
  TemplateRef,
} from '@angular/core';

@Directive({
  selector: 'ng-template[luxColumn]',
  standalone: false,
})
export class LuxColumnDirective {
  @Input('luxColumn') key = '';
  @Input() header = '';
  @Input() align: 'left' | 'center' | 'right' = 'left';
  constructor(public template: TemplateRef<{ $implicit: unknown; row: unknown }>) {}
}

@Component({
  selector: 'lux-table',
  standalone: false,
  template: `
    <div class="lux-table-wrap">
      <table class="lux-table">
        <thead>
          <tr>
            <th *ngIf="selectable" class="lux-table__check">
              <input
                type="checkbox"
                [checked]="allSelected"
                [attr.aria-checked]="partialSelected ? 'mixed' : allSelected"
                (change)="toggleAll.emit($any($event.target).checked)"
                aria-label="Select all rows"
              />
            </th>
            <th *ngFor="let col of columns" [style.textAlign]="col.align">
              {{ col.header || col.key }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr *ngIf="!rows?.length">
            <td [attr.colspan]="columns.length + (selectable ? 1 : 0)" class="lux-table__empty">
              <ng-content select="[empty]"></ng-content>
              <span class="lux-table__empty-fallback">No records found</span>
            </td>
          </tr>
          <tr *ngFor="let row of rows; let i = index; trackBy: trackByFn">
            <td *ngIf="selectable" class="lux-table__check">
              <input
                type="checkbox"
                [checked]="isSelected(row)"
                (change)="toggleRow.emit({ row: row, checked: $any($event.target).checked })"
                aria-label="Select row"
              />
            </td>
            <td *ngFor="let col of columns" [style.textAlign]="col.align">
              <ng-container *ngTemplateOutlet="col.template; context: { $implicit: row, row: row }"></ng-container>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .lux-table-wrap {
      overflow-x: auto;
      border: 1px solid var(--lux-fog);
      border-radius: var(--lux-radius-md);
      background: var(--lux-cream);
    }
    .lux-table {
      width: 100%;
      border-collapse: collapse;
      font-family: var(--lux-font-sans);
      font-size: 0.875rem;
      color: var(--lux-ink);
    }
    .lux-table th {
      padding: 0.75rem 1rem;
      text-align: left;
      font-size: 0.6875rem;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--lux-stone);
      background: rgba(247, 243, 236, 0.85);
      border-bottom: 1px solid var(--lux-fog);
      white-space: nowrap;
    }
    .lux-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--lux-fog);
      vertical-align: middle;
    }
    .lux-table tbody tr:last-child td { border-bottom: none; }
    .lux-table tbody tr:hover td { background: rgba(232, 220, 194, 0.28); }
    .lux-table__check { width: 2.75rem; text-align: center; }
    .lux-table__empty {
      text-align: center;
      color: var(--lux-stone);
      padding: 2rem 1rem !important;
    }
    .lux-table-wrap:has([empty]) .lux-table__empty-fallback { display: none; }
    input[type='checkbox'] {
      accent-color: var(--lux-champagne-deep);
      width: 1rem;
      height: 1rem;
    }
  `],
})
export class LuxTableComponent implements AfterContentInit {
  @Input() rows: unknown[] = [];
  @Input() selectable = false;
  @Input() allSelected = false;
  @Input() partialSelected = false;
  @Input() isSelected: (row: unknown) => boolean = () => false;
  @Input() trackBy: (index: number, row: unknown) => unknown = (_i, row) => row;
  @Output() toggleAll = new EventEmitter<boolean>();
  @Output() toggleRow = new EventEmitter<{ row: unknown; checked: boolean }>();

  @ContentChildren(LuxColumnDirective) columnQuery!: QueryList<LuxColumnDirective>;
  columns: LuxColumnDirective[] = [];

  ngAfterContentInit(): void {
    this.columns = this.columnQuery.toArray();
    this.columnQuery.changes.subscribe(() => {
      this.columns = this.columnQuery.toArray();
    });
  }

  trackByFn = (index: number, row: unknown) => this.trackBy(index, row);
}
