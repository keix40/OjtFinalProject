import { Component } from '@angular/core';
import { RevenueTargetService } from '../services/revenue-target.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-revenue-target-admin',
  template: `
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-4xl mx-auto">
      
      <!-- Header Section -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 glassmorphism rounded-2xl shadow-lg mb-4">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Set Revenue Target</h1>
        <p class="text-gray-600">Configure revenue targets for different time periods</p>
      </div>

      <!-- Main Form Card -->
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        
        <!-- Form Header -->
        <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div class="flex items-center space-x-2">
            <div class="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-gray-900">Target Configuration</h2>
          </div>
        </div>

        <!-- Form Content -->
        <div class="p-6">
          <form (ngSubmit)="setTarget()" class="space-y-6">
            
            <!-- Two Column Layout -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- Left Column -->
              <div class="space-y-6">
                
                <!-- Period Type -->
                <div>
                  <label for="periodType" class="block text-sm font-medium text-gray-700 mb-2">
                    <div class="flex items-center space-x-2">
                      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      <span>Period Type</span>
                    </div>
                  </label>
                  <select 
                    id="periodType"
                    [(ngModel)]="periodType" 
                    name="periodType" 
                    (change)="onPeriodTypeChange()"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                  >
                    <option value="day">Daily</option>
                    <option value="week">Weekly</option>
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </div>

                <!-- Period Value -->
                <div>
                  <label for="periodValue" class="block text-sm font-medium text-gray-700 mb-2">
                    <div class="flex items-center space-x-2">
                      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span>Period Value</span>
                    </div>
                  </label>
                  <input 
                    type="text" 
                    id="periodValue"
                    [(ngModel)]="periodValue" 
                    name="periodValue" 
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g. 2024-07-18, 2024-W29, 2024-07, 2024"
                    required
                  />
                  <div class="mt-1 text-xs text-gray-500">
                    <span *ngIf="periodType === 'day'">Format: YYYY-MM-DD (e.g., 2024-07-18)</span>
                    <span *ngIf="periodType === 'week'">Format: YYYY-WNN (e.g., 2024-W29)</span>
                    <span *ngIf="periodType === 'month'">Format: YYYY-MM (e.g., 2024-07)</span>
                    <span *ngIf="periodType === 'year'">Format: YYYY (e.g., 2024)</span>
                  </div>
                </div>

              </div>

              <!-- Right Column -->
              <div class="space-y-6">
                
                <!-- Target Amount -->
                <div>
                  <label for="targetAmount" class="block text-sm font-medium text-gray-700 mb-2">
                    <div class="flex items-center space-x-2">
                      <i data-lucide="credit-card" class="w-4 h-4 inline mr-2"></i>
                      <span>Target Amount</span>
                    </div>
                  </label>
                  <div class="relative">
                    <input 
                      type="number" 
                      id="targetAmount"
                      [(ngModel)]="targetAmount" 
                      name="targetAmount" 
                      class="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <!-- Current Period Preview -->
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="flex items-center space-x-2 mb-2">
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    <span class="text-sm font-medium text-gray-700">Current Period</span>
                  </div>
                  <div class="text-sm text-gray-600">
                    <span class="font-medium">{{ getPeriodDisplayName() }}</span>
                    <span class="ml-2 text-gray-500">{{ periodValue }}</span>
                  </div>
                </div>

              </div>

            </div>

            <!-- Form Actions -->
            <div class="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button 
                type="submit"
                [disabled]="!periodValue || targetAmount <= 0"
                class="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>Set Target</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Information Card -->
      <div class="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div class="flex items-center space-x-2">
            <div class="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-gray-900">How It Works</h2>
          </div>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div class="flex items-start space-x-3">
                <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span class="text-xs font-medium text-blue-600">1</span>
                </div>
                <div>
                  <h3 class="text-sm font-medium text-gray-900">Select Period Type</h3>
                  <p class="text-sm text-gray-600">Choose between daily, weekly, monthly, or yearly targets</p>
                </div>
              </div>
              <div class="flex items-start space-x-3">
                <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span class="text-xs font-medium text-blue-600">2</span>
                </div>
                <div>
                  <h3 class="text-sm font-medium text-gray-900">Set Period Value</h3>
                  <p class="text-sm text-gray-600">Enter the specific period using the correct format</p>
                </div>
              </div>
            </div>
            <div class="space-y-4">
              <div class="flex items-start space-x-3">
                <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span class="text-xs font-medium text-blue-600">3</span>
                </div>
                <div>
                  <h3 class="text-sm font-medium text-gray-900">Define Target Amount</h3>
                  <p class="text-sm text-gray-600">Set the revenue target amount for the selected period</p>
                </div>
              </div>
              <div class="flex items-start space-x-3">
                <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span class="text-xs font-medium text-blue-600">4</span>
                </div>
                <div>
                  <h3 class="text-sm font-medium text-gray-900">Monitor Progress</h3>
                  <p class="text-sm text-gray-600">Track your revenue against the set targets</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class RevenueTargetAdminComponent {
  periodType: string = 'day';
  periodValue: string = '';
  targetAmount: number = 0;

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
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill in all required fields with valid values.',
        confirmButtonText: 'OK'
      });
      return;
    }

    this.revenueTargetService.setTarget(this.periodType, this.periodValue, this.targetAmount).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Revenue target set successfully!',
          confirmButtonText: 'OK'
        });
        // Reset form after successful submission
        this.targetAmount = 0;
      },
      error: (error) => {
        console.error('Error setting target:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to set revenue target. Please try again.',
          confirmButtonText: 'OK'
        });
      }
    });
  }
} 