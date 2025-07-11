import { Component, OnInit, ElementRef, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { DiscountDTO, DiscountService, DiscountEventDTO } from '../services/discount.service';

function todayOrFutureDateOnlyValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return { required: true };
  const inputDate = new Date(control.value);
  const now = new Date();
  // Compare only the date part
  inputDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  if (inputDate < now) {
    return { notTodayOrFuture: true };
  }
  return null;
}

function todayOrFutureDateTimeValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return { required: true };
  const inputDateTime = new Date(control.value);
  const now = new Date();
  if (inputDateTime < now) {
    return { notTodayOrFuture: true };
  }
  return null;
}

function endAfterStartValidator(group: AbstractControl): ValidationErrors | null {
  const startDate = group.get('startDate');
  const endDate = group.get('endDate');
  
  if (!startDate?.value || !endDate?.value) return null;
  
  const startDateTime = new Date(startDate.value);
  const endDateTime = new Date(endDate.value);
  
  // End datetime must be at least 1 second after start datetime
  if (endDateTime <= startDateTime) {
    return { endBeforeOrEqualStart: true };
  }
  
  return null;
}

@Component({
  selector: 'app-discount-event-management',
  standalone: false,
  templateUrl: './discount-management.component.html',
  styleUrl: './discount-management.component.css'
})
export class DiscountEventManagementComponent implements OnInit {
  discounts: DiscountDTO[] = [];
  isLoading = false;
  showEditModal = false;
  editForm: FormGroup;
  editingDiscount: DiscountDTO | null = null;
  submitted = false;

  constructor(
    private discountService: DiscountService,
    private fb: FormBuilder,
    
  ) {
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      discountType: ['PERCENTAGE', Validators.required],
      discount_percent: [0, [Validators.required, Validators.min(0.01), Validators.max(100)]],
      discount_amount: [0, [Validators.required, Validators.min(1)]],
      startDate: ['', [Validators.required, todayOrFutureDateOnlyValidator]],
      endDate: ['', [Validators.required, todayOrFutureDateTimeValidator]],
      status: [true] // No Validators.requiredTrue
    }, { validators: endAfterStartValidator });
  }

  ngOnInit(): void {
    this.loadDiscounts();
  }

  loadDiscounts() {
    this.isLoading = true;
    this.discountService.getAllDiscount().subscribe({
      next: (data) => {
        this.discounts = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        alert('Failed to load discounts');
      }
    });
  }

  openEditModal(discount: DiscountDTO) {
    this.editingDiscount = discount;
    // Convert date strings to datetime-local format
    const startDate = new Date(discount.startDate);
    const endDate = new Date(discount.endDate);
    this.editForm.patchValue({
      name: discount.name,
      description: discount.description || '',
      discountType: discount.discountType,
      discount_percent: discount.discountType === 'PERCENTAGE' ? (discount.discountValue || '') : '',
      discount_amount: discount.discountType === 'FIXED' ? (discount.discountValue || '') : '',
      startDate: this.formatDateTimeForInput(startDate),
      endDate: this.formatDateTimeForInput(endDate),
      status: discount.status
    });
    this.showEditModal = true;
    this.submitted = false;
    this.onDiscountTypeChange(); // Ensure correct enable/disable state
  }

  // Helper method to format date for datetime-local input
  formatDateTimeForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingDiscount = null;
    this.editForm.reset();
    this.submitted = false;
  }

onDiscountTypeChange() {
  const discountType = this.editForm.get('discountType')?.value;
  const percentControl = this.editForm.get('discount_percent');
  const amountControl = this.editForm.get('discount_amount');
  if (discountType === 'PERCENTAGE') {
    amountControl?.setValue(null); // Clear value safely before disabling
    percentControl?.enable();
    amountControl?.disable();
  } else {
    percentControl?.setValue(null); // Clear value safely before disabling
    amountControl?.enable();
    percentControl?.disable();
  }
}

  // Prevent mouse wheel from changing number input
  preventWheel(event: WheelEvent) {
    (event.target as HTMLInputElement).blur();
    event.preventDefault();
  }

  // Helper to check if a field is invalid
  isFieldInvalid(field: string): boolean {
    const control = this.editForm.get(field);
    return !!(
      control &&
      (control.invalid && (control.touched || this.submitted))
    );
  }

  updateDiscount() {
    this.submitted = true;
    let hasError = false;
    // Check all invalid individual fields
    Object.keys(this.editForm.controls).forEach(field => {
      const control = this.editForm.get(field);
      if (control && control.invalid) {
        hasError = true;
      }
    });
    // Check for form-level validation errors
    if (this.editForm.errors?.['endBeforeOrEqualStart']) {
      hasError = true;
    }
    if (this.editForm.invalid) {
      hasError = true;
    }
    if (hasError) {
      return;
    }
    if (this.editForm.valid && this.editingDiscount) {
      const formValue = this.editForm.value;
      const updateData: DiscountEventDTO = {
        name: formValue.name,
        description: formValue.description,
        discountType: formValue.discountType,
        discount_percent: formValue.discount_percent,
        discount_amount: formValue.discount_amount,
        startDate: new Date(formValue.startDate).toISOString(),
        endDate: new Date(formValue.endDate).toISOString(),
        status: formValue.status,
        isEvent: false,
        targetType: 'PRODUCT'
      };
      this.discountService.updateDiscount(this.editingDiscount.id, updateData).subscribe({
        next: () => {
          this.closeEditModal();
          this.loadDiscounts();
          alert('Discount updated successfully');
          console.log('Edit discount payload: ' + JSON.stringify(updateData));
        },
        error: (error) => {
          console.error('Error updating discount:', error);
          alert('Failed to update discount');
        }
      });
    }
  }

  deleteDiscount(id: number) {
    if (confirm('Are you sure you want to delete this discount?')) {
      this.discountService.deleteDiscount(id).subscribe({
        next: () => {
          this.loadDiscounts();
        },
        error: () => {
          alert('Failed to delete discount');
        }
      });
    }
  }
}