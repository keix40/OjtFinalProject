import { Component, OnInit } from '@angular/core';
import { VipTier, VipTierService } from '../services/vip-tier.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LuxUiModule } from '../shared/ui/lux-ui.module';
import { LuxDialogService } from '../shared/dialog/lux-dialog.service';

@Component({
  selector: 'app-vip-tiers-admin',
  template: `
  <lux-page-shell variant="admin" shellClass="admin-page vip-tiers-admin-page">
    <lux-page-header variant="admin" eyebrow="People" title="Manage VIP Tiers" subtitle="Configure loyalty tiers, points thresholds, and presentation"></lux-page-header>
    <div class="page-panel" style="padding:1rem">
      <form [formGroup]="tierForm" (ngSubmit)="onSubmit()" class="admin-form-grid" style="margin-bottom:1rem">
        <input formControlName="name" placeholder="Name" class="admin-filter-input" required />
        <input formControlName="description" placeholder="Description" class="admin-filter-input" />
        <input formControlName="minPoints" type="number" placeholder="Min Points" class="admin-filter-input" required />
        <input formControlName="icon" placeholder="Icon (lucide name)" class="admin-filter-input" />
        <input formControlName="color" placeholder="Color class" class="admin-filter-input" />
        <input formControlName="order" type="number" placeholder="Order" class="admin-filter-input" />
        <div style="display:flex;gap:0.5rem;align-items:center">
          <lux-button variant="primary" type="submit">{{ editId ? 'Update' : 'Add' }} Tier</lux-button>
          <lux-button *ngIf="editId" variant="secondary" type="button" (pressed)="resetForm()">Cancel</lux-button>
        </div>
      </form>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Order</th><th>Name</th><th>Min Points</th><th>Icon</th><th>Color</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let tier of tiers">
              <td>{{ tier.order }}</td>
              <td>{{ tier.name }}</td>
              <td>{{ tier.minPoints }}</td>
              <td><i [attr.data-lucide]="tier.icon" class="w-5 h-5" [ngClass]="tier.color"></i></td>
              <td><span [ngClass]="tier.color">{{ tier.color }}</span></td>
              <td style="display:flex;gap:0.35rem">
                <lux-button variant="ghost" type="button" (pressed)="editTier(tier)">Edit</lux-button>
                <lux-button variant="ghost" type="button" (pressed)="deleteTier(tier.id)">Delete</lux-button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </lux-page-shell>
  `,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LuxUiModule],
  styles: [`:host{display:block}.vip-tiers-admin-page{padding:0.25rem 0 1.5rem}`]
})
export class VipTiersAdminComponent implements OnInit {
  tiers: VipTier[] = [];
  tierForm: FormGroup;
  editId: number | null = null;

  constructor(private vipTierService: VipTierService, private fb: FormBuilder, private luxDialog: LuxDialogService) {
    this.tierForm = this.fb.group({
      name: [''],
      description: [''],
      minPoints: [0],
      icon: [''],
      color: [''],
      order: [0]
    });
  }

  ngOnInit() {
    this.loadTiers();
  }

  loadTiers() {
    this.vipTierService.getAllVipTiers().subscribe((tiers: VipTier[]) => {
      this.tiers = tiers.sort((a: VipTier, b: VipTier) => (a.order ?? 0) - (b.order ?? 0));
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

  async deleteTier(id?: number) {
    if (!id) return;
    const ok = await this.luxDialog.confirm({
      title: 'Delete this tier?',
      text: 'VIP customers on this tier may need reassignment.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    this.vipTierService.delete(id).subscribe(() => this.loadTiers());
  }

  resetForm() {
    this.editId = null;
    this.tierForm.reset({ minPoints: 0, order: 0 });
  }
}
