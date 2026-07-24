import { Component } from '@angular/core';
import { RevenueTargetService } from '../services/revenue-target.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LuxUiModule } from '../shared/ui/lux-ui.module';
import { LuxDialogService } from '../shared/dialog/lux-dialog.service';

@Component({
  selector: 'app-revenue-target-admin',
  template: `
  <lux-page-shell variant="admin">
    <lux-page-header
      variant="admin"
      eyebrow="Settings"
      title="Revenue Target"
      subtitle="Configure revenue targets for daily, weekly, monthly, or yearly periods.">
    </lux-page-header>

    <lux-card eyebrow="Configuration" title="Set a target">
      <form (ngSubmit)="setTarget()" class="lux-settings-form">
        <div class="lux-settings-grid">
          <lux-field label="Period type" inputId="periodType">
            <select
              id="periodType"
              class="lux-select"
              [(ngModel)]="periodType"
              name="periodType"
              (change)="onPeriodTypeChange()">
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </lux-field>

          <lux-field
            label="Period value"
            inputId="periodValue"
            [hint]="periodHint">
            <input
              type="text"
              id="periodValue"
              class="lux-input"
              [(ngModel)]="periodValue"
              name="periodValue"
              [placeholder]="periodPlaceholder"
              required />
          </lux-field>

          <lux-field label="Target amount" inputId="targetAmount">
            <input
              type="number"
              id="targetAmount"
              class="lux-input"
              [(ngModel)]="targetAmount"
              name="targetAmount"
              placeholder="0"
              min="0"
              step="0.01"
              required />
          </lux-field>

          <div class="lux-period-preview">
            <p class="lux-field-label">Current period</p>
            <p class="lux-period-preview__value">
              <span>{{ getPeriodDisplayName() }}</span>
              <span class="lux-period-preview__code">{{ periodValue }}</span>
            </p>
          </div>
        </div>

        <div class="lux-settings-actions">
          <lux-button
            type="submit"
            variant="primary"
            [disabled]="!periodValue || targetAmount <= 0">
            Set Target
          </lux-button>
        </div>
      </form>
    </lux-card>

    <lux-card eyebrow="Guidance" title="How it works">
      <ol class="lux-steps">
        <li>
          <strong>Select period type</strong>
          <span>Choose daily, weekly, monthly, or yearly.</span>
        </li>
        <li>
          <strong>Set period value</strong>
          <span>Enter the period using the format shown under the field.</span>
        </li>
        <li>
          <strong>Define target amount</strong>
          <span>Set the revenue goal for that period.</span>
        </li>
        <li>
          <strong>Monitor progress</strong>
          <span>Track results against the target on the dashboard.</span>
        </li>
      </ol>
    </lux-card>
  </lux-page-shell>
  `,
  styles: [`
    .lux-settings-form { display: flex; flex-direction: column; gap: 1.75rem; }
    .lux-settings-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1.5rem 1.75rem;
    }
    .lux-settings-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 0.5rem;
      border-top: 1px solid var(--lux-fog);
    }
    .lux-period-preview {
      padding: 1rem 0;
      border-bottom: 1px solid var(--lux-fog);
    }
    .lux-period-preview__value {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0.75rem;
      margin: 0;
      font-family: var(--lux-font-serif);
      font-size: 1.125rem;
      color: var(--lux-ink);
    }
    .lux-period-preview__code {
      font-family: var(--lux-font-sans);
      font-size: 0.8125rem;
      letter-spacing: 0.06em;
      color: var(--lux-stone);
    }
    .lux-steps {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1.25rem 1.75rem;
      counter-reset: lux-step;
    }
    .lux-steps li {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.35rem 0.85rem;
      align-items: start;
      counter-increment: lux-step;
    }
    .lux-steps li::before {
      content: counter(lux-step);
      grid-row: 1 / span 2;
      width: 1.75rem;
      height: 1.75rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--lux-fog);
      background: var(--lux-champagne-soft);
      color: var(--lux-espresso);
      font-size: 0.75rem;
      font-weight: 500;
    }
    .lux-steps strong {
      font-family: var(--lux-font-sans);
      font-size: 0.8125rem;
      letter-spacing: 0.04em;
      color: var(--lux-ink);
    }
    .lux-steps span {
      grid-column: 2;
      font-size: 0.875rem;
      color: var(--lux-graphite);
      line-height: 1.45;
    }
    @media (max-width: 768px) {
      .lux-settings-grid,
      .lux-steps { grid-template-columns: 1fr; }
    }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule, LuxUiModule]
})
export class RevenueTargetAdminComponent {
  periodType: string = 'day';
  periodValue: string = '';
  targetAmount: number = 0;

  constructor(
    private revenueTargetService: RevenueTargetService,
    private luxDialog: LuxDialogService
  ) {
    this.setDefaultPeriodValue();
  }

  get periodHint(): string {
    switch (this.periodType) {
      case 'day': return 'Format: YYYY-MM-DD (e.g., 2024-07-18)';
      case 'week': return 'Format: YYYY-WNN (e.g., 2024-W29)';
      case 'month': return 'Format: YYYY-MM (e.g., 2024-07)';
      case 'year': return 'Format: YYYY (e.g., 2024)';
      default: return '';
    }
  }

  get periodPlaceholder(): string {
    switch (this.periodType) {
      case 'day': return '2024-07-18';
      case 'week': return '2024-W29';
      case 'month': return '2024-07';
      case 'year': return '2024';
      default: return '';
    }
  }

  setDefaultPeriodValue() {
    const now = new Date();
    switch (this.periodType) {
      case 'day':
        this.periodValue = now.toISOString().slice(0, 10);
        break;
      case 'week':
        const week = this.getWeekNumber(now);
        this.periodValue = `${now.getFullYear()}-W${week}`;
        break;
      case 'month':
        this.periodValue = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        break;
      case 'year':
        this.periodValue = `${now.getFullYear()}`;
        break;
      default:
        this.periodValue = '';
    }
  }

  getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.valueOf() - firstDayOfYear.valueOf()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  onPeriodTypeChange() {
    this.setDefaultPeriodValue();
  }

  getPeriodDisplayName(): string {
    switch (this.periodType) {
      case 'day': return 'Daily Target';
      case 'week': return 'Weekly Target';
      case 'month': return 'Monthly Target';
      case 'year': return 'Yearly Target';
      default: return 'Target';
    }
  }

  setTarget() {
    if (!this.periodValue || this.targetAmount <= 0) {
      this.luxDialog.warning('Validation Error', 'Please fill in all required fields with valid values.');
      return;
    }

    this.revenueTargetService.setTarget(this.periodType, this.periodValue, this.targetAmount).subscribe({
      next: () => {
        this.luxDialog.success('Success', 'Revenue target set successfully!');
        this.targetAmount = 0;
      },
      error: (error) => {
        console.error('Error setting target:', error);
        this.luxDialog.error('Error', 'Failed to set revenue target. Please try again.');
      }
    });
  }
}
