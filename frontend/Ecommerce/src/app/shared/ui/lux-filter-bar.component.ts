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
    :host { display: block; width: 100%; }
    .lux-filter-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 0.75rem 1.25rem;
      margin-bottom: 0;
      padding: 1rem 1.1rem;
      background: var(--lux-cream);
      border: 1px solid var(--lux-fog);
      border-radius: var(--lux-radius-md);
    }
    .lux-filter-bar__primary {
      flex: 1 1 18rem;
      min-width: 0;
      width: 100%;
      max-width: 100%;
    }
    .lux-filter-bar__primary > * {
      width: 100%;
      min-width: 0;
    }
    .lux-filter-bar__secondary {
      display: flex;
      flex: 0 0 auto;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
      gap: 0.5rem 0.75rem;
      padding-bottom: 0.15rem;
    }
    @media (max-width: 768px) {
      .lux-filter-bar {
        flex-direction: column;
        align-items: stretch;
      }
      .lux-filter-bar__secondary {
        justify-content: flex-start;
      }
    }
  `],
})
export class LuxFilterBarComponent {}
