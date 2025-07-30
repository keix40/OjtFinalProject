import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DiscountService } from '../services/discount.service';
import { PermissionService } from '../services/permission.service';
import { PermissionConstants } from '../constants/permission.constants';

@Component({
  selector: 'app-discount-admin',
  standalone: false,
  templateUrl: './discount-admin.component.html',
  styleUrls: ['./discount-admin.component.css']
})
export class DiscountAdminComponent implements OnInit {
  discounts: any[] = [];
  discountForm: FormGroup;
  isEditMode = false;
  editDiscountId: number | null = null;
  message: string = '';
  public PermissionConstants = PermissionConstants;

  constructor(private fb: FormBuilder, private discountService: DiscountService, public permissionService: PermissionService) {
    this.discountForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      discountType: ['PERCENTAGE', Validators.required],
      discountValue: [0, [Validators.required, Validators.min(0)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      autoApplied: [false],
      discountEventId: [null],
      productIds: [''] // comma-separated for simplicity
    });
  }

  ngOnInit() {
    this.discountService.getAllDiscount().subscribe((data: any) => {
      this.discounts = data;
    });
  }

  loadDiscounts() {
    this.discountService.getAllDiscount().subscribe((data: any) => {
      this.discounts = data;
    });
  }

  onSubmit() {
    if (this.discountForm.invalid) return;
    const formValue = this.discountForm.value;
    const payload = {
      ...formValue,
      productIds: formValue.productIds
        ? formValue.productIds.split(',').map((id: string) => +id.trim()).filter((id: number) => !isNaN(id))
        : []
    };
    if (this.isEditMode && this.editDiscountId !== null) {
      this.discountService.updateDiscount(this.editDiscountId, payload).subscribe(() => {
        this.message = 'Discount updated!';
        this.resetForm();
        this.loadDiscounts();
      });
    } else {
      this.discountService.createDiscount(payload).subscribe(() => {
        this.message = 'Discount created!';
        this.resetForm();
        this.loadDiscounts();
      });
    }
  }

  onEdit(discount: any) {
    this.isEditMode = true;
    this.editDiscountId = discount.id;
    this.discountForm.patchValue({
      ...discount,
      productIds: discount.productIds ? discount.productIds.join(',') : ''
    });
  }

  onDelete(id: number) {
    if (confirm('Delete this discount?')) {
      this.discountService.deleteDiscount(id).subscribe(() => {
        this.message = 'Discount deleted!';
        this.loadDiscounts();
      });
    }
  }

  resetForm() {
    this.discountForm.reset({ discountType: 'PERCENTAGE', autoApplied: false });
    this.isEditMode = false;
    this.editDiscountId = null;
  }
}