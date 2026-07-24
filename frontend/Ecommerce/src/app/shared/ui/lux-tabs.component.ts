import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface LuxTabItem {
  id: string;
  label: string;
  badge?: string | number;
  disabled?: boolean;
}

@Component({
  selector: 'lux-tabs',
  standalone: false,
  template: `
    <div class="lux-tabs" role="tablist">
      <button
        type="button"
        *ngFor="let tab of tabs"
        role="tab"
        class="lux-tabs__tab"
        [class.is-active]="tab.id === activeId"
        [disabled]="tab.disabled"
        [attr.aria-selected]="tab.id === activeId"
        (click)="select(tab.id)"
      >
        <span>{{ tab.label }}</span>
        <span *ngIf="tab.badge != null" class="lux-tabs__badge">{{ tab.badge }}</span>
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .lux-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      border-bottom: 1px solid var(--lux-fog);
    }
    .lux-tabs__tab {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      min-height: 2.75rem;
      padding: 0.65rem 1rem;
      border: none;
      background: transparent;
      color: var(--lux-stone);
      font-family: var(--lux-font-sans);
      font-size: 0.75rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      cursor: pointer;
    }
    .lux-tabs__tab:hover:not(:disabled) { color: var(--lux-ink); }
    .lux-tabs__tab.is-active {
      color: var(--lux-ink);
    }
    .lux-tabs__tab.is-active::after {
      content: '';
      position: absolute;
      left: 0.75rem;
      right: 0.75rem;
      bottom: -1px;
      height: 2px;
      background: var(--lux-champagne);
    }
    .lux-tabs__tab:disabled { opacity: 0.4; cursor: not-allowed; }
    .lux-tabs__badge {
      display: inline-flex;
      min-width: 1.25rem;
      padding: 0.1rem 0.35rem;
      border-radius: var(--lux-radius-sm);
      background: var(--lux-champagne-soft);
      color: var(--lux-espresso);
      font-size: 0.65rem;
      letter-spacing: 0;
    }
  `],
})
export class LuxTabsComponent {
  @Input() tabs: LuxTabItem[] = [];
  @Input() activeId = '';
  @Output() activeIdChange = new EventEmitter<string>();

  select(id: string): void {
    if (id === this.activeId) return;
    this.activeIdChange.emit(id);
  }
}
