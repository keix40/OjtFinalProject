import { Component } from '@angular/core';

@Component({
  selector: 'lux-filter-bar',
  standalone: false,
  template: `
    <section class="lux-filter-bar">
      <div class="lux-filter-bar__primary">
        <ng-content select="[primary]"></ng-content>
        <ng-content></ng-content>
      </div>
      <div class="lux-filter-bar__secondary">
        <ng-content select="[secondary]"></ng-content>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .lux-filter-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 0.75rem 1rem;
      margin-bottom: 1rem;
      padding: 1rem;
      background: var(--lux-cream);
      border: 1px solid var(--lux-fog);
      border-radius: var(--lux-radius-md);
    }
    .lux-filter-bar__primary,
    .lux-filter-bar__secondary {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem 0.75rem;
    }
  `],
})
export class LuxFilterBarComponent {}
