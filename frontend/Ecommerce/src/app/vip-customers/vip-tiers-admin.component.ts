import { Component, OnInit } from '@angular/core';
import { VipTier, VipTierService } from '../services/vip-tier.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-vip-tiers-admin',
  template: `
  <div class="p-6 max-w-3xl mx-auto">
    <h2 class="text-2xl font-bold mb-4">Manage VIP Tiers</h2>
    <div class="mb-6">
      <form [formGroup]="tierForm" (ngSubmit)="onSubmit()" class="flex flex-wrap gap-2 items-end">
        <input formControlName="name" placeholder="Name" class="input input-bordered" required />
        <input formControlName="description" placeholder="Description" class="input input-bordered" />
        <input formControlName="minPoints" type="number" placeholder="Min Points" class="input input-bordered w-32" required />
        <input formControlName="icon" placeholder="Icon (lucide name)" class="input input-bordered w-32" />
        <input formControlName="color" placeholder="Color (e.g. text-blue-500)" class="input input-bordered w-32" />
        <input formControlName="benefits" placeholder="Benefits (comma separated)" class="input input-bordered" />
        <input formControlName="order" type="number" placeholder="Order" class="input input-bordered w-20" />
        <button type="submit" class="btn btn-primary">{{ editId ? 'Update' : 'Add' }} Tier</button>
        <button *ngIf="editId" type="button" (click)="resetForm()" class="btn btn-secondary ml-2">Cancel</button>
      </form>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th class="px-4 py-2">Order</th>
            <th class="px-4 py-2">Name</th>
            <th class="px-4 py-2">Min Points</th>
            <th class="px-4 py-2">Icon</th>
            <th class="px-4 py-2">Color</th>
            <th class="px-4 py-2">Benefits</th>
            <th class="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let tier of tiers">
            <td class="px-4 py-2">{{ tier.order }}</td>
            <td class="px-4 py-2 font-bold">{{ tier.name }}</td>
            <td class="px-4 py-2">{{ tier.minPoints }}</td>
            <td class="px-4 py-2"><i [attr.data-lucide]="tier.icon" class="w-5 h-5" [ngClass]="tier.color"></i></td>
            <td class="px-4 py-2"><span [ngClass]="tier.color">{{ tier.color }}</span></td>
            <td class="px-4 py-2">{{ tier.benefits }}</td>
            <td class="px-4 py-2 flex gap-2">
              <button class="btn btn-xs btn-info" (click)="editTier(tier)">Edit</button>
              <button class="btn btn-xs btn-error" (click)="deleteTier(tier.id)">Delete</button>
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

  constructor(private vipTierService: VipTierService, private fb: FormBuilder) {
    this.tierForm = this.fb.group({
      name: [''],
      description: [''],
      minPoints: [0],
      icon: [''],
      color: [''],
      benefits: [''],
      order: [0]
    });
  }

  ngOnInit() {
    this.loadTiers();
  }

  loadTiers() {
    this.vipTierService.getAll().subscribe(tiers => {
      this.tiers = tiers.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });
  }

  onSubmit() {
    const tier: VipTier = this.tierForm.value;
    if (this.editId) {
      this.vipTierService.update(this.editId, tier).subscribe(() => {
        this.loadTiers();
        this.resetForm();
      });
    } else {
      this.vipTierService.create(tier).subscribe(() => {
        this.loadTiers();
        this.resetForm();
      });
    }
  }

  editTier(tier: VipTier) {
    this.editId = tier.id!;
    this.tierForm.patchValue(tier);
  }

  deleteTier(id?: number) {
    if (id && confirm('Delete this tier?')) {
      this.vipTierService.delete(id).subscribe(() => this.loadTiers());
    }
  }

  resetForm() {
    this.editId = null;
    this.tierForm.reset({ minPoints: 0, order: 0 });
  }
} 