import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LuxButtonComponent } from './lux-button.component';
import { LuxCardComponent } from './lux-card.component';
import { LuxBadgeComponent } from './lux-badge.component';
import { LuxSkeletonComponent } from './lux-skeleton.component';
import { LuxEmptyStateComponent } from './lux-empty-state.component';
import { AuthShellComponent } from './auth-shell.component';
import { LuxProductCardComponent } from './lux-product-card.component';
import { LuxAsyncStateComponent } from './lux-async-state.component';
import { LuxFieldComponent } from './lux-field.component';
import { LuxIconButtonComponent } from './lux-icon-button.component';
import { LuxPaginatorComponent } from './lux-paginator.component';
import { LuxTabsComponent } from './lux-tabs.component';
import { LuxPageHeaderComponent } from './lux-page-header.component';
import { LuxFilterBarComponent } from './lux-filter-bar.component';
import { LuxColumnDirective, LuxTableComponent } from './lux-table.component';
import { LuxPageShellComponent } from './lux-page-shell.component';

const UI = [
  LuxButtonComponent,
  LuxCardComponent,
  LuxBadgeComponent,
  LuxSkeletonComponent,
  LuxEmptyStateComponent,
  AuthShellComponent,
  LuxProductCardComponent,
  LuxAsyncStateComponent,
  LuxFieldComponent,
  LuxIconButtonComponent,
  LuxPaginatorComponent,
  LuxTabsComponent,
  LuxPageHeaderComponent,
  LuxFilterBarComponent,
  LuxTableComponent,
  LuxColumnDirective,
  LuxPageShellComponent,
];

@NgModule({
  declarations: UI,
  imports: [CommonModule],
  exports: UI,
})
export class LuxUiModule {}
