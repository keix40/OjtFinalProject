import { Component } from '@angular/core';
import { RevenueTargetService } from '../services/revenue-target.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-revenue-target-admin',
  templateUrl: './revenue-target-admin.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class RevenueTargetAdminComponent {
  periodType: string = 'day';
  periodValue: string = '';
  targetAmount: number = 0;
  message: string = '';

  constructor(private revenueTargetService: RevenueTargetService) {
    this.setDefaultPeriodValue();
  }

  setDefaultPeriodValue() {
    const now = new Date();
    switch (this.periodType) {
      case 'day':
        this.periodValue = now.toISOString().slice(0, 10); // YYYY-MM-DD
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

  setTarget() {
    this.revenueTargetService.setTarget(this.periodType, this.periodValue, this.targetAmount).subscribe({
      next: () => {
        this.message = 'Target set successfully!';
      },
      error: () => {
        this.message = 'Failed to set target.';
      }
    });
  }
} 