import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { DiscountCouponService } from '../services/discount-coupon.service';
import { Observable, of } from 'rxjs';
import { map, debounceTime, switchMap, first } from 'rxjs/operators';


@Component({
  selector: 'app-discount-coupon',
  standalone: false,
  templateUrl: './discount-coupon.component.html',
  styleUrl: './discount-coupon.component.css'
})
export class DiscountCouponComponent implements OnInit {
  discounts: any[] = [];
  discountForm: FormGroup;
  isEditMode = false;
  editDiscountId: number | null = null;
  message: string = '';

  constructor(private fb: FormBuilder, private discountCouponService: DiscountCouponService) {
    this.discountForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', {
        validators: [Validators.required],
        asyncValidators: [this.codeUniqueValidator()],
        updateOn: 'blur'
      }],
      discountType: ['PERCENTAGE', Validators.required],
      discountValue: [0, [Validators.required, Validators.min(0)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      autoApplied: [false],
      discountEventId: [null],
      productIds: [''], // comma-separated for simplicity
      status: [false]
    }, { validators: [this.discountValueValidator()] });
  }

  ngOnInit() {
    this.discountForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', {
        validators: [Validators.required],
        asyncValidators: [this.codeUniqueValidator()],
        updateOn: 'blur'
      }],
      discountType: ['PERCENTAGE', Validators.required],
      discountValue: [0, [Validators.required, Validators.min(0)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      autoApplied: [false],
      discountEventId: [null],
      productIds: [''], // comma-separated for simplicity
      status: [false]
    }, { validators: [this.discountValueValidator()] });
    this.loadDiscounts();

    // Clear discountValue when discountType changes
    this.discountForm.get('discountType')?.valueChanges.subscribe(() => {
      const discountValueControl = this.discountForm.get('discountValue');
      discountValueControl?.setValue('');
      discountValueControl?.markAsPristine();
      discountValueControl?.markAsUntouched();
    });
  }

  loadDiscounts() {
    this.discountCouponService.getDiscounts().subscribe(data => {
      this.discounts = data;
    });
  }

  onSubmit() {
    if (this.discountForm.invalid) return;
    const formValue = this.discountForm.value;
    console.log(this.discountForm.value);
    // Determine if this is a coupon discount (adjust logic as needed)
    const isCoupon = formValue.discountType === 'COUPON'; // Change this condition if you use a different field to distinguish
    const payload: any = {
      ...formValue,
      startDate: formValue.startDate ? formValue.startDate + 'T00:00:00' : null,
      endDate: formValue.endDate ? formValue.endDate + 'T00:00:00' : null,
    };
    if (isCoupon) {
      // For coupon, send as array
      payload.productIdsforCoupon = formValue.productIds
        ? formValue.productIds.split(',').map((id: string) => +id.trim()).filter((id: number) => !isNaN(id))
        : [];
      delete payload.productIds;
    } else {
      // For normal/event, send as string
      payload.productIds = formValue.productIds || '';
      delete payload.productIdsforCoupon;
    }
    if (this.isEditMode && this.editDiscountId !== null) {
      this.discountCouponService.updateDiscount(this.editDiscountId, payload).subscribe(() => {
        this.message = 'Discount updated!';
        this.resetForm();
        this.loadDiscounts();
      });
    } else {
      this.discountCouponService.createDiscount(payload).subscribe(() => {
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
      this.discountCouponService.deleteDiscount(id).subscribe(() => {
        this.message = 'Discount deleted!';
        this.loadDiscounts();
      });
    }
  }

  resetForm() {
    this.discountForm.reset({ discountType: 'PERCENTAGE', autoApplied: false, status: false });
    this.isEditMode = false;
    this.editDiscountId = null;
  }

  codeUniqueValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) return of(null);
      // If editing and code is unchanged, skip validation
      if (this.isEditMode && this.discounts.find(d => d.id === this.editDiscountId && d.code === control.value)) {
        return of(null);
      }
      return this.discountCouponService.checkCodeExists(control.value).pipe(
        debounceTime(300),
        map(exists => (exists ? { codeExists: true } : null)),
        first()
      );
    };
  }

  discountValueValidator() {
    return (group: FormGroup): ValidationErrors | null => {
      const type = group.get('discountType')?.value;
      const value = group.get('discountValue')?.value;
      const discountValueControl = group.get('discountValue');
      if (type === 'PERCENTAGE') {
        if (value < 1 || value > 100) {
          discountValueControl?.setErrors({ percentRange: true });
          return { percentRange: true };
        } else {
          if (discountValueControl?.hasError('percentRange')) {
            discountValueControl.setErrors(null);
          }
        }
      } else if (type === 'FIXED') {
        if (value === null || value === undefined || value === '' || value <= 0) {
          discountValueControl?.setErrors({ fixedInvalid: true });
          return { fixedInvalid: true };
        } else {
          if (discountValueControl?.hasError('fixedInvalid')) {
            discountValueControl.setErrors(null);
          }
        }
      }
      return null;
    };
  }

  onDiscountValueInput(event: Event) {
    const type = this.discountForm.get('discountType')?.value;
    const input = event.target as HTMLInputElement;
    let value = +input.value;
    if (type === 'PERCENTAGE' && value > 100) {
      value = 100;
      input.value = '100';
      this.discountForm.get('discountValue')?.setValue(100);
    }
  }
  
  onWheel(event: WheelEvent) {
    (event.target as HTMLInputElement).blur();
  }
}
