import { Injectable, signal, computed } from '@angular/core';

/**
 * Selection that survives pagination — keyed by entity id, never mutated onto row data.
 * Provide per-grid (not root) so each admin table owns its own selection.
 */
@Injectable()
export class SelectionStore<ID = number> {
  private readonly _selected = signal<Set<ID>>(new Set());
  readonly count = computed(() => this._selected().size);

  isSelected = (id: ID): boolean => this._selected().has(id);

  ids = (): ID[] => Array.from(this._selected());

  toggle(id: ID, on: boolean): void {
    const next = new Set(this._selected());
    on ? next.add(id) : next.delete(id);
    this._selected.set(next);
  }

  /** Select/deselect only the visible page ids, keeping prior pages. */
  setPage(pageIds: ID[], on: boolean): void {
    const next = new Set(this._selected());
    for (const id of pageIds) {
      on ? next.add(id) : next.delete(id);
    }
    this._selected.set(next);
  }

  isPageAllSelected = (pageIds: ID[]): boolean =>
    pageIds.length > 0 && pageIds.every((id) => this._selected().has(id));

  isPagePartialSelected = (pageIds: ID[]): boolean => {
    const n = pageIds.filter((id) => this._selected().has(id)).length;
    return n > 0 && n < pageIds.length;
  };

  clear(): void {
    this._selected.set(new Set());
  }
}
