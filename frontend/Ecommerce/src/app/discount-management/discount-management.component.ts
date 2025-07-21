import { Component, OnInit, ElementRef, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { DiscountDTO, DiscountService, DiscountRequestDTO } from '../services/discount.service';
import { debounceTime, first, map, Observable, of } from 'rxjs';
import { DiscountCouponService } from '../services/discount-coupon.service';
import { NotificationService } from '../services/notification.service';
import { NotifcationService } from '../notifcation.service';

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

function notSameDateTimeValidator(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value;
  const end = group.get('endDate')?.value;
  if (!start || !end) return null;
  if (start === end) {
    return { sameDateTime: true };
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
  filteredDiscounts: DiscountDTO[] = [];
  isLoading = false;
  showEditModal = false;
  editForm: FormGroup;
  editingDiscount: DiscountDTO | null = null;
  submitted = false;
  selectedDiscounts: number[] = [];
  filterType: string = '';
  filterStatus: string = '';
  filterName: string = '';
  showDetailsModal: boolean = false;
  detailsDiscount: DiscountDTO | null = null;
  viewMode: boolean = true;
  isDetailsEditMode = false;
  detailsEdit: any = {};
  detailsForm: FormGroup;
  showDeleteConfirmModal: boolean = false;
  discountToDelete: DiscountDTO | null = null;
   editDiscountId: number | null = null;

  constructor(
    private discountService: DiscountService,
    private fb: FormBuilder,
    private discountCouponService:DiscountCouponService,
    private notificationService: NotificationService,
    private notifcationService: NotifcationService,
    
  ) {
    this.editForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      discountType: ['PERCENTAGE', Validators.required],
      discount_percent: [0, [Validators.required, Validators.min(0.01), Validators.max(100)]],
      discount_amount: [0, [Validators.required, Validators.min(1)]],
      startDate: ['', [Validators.required, todayOrFutureDateOnlyValidator]],
      endDate: ['', [Validators.required, todayOrFutureDateOnlyValidator]],
      status: [true] // No Validators.requiredTrue
    }, { validators: endAfterStartValidator });

    this.detailsForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      code: ['', {
        validators: [Validators.required, Validators.minLength(1)],
        asyncValidators: [this.codeUniqueValidator()],
        updateOn: 'blur'
      }],
      description: ['', [Validators.required, Validators.minLength(1)]],
      discountType: ['PERCENTAGE', [Validators.required]],
      discountValue: [0, [Validators.required, Validators.min(0.01)]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      status: [true, [Validators.required]]
    }, { validators: notSameDateTimeValidator });
  }

  ngOnInit(): void {
    this.loadDiscounts();
  }

  loadDiscounts() {
    this.isLoading = true;
    this.discountService.getAllDiscount().subscribe({
      next: (data) => {
        this.discounts = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.showError('Failed to load discounts');
      }
    });
  }

  applyFilters() {
    this.filteredDiscounts = this.discounts.filter(d => {
      let matchesType = true;
      let matchesStatus = true;
      let matchesName = true;
      if (this.filterType) {
        matchesType = this.filterType === 'COUPON' ? !!!d.autoApply : !!d.autoApply;
      }
      if (this.filterStatus) {
        matchesStatus = this.filterStatus === 'active' ? d.status : !d.status;
      }
      if (this.filterName) {
        matchesName = d.name.toLowerCase().includes(this.filterName.toLowerCase());
      }
      return matchesType && matchesStatus && matchesName;
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
      const updateData: DiscountRequestDTO = {
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
          this.notificationService.showSuccess('Discount updated successfully');
          console.log('Edit discount payload: ' + JSON.stringify(updateData));
        },
        error: (error) => {
          console.error('Error updating discount:', error);
          this.notificationService.showError('Failed to update discount');
        }
      });
    }
  }

  deleteDiscount(id: number) {
    if (confirm('Are you sure you want to delete this discount?')) {
      this.discountService.deleteDiscount(id).subscribe({
        next: () => {
          this.loadDiscounts();
          this.notificationService.showSuccess('Discount deleted successfully');
        },
        error: () => {
          this.notificationService.showError('Failed to delete discount');
        }
      });
    }
  }

  isSelected(id: number): boolean {
    return this.selectedDiscounts.includes(id);
  }

  isAllSelected(): boolean {
    return this.discounts.length > 0 && this.selectedDiscounts.length === this.discounts.length;
  }

  toggleSelectDiscount(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.selectedDiscounts.includes(id)) {
        this.selectedDiscounts.push(id);
      }
    } else {
      this.selectedDiscounts = this.selectedDiscounts.filter(did => did !== id);
    }
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedDiscounts = this.discounts.map(d => d.id);
    } else {
      this.selectedDiscounts = [];
    }
  }

  deleteSelectedDiscounts(): void {
    if (this.selectedDiscounts.length === 0) return;
    if (!confirm('Are you sure you want to delete the selected discounts?')) return;
    const idsToDelete = [...this.selectedDiscounts];
    let completed = 0;
    let failed = false;
    idsToDelete.forEach(id => {
      this.discountService.deleteDiscount(id).subscribe({
        next: () => {
          completed++;
          if (completed === idsToDelete.length && !failed) {
            this.selectedDiscounts = [];
            this.loadDiscounts();
          }
        },
        error: () => {
          failed = true;
          this.notificationService.showError('Failed to delete one or more discounts.');
        }
      });
    });
  }

  openDetailsModal(discount: DiscountDTO): void {
    this.editDiscountId = discount.id;
    this.detailsDiscount = discount;
    this.detailsEdit = { ...discount };
    this.viewMode = true;
    this.showDetailsModal = true;
    this.isDetailsEditMode = false;
    // Populate the details form
    const startDate = new Date(discount.startDate);
    const endDate = new Date(discount.endDate);
    this.detailsForm.patchValue({
      name: discount.name,
      code: discount.code || '',
      description: discount.description || '',
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      startDate: this.formatDateTimeForInput(startDate),
      endDate: this.formatDateTimeForInput(endDate),
      status: discount.status
    });
    this.updateCodeFieldValidators();
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.detailsDiscount = null;
    this.detailsEdit = {};
    this.isDetailsEditMode = false;
    this.editDiscountId = null;
    this.detailsForm.reset();
  }

  startDetailsEdit(): void {
    if (this.isDetailsEditMode) {
      // If already editing, revert to view mode and reset form
      this.isDetailsEditMode = false;
      if (this.detailsDiscount) {
        const startDate = new Date(this.detailsDiscount.startDate);
        const endDate = new Date(this.detailsDiscount.endDate);
        this.detailsForm.patchValue({
          name: this.detailsDiscount.name,
          code: this.detailsDiscount.code || '',
          description: this.detailsDiscount.description || '',
          discountType: this.detailsDiscount.discountType,
          discountValue: this.detailsDiscount.discountValue,
          startDate: this.formatDateTimeForInput(startDate),
          endDate: this.formatDateTimeForInput(endDate),
          status: this.detailsDiscount.status
        });
      }
    } else {
      // Enter edit mode
      this.isDetailsEditMode = true;
    }
  }

  cancelDetailsEdit(): void {
    this.isDetailsEditMode = false;
    if (this.detailsDiscount) {
      // Reset form to original values
      const startDate = new Date(this.detailsDiscount.startDate);
      const endDate = new Date(this.detailsDiscount.endDate);
      
      this.detailsForm.patchValue({
        name: this.detailsDiscount.name,
        code: this.detailsDiscount.code || '',
        description: this.detailsDiscount.description || '',
        discountType: this.detailsDiscount.discountType,
        discountValue: this.detailsDiscount.discountValue,
        startDate: this.formatDateTimeForInput(startDate),
        endDate: this.formatDateTimeForInput(endDate),
        status: this.detailsDiscount.status
      });
    }
  }

  submitDetailsEdit(): void {
    if (!this.detailsDiscount || this.detailsForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.detailsForm.controls).forEach(key => {
        const control = this.detailsForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    // Additional validation to ensure no empty fields
    const formValue = this.detailsForm.getRawValue();
    const requiredFields = ['name', 'description', 'discountType', 'discountValue', 'startDate', 'endDate'];
    if (this.detailsDiscount && this.detailsDiscount.autoApply === false) {
      requiredFields.push('code');
    }
    const emptyFields = requiredFields.filter(field => !formValue[field] || formValue[field].toString().trim() === '');
    
    if (emptyFields.length > 0) {
      this.notificationService.showWarning('Please fill in all required fields: ' + emptyFields.join(', '));
      return;
    }
    
    const updateData: DiscountRequestDTO = {
      name: formValue.name,
      code: formValue.code,
      description: formValue.description,
      discountType: formValue.discountType,
      discount_percent: formValue.discountType === 'PERCENTAGE' ? formValue.discountValue : 0,
      discount_amount: formValue.discountType === 'FIXED' ? formValue.discountValue : 0,
      startDate: new Date(formValue.startDate).toISOString(),
      endDate: new Date(formValue.endDate).toISOString(),
      status: formValue.status,
      isEvent: false,
      targetType: 'PRODUCT'
    };

    this.discountService.updateDiscount(this.detailsDiscount.id, updateData).subscribe({
      next: (res) => {
        // Update the detailsDiscount with the new values
        this.detailsDiscount = { ...this.detailsDiscount, ...formValue };
        this.isDetailsEditMode = false;
        this.loadDiscounts();
        this.notificationService.showSuccess('Discount updated successfully');
        
      },
      error: (error) => {
        console.error('Error updating discount:', error);
        this.notificationService.showError('Failed to update discount');
      }
    });
  }

  deleteDetailsDiscount(): void {
    if (!this.detailsDiscount) return;
    
    this.discountToDelete = this.detailsDiscount;
    this.showDeleteConfirmModal = true;
  }

  openDeleteConfirmModal(discount: DiscountDTO): void {
    this.discountToDelete = discount;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = false;
    this.discountToDelete = null;
  }

  confirmDelete(): void {
    if (!this.discountToDelete) return;
    
    this.discountService.deleteDiscount(this.discountToDelete.id).subscribe({
      next: () => {
        this.closeDeleteConfirmModal();
        if (this.showDetailsModal) {
          this.closeDetailsModal();
        }
        this.loadDiscounts();
        this.notificationService.showSuccess('Discount deleted successfully');
      },
      error: () => {
        this.notificationService.showError('Failed to delete discount');
      }
    });
  }

    codeUniqueValidator(): AsyncValidatorFn {
      return (control: AbstractControl): Observable<ValidationErrors | null> => {
        if (!control.value) return of(null);
        // If editing and code is unchanged, skip validation
        if (this.isDetailsEditMode && this.discounts.find(d => d.id === this.editDiscountId && d.code === control.value)) {
          return of(null);
        }
        return this.discountCouponService.checkCodeExists(control.value).pipe(
          debounceTime(300),
          map(exists => (exists ? { codeExists: true } : null)),
          first()
        );
      };
    }

  updateCodeFieldValidators() {
    const codeControl = this.detailsForm.get('code');
    // Coupon: code required, Discount: code not required
    if (this.detailsDiscount && this.detailsDiscount.autoApply === false) {
      codeControl?.setValidators([Validators.required, Validators.minLength(1)]);
      codeControl?.enable();
    } else {
      codeControl?.clearValidators();
      codeControl?.disable();
    }
    codeControl?.updateValueAndValidity();
  }

    
}