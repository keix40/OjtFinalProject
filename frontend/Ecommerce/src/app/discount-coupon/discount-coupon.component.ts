import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { DiscountCouponService } from '../services/discount-coupon.service';
import { Observable, of } from 'rxjs';
import { map, debounceTime, switchMap, first } from 'rxjs/operators';
import { UserService } from '../services/user.service';
import { VipTierService, VipTier } from '../services/vip-tier.service';


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
  users: any[] = [];
  vipTiers: VipTier[] = [];
  showUserModal = false;
  searchTerm = '';
  filteredAllUsers: any[] = [];
  tempSelectedUsers: any[] = [];
isSuccess: boolean = false;

  constructor(
    private fb: FormBuilder,
    private discountCouponService: DiscountCouponService,
    private userService: UserService,
    private vipTierService: VipTierService
  ) {
    this.discountForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', {
        validators: [Validators.required, Validators.minLength(4)],
        asyncValidators: [this.codeUniqueValidator()],
        updateOn: 'blur'
      }],
      description: ['', Validators.required], 
      discountType: ['PERCENTAGE', Validators.required],
      discountValue: [0, [Validators.required, Validators.min(0)]],
      minimumAmount: [null, [this.minimumAmountValidator()]], 
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      autoApplied: [false],
      discountEventId: [null],
      productIds: [''],
      status: [false],
      selectedUsers: [[]], // multiple users
      selectedVipTiers: [[]] // multiple VIP tiers
    }, { validators: [this.discountValueValidator()] });
  }

  ngOnInit() {
    this.discountForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', {
        validators: [Validators.required, Validators.minLength(4)],
        asyncValidators: [this.codeUniqueValidator()],
        updateOn: 'blur'
      }],
      description: ['', Validators.required],
      discountType: ['PERCENTAGE', Validators.required],
      discountValue: [0, [Validators.required, Validators.min(0)]],
      minimumAmount: [null, [this.minimumAmountValidator()]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      autoApplied: [false],
      discountEventId: [null],
      productIds: [''],
      status: [false],
      selectedUsers: [[]], // multiple users
      selectedVipTiers: [[]] // multiple VIP tiers
    }, { validators: [this.discountValueValidator()] });
    this.loadDiscounts();
    this.userService.getCustomers().subscribe(users => this.users = users);
    this.vipTierService.getAll().subscribe(tiers => this.vipTiers = tiers);

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
    payload.minimumSpend = formValue.minimumAmount;
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
    payload.userIdsforCoupon = formValue.selectedUsers;
    payload.vipTierIdsforCoupon = formValue.selectedVipTiers;
    if (this.isEditMode && this.editDiscountId !== null) {
      this.discountCouponService.updateDiscount(this.editDiscountId, payload).subscribe(() => {
        this.message = 'Discount updated!';
        this.resetForm();
        this.loadDiscounts();
      });
    } else {
      this.discountCouponService.createDiscount(payload).subscribe({
        next: () => {
          this.message = 'Discount created!';
          this.isSuccess = true;
          this.resetForm();
          this.loadDiscounts();
        },
        error: (err) => {
          this.message = 'Failed to create discount: ' + (err.error?.message || 'Unknown error');
          this.isSuccess = false;
        }
      });
    }
  }

  onEdit(discount: any) {
    this.isEditMode = true;
    this.editDiscountId = discount.id;
    this.discountForm.patchValue({
      ...discount,
      productIds: discount.productIds ? discount.productIds.join(',') : '',
      description: discount.description || '',
      minimumAmount: discount.minimumAmount || null
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

  minimumAmountValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === null || control.value === undefined || control.value === '') {
        return null; // Not required
      }
      if (+control.value <= 0) {
        return { minimumAmountInvalid: true };
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

  onCheckboxChange(event: any, controlName: string) {
    const control = this.discountForm.get(controlName);
    if (!control) return;
    const value = event.target.value;
    const checked = event.target.checked;
    let arr = control.value || [];
    if (checked) {
      if (!arr.includes(value)) {
        arr = [...arr, value];
      }
    } else {
      arr = arr.filter((v: any) => v != value);
    }
    control.setValue(arr);
    control.markAsDirty();
    control.updateValueAndValidity();
  }

  openUserModal() {
    this.tempSelectedUsers = [...this.discountForm.value.selectedUsers];
    this.filteredAllUsers = this.users;
    this.searchTerm = '';
    this.showUserModal = true;
  }

  closeUserModal() {
    this.showUserModal = false;
  }

  filterUsersBySearch() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredAllUsers = this.users;
      return;
    }
    this.filteredAllUsers = this.users.filter(user =>
      (user.name && user.name.toLowerCase().includes(term)) ||
      (user.email && user.email.toLowerCase().includes(term)) ||
      (user.tier && user.tier.toLowerCase().includes(term))
    );
  }

  isUserSelected(userId: any) {
    return this.tempSelectedUsers.includes(userId);
  }

  toggleUserSelection(userId: any) {
    if (this.isUserSelected(userId)) {
      this.tempSelectedUsers = this.tempSelectedUsers.filter((id: any) => id !== userId);
    } else {
      this.tempSelectedUsers = [...this.tempSelectedUsers, userId];
    }
  }

  getSelectedUsersCount() {
    return this.discountForm.value.selectedUsers?.length || 0;
  }

  confirmUserSelection() {
    this.discountForm.get('selectedUsers')?.setValue([...this.tempSelectedUsers]);
    this.closeUserModal();
  }

  getUserProfileImage(user: any): string {
    if (user.profileImage && user.profileImage !== '/upload/defaultProfile.png') {
      if (user.profileImage.startsWith('http')) return user.profileImage;
      return 'http://localhost:8080' + user.profileImage;
    }
    return '/assets/project_img/fashion_store.jpg';
  }

  onUserImageError(event: any) {
    event.target.src = '/assets/images/default-profile.png';
  }

  areAllUsersSelected() {
    return this.filteredAllUsers.length > 0 && this.filteredAllUsers.every(user => this.tempSelectedUsers.includes(user.userId));
  }

  toggleAllUsers() {
    if (this.areAllUsersSelected()) {
      this.tempSelectedUsers = this.tempSelectedUsers.filter((id: any) => !this.filteredAllUsers.some(user => user.userId === id));
    } else {
      const toAdd = this.filteredAllUsers.map(user => user.userId).filter((id: any) => !this.tempSelectedUsers.includes(id));
      this.tempSelectedUsers = [...this.tempSelectedUsers, ...toAdd];
    }
  }
}
