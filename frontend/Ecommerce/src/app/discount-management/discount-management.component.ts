import { Component, OnInit, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { DiscountDTO, DiscountService, DiscountRequestDTO } from '../services/discount.service';
import { debounceTime, first, map, Observable, of } from 'rxjs';
import { DiscountCouponService } from '../services/discount-coupon.service';
import { NotificationService } from '../services/notification.service';
import { NotifcationService } from '../notifcation.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductService} from '../services/product.service';
import { ProductDTO } from '../product';
import { PermissionService } from '../services/permission.service';
import { PermissionConstants } from '../constants/permission.constants';
import { UserService } from '../services/user.service';

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
  discounts: any[] = []; // All discounts fetched from backend
  filteredDiscounts: any[] = []; // Discounts after filtering
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
  discountProducts: ProductDTO[] = [];
  showProductDetails: boolean = false;
  @ViewChild('productDetailsModal') productDetailsModalRef: any;
  discountUsers: any[] = []; // Add this for user list
  @ViewChild('userDetailsModal') userDetailsModalRef: any;

  public PermissionConstants = PermissionConstants;
  // Add properties for filter/search UI
  searchTerm: string = '';
  selectedStatus: string = '';
  statusOptions: Array<{ value: string, label: string }> = [{ value: '', label: 'All' }];
  // Remove date range filter properties
  // selectedDateRange: string = '';
  // dateRanges: Array<{ value: string, label: string }> = [...];

  // Pagination properties
  pageSize: number = 10;
  currentPage: number = 1;
  get totalPages(): number {
    return Math.ceil(this.filteredDiscounts.length / this.pageSize);
  }
  get paginatedDiscounts(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredDiscounts.slice(start, start + this.pageSize);
  }
  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  get showingFrom(): number {
    return this.filteredDiscounts.length === 0 ? 0 : (this.pageSize * (this.currentPage - 1)) + 1;
  }
  get showingTo(): number {
    return Math.min(this.pageSize * this.currentPage, this.filteredDiscounts.length);
  }
  get showPagination(): boolean {
    return this.totalPages > 1;
  }

  get totalItems(): number {
    return this.filteredDiscounts.length;
  }

  onSearch() {
    this.applyFilters();
  }
  onStatusChange() {
    this.applyFilters();
  }
  
  applyFilters() {
    // If searchTerm is empty and no status filter, show all discounts
    if (!this.searchTerm && !this.selectedStatus) {
      this.filteredDiscounts = [...this.discounts];
      this.currentPage = 1;
      return;
    }
    this.filteredDiscounts = this.discounts.filter(d => {
      const matchesStatus = !this.selectedStatus || d.status === this.selectedStatus;
      const code = d.code ? d.code.toLowerCase() : '';
      const statusStr = typeof d.status === 'string' ? d.status.toLowerCase() : d.status === true ? 'active' : d.status === false ? 'inactive' : '';
      const search = this.searchTerm.toLowerCase();
      const matchesSearch = !this.searchTerm ||
        (code && code.includes(search)) ||
        (statusStr && statusStr.includes(search)) ||
        (d.name && d.name.toLowerCase().includes(search));
      return matchesStatus && matchesSearch;
    });
    this.currentPage = 1;
  }

  constructor(
    private discountService: DiscountService,
    private fb: FormBuilder,
    private discountCouponService:DiscountCouponService,
    private notificationService: NotificationService,
    private notifcationService: NotifcationService,
    private modalService: NgbModal,
    private productService: ProductService, // <-- Inject ProductService
    public permissionService: PermissionService,
    private userService: UserService
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

  ngOnInit() {
    this.fetchDiscounts();
    // this.showActiveDiscountNotification();
  }

  fetchDiscounts() {
    this.discountService.getAllDiscount().subscribe((data: any[]) => {
      this.discounts = data;
      this.updateStatusOptions();
      this.applyFilters(); // Ensure filteredDiscounts is initialized to all discounts
    });
  }

  updateStatusOptions() {
    const uniqueStatuses = Array.from(new Set(this.discounts.map(d => d.status).filter(Boolean)));
    this.statusOptions = [{ value: '', label: 'All' }, ...uniqueStatuses.map(s => ({ value: s, label: this.formatStatusLabel(s) }))];
  }

  formatStatusLabel(status: any): string {
    if (typeof status === 'boolean') {
      return status ? 'Active' : 'Inactive';
    }
    if (typeof status === 'string') {
      return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
    return '';
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
          this.fetchDiscounts();
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
          this.fetchDiscounts();
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
            this.fetchDiscounts();
          }
        },
        error: () => {
          failed = true;
          this.notificationService.showError('Failed to delete one or more discounts.');
        }
      });
    });
  }

  openDetailsModal(discount: DiscountDTO, modalRef: any): void {
    this.editDiscountId = discount.id;
    this.detailsDiscount = discount;
    this.detailsEdit = { ...discount };
    this.viewMode = true;
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
    // Ensure form is disabled initially
    this.detailsForm.disable();
    // Re-disable code field if it's auto-apply discount
    if (this.detailsDiscount && this.detailsDiscount.autoApply) {
      this.detailsForm.get('code')?.disable();
    }
    // Fetch products by productIds, brandId, or categoryId
    this.discountProducts = [];
    this.discountUsers = []; // Reset user list
    const d: any = discount;
    
    // Fetch users if userIds exist
    if (d.userIds) {
      const userIds = d.userIds.split(',').map((id: string) => Number(id)).filter((id: number) => !isNaN(id));
      if (userIds.length > 0) {
        // Fetch user details for each user ID
        userIds.forEach((userId: number) => {
          this.userService.getUserById(userId.toString()).subscribe({
            next: (user) => {
              this.discountUsers.push(user);
            },
            error: () => {
              console.error(`Failed to fetch user with ID: ${userId}`);
            }
          });
        });
      }
    }
    
    if (d.productIds) {
      const ids = d.productIds.split(',').map((id: string) => Number(id)).filter((id: number) => !isNaN(id));
      if (ids.length > 0) {
        this.productService.getProductsByIds(ids).subscribe({
          next: (products) => { this.discountProducts = products; },
          error: () => { this.discountProducts = []; }
        });
      }
    } else if (d.brandIds || d.categoryIds) {
      this.productService.getAllAcProduct().subscribe({
        next: (products) => {
          const brandIdSet = d.brandIds ? new Set(d.brandIds.split(',').map(Number)) : null;
          const categoryIdSet = d.categoryIds ? new Set(d.categoryIds.split(',').map(Number)) : null;
          this.discountProducts = products.filter((p: any) => {
            const pairs = p.categoryBrandArray || [];
            const matchBrand = brandIdSet ? pairs.some((pair: any) => brandIdSet.has(pair.brandId)) : true;
            const matchCategory = categoryIdSet ? pairs.some((pair: any) => categoryIdSet.has(pair.categoryId)) : true;
            return matchBrand && matchCategory;
          });
        },
        error: () => { this.discountProducts = []; }
      });
    } else {
      // fallback: show all products (or none)
      this.discountProducts = [];
    }
    this.modalService.open(modalRef, { centered: true, size: 'lg', backdrop: 'static' });
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
      // Disable form controls
      this.detailsForm.disable();
    } else {
      // Enter edit mode
      this.isDetailsEditMode = true;
      // Enable form controls
      this.detailsForm.enable();
      // Re-disable code field if it's auto-apply discount
      if (this.detailsDiscount && this.detailsDiscount.autoApply) {
        this.detailsForm.get('code')?.disable();
      }
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
        this.fetchDiscounts();
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
        this.fetchDiscounts();
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

  getProductImageUrl(product: ProductDTO): string {
    if (product.productImages?.length > 0) {
      return 'http://localhost:8080' + product.productImages[0].imageUrl;
    }
    return '/assets/project_img/fashion_store.jpg';
  }

  openProductDetailsModal() {
    this.modalService.open(this.productDetailsModalRef, { size: 'xl', centered: true, backdrop: 'static' });
  }

  getUserProfileImage(user: any): string {
    if (user.profileImage && user.profileImage !== '/upload/defaultProfile.png') {
      if (user.profileImage.startsWith('http')) return user.profileImage;
      return 'http://localhost:8080' + user.profileImage;
    }
    return '/assets/project_img/fashion_store.jpg';
  }

  openUserDetailsModal() {
    this.modalService.open(this.userDetailsModalRef, { size: 'xl', centered: true, backdrop: 'static' });
  }

    
}