import { Component, OnInit } from '@angular/core';
import { VipTier, VipTierService } from '../services/vip-tier.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-vip-tiers-admin',
  template: `
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-6xl mx-auto">

      <!-- Header Section -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 glassmorphism rounded-2xl shadow-lg mb-4">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Manage VIP Tiers</h1>
        <p class="text-gray-600">Create and manage VIP customer tiers for your store</p>
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
            <h2 class="text-lg font-semibold text-gray-900">VIP Tier Information</h2>
          </div>
        </div>

        <!-- Form Content -->
        <div class="p-6">
          <form [formGroup]="tierForm" (ngSubmit)="onSubmit()" class="space-y-6">

            <!-- Two Column Layout -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

              <!-- Left Column -->
              <div class="space-y-6">

                <!-- Tier Name -->
                <div>
                  <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                    <div class="flex items-center space-x-2">
                      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                      </svg>
                      <span>Tier Name</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    id="name"
                    formControlName="name"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter tier name (e.g., Bronze, Silver, Gold)"
                    [class.border-red-300]="tierForm.get('name')?.invalid && tierForm.get('name')?.touched"
                  />
                  <div *ngIf="tierForm.get('name')?.invalid && tierForm.get('name')?.touched" class="mt-1 text-sm text-red-600">
                    Tier name is required
                  </div>
                </div>

                <!-- Min Points -->
                <div>
                  <label for="minPoints" class="block text-sm font-medium text-gray-700 mb-2">
                    <div class="flex items-center space-x-2">
                      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                      </svg>
                      <span>Minimum Points Required</span>
                    </div>
                  </label>
                  <input
                    type="number"
                    id="minPoints"
                    formControlName="minPoints"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="0"
                    [class.border-red-300]="tierForm.get('minPoints')?.invalid && tierForm.get('minPoints')?.touched"
                  />
                  <div *ngIf="tierForm.get('minPoints')?.invalid && tierForm.get('minPoints')?.touched" class="mt-1 text-sm text-red-600">
                    Minimum points is required
                  </div>
                </div>

                <!-- Order -->
                <div>
                  <label for="order" class="block text-sm font-medium text-gray-700 mb-2">
                    <div class="flex items-center space-x-2">
                      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
                      </svg>
                      <span>Display Order</span>
                    </div>
                  </label>
                  <input
                    type="number"
                    id="order"
                    formControlName="order"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="0"
                  />
                </div>

              </div>

              <!-- Right Column -->
              <div class="space-y-6">

                <!-- Icon -->
                <div>
                  <label for="icon" class="block text-sm font-medium text-gray-700 mb-2">
                    <div class="flex items-center space-x-2">
                      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v.01"/>
                      </svg>
                      <span>Icon (Lucide Name)</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    id="icon"
                    formControlName="icon"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="crown, star, trophy, etc."
                  />
                </div>

                <!-- Color -->
                <div>
                  <label for="color" class="block text-sm font-medium text-gray-700 mb-2">
                    <div class="flex items-center space-x-2">
                      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v.01"/>
                      </svg>
                      <span>Color Class</span>
                    </div>
                  </label>
                  <select
                    id="color"
                    formControlName="color"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                  >
                    <option value="">Select a color</option>
                    <option value="text-blue-500">Blue</option>
                    <option value="text-gray-500">Gray</option>
                    <option value="text-yellow-500">Yellow</option>
                    <option value="text-green-500">Green</option>
                    <option value="text-red-500">Red</option>
                    <option value="text-purple-500">Purple</option>
                    <option value="text-pink-500">Pink</option>
                    <option value="text-indigo-500">Indigo</option>
                  </select>
                </div>

                <!-- Description -->
                <div>
                  <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                    <div class="flex items-center space-x-2">
                      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <span>Description</span>
                    </div>
                  </label>
                  <textarea
                    id="description"
                    formControlName="description"
                    rows="3"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    placeholder="Enter tier description..."
                  ></textarea>
                </div>

              </div>

            </div>

            <!-- Form Actions -->
            <div class="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                *ngIf="editId"
                type="button"
                (click)="resetForm()"
                class="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="tierForm.invalid || loading"
                class="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2">
                <svg *ngIf="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ editId ? 'Update Tier' : 'Create Tier' }}</span>
              </button>
            </div>
      </form>
    </div>
      </div>

      <!-- VIP Tiers List -->
      <div class="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <div class="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                <svg class="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <h2 class="text-lg font-semibold text-gray-900">Existing VIP Tiers</h2>
            </div>
            <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {{ tiers.length }}
            </span>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="flex items-center justify-center py-12">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
            <svg class="w-6 h-6 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && tiers.length === 0" class="text-center py-12">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No VIP tiers found</h3>
          <p class="text-sm text-gray-600">Create your first VIP tier to get started</p>
        </div>

        <!-- Tiers Table -->
        <div *ngIf="!loading && tiers.length > 0" class="overflow-x-auto">
          <table class="w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Points</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let tier of tiers" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ tier.order || 0 }}
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg *ngIf="tier.icon" class="w-5 h-5" [ngClass]="tier.color || 'text-blue-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <svg *ngIf="!tier.icon" class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ tier.name }}</div>
                      <div class="text-sm text-gray-500">ID: {{ tier.id }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {{ tier.minPoints }} points
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center space-x-2">
                    <svg *ngIf="tier.icon" class="w-5 h-5" [ngClass]="tier.color || 'text-blue-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span class="text-sm text-gray-500">{{ tier.icon || 'Default' }}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900 max-w-xs">
                    <div class="line-clamp-2">{{ tier.description || 'No description' }}</div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center space-x-2">
                    <button
                      (click)="editTier(tier)"
                      class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                      Edit
                    </button>
                    <button
                      (click)="deleteTier(tier.id)"
                      class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16"/>
                      </svg>
                      Delete
                    </button>
                  </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  `,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styleUrls: []
})
export class VipTiersAdminComponent implements OnInit {
  tiers: VipTier[] = [];
  tierForm: FormGroup;
  editId: number | null = null;
  loading = false;

  constructor(private vipTierService: VipTierService, private fb: FormBuilder) {
    this.tierForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      minPoints: [0, [Validators.required, Validators.min(0)]],
      icon: [''],
      color: [''],
      order: [0, [Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.loadTiers();
  }

  loadTiers() {
    this.loading = true;
    this.vipTierService.getAll().subscribe({
      next: (tiers) => {
      this.tiers = tiers.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading tiers:', error);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load VIP tiers. Please try again.',
          confirmButtonText: 'OK'
        });
      }
    });
  }


  onSubmit() {
    if (this.tierForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const tier: VipTier = this.tierForm.value;

    if (this.editId) {
      this.vipTierService.update(this.editId, tier).subscribe({
        next: () => {
        this.loadTiers();
        this.resetForm();
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'VIP tier updated successfully!',
            confirmButtonText: 'OK'
          });
        },
        error: (error) => {
          console.error('Error updating tier:', error);
          this.loading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to update VIP tier. Please try again.',
            confirmButtonText: 'OK'
          });
        }
      });
    } else {
      this.vipTierService.create(tier).subscribe({
        next: () => {
        this.loadTiers();
        this.resetForm();
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'VIP tier created successfully!',
            confirmButtonText: 'OK'
          });
        },
        error: (error) => {
          console.error('Error creating tier:', error);
          this.loading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to create VIP tier. Please try again.',
            confirmButtonText: 'OK'
          });
        }
      });
    }
  }

  editTier(tier: VipTier) {
    this.editId = tier.id!;
    this.tierForm.patchValue(tier);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteTier(id?: number) {
    if (!id) return;

    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.vipTierService.delete(id).subscribe({
          next: () => {
            this.loadTiers();
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'VIP tier has been deleted.',
              confirmButtonText: 'OK'
            });
          },
          error: (error) => {
            console.error('Error deleting tier:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to delete VIP tier. Please try again.',
              confirmButtonText: 'OK'
            });
          }
        });
      }
    });
  }

  resetForm() {
    this.editId = null;
    this.tierForm.reset({ minPoints: 0, order: 0 });
    this.loading = false;
  }

  private markFormGroupTouched() {
    Object.keys(this.tierForm.controls).forEach(key => {
      const control = this.tierForm.get(key);
      control?.markAsTouched();
    });
  }
}
