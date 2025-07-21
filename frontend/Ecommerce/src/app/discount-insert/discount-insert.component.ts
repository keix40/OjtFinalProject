import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ProductService } from '../services/product.service';
import { DiscountService, DiscountRequestDTO } from '../services/discount.service';
import { ProductDTO } from '../product';
import { Router } from '@angular/router';
import { BrandService, BrandHasCategory } from '../services/brand.service';
import { CategoryService } from '../services/category.service';

@Component({
  selector: 'app-discount-insert',
  standalone: false,
  templateUrl: './discount-insert.component.html',
  styleUrl: './discount-insert.component.css'
})
export class DiscountInsertComponent implements OnInit {
 
  
   searchControl = new FormControl('');
  discountForm!: FormGroup;
  products: ProductDTO[] = [];
  brands: any[] = [];
  categories: any[] = [];
  brandCategories: BrandHasCategory[] = [];
  isSubmitting = false;
  selectedProductIds: number[] = [];
  productTouched = false;
  showProductModal = false;
  tempSelectedProductIds: number[] = [];
  eventForm!: FormGroup;
  searchTerm: string = '';
  filteredProducts: ProductDTO[] = [];
  discountedProducts: { [productId: number]: { discount_percent: number, event_name: string } } = {};
  
  // Add properties for duplicate warning modal
  duplicateConflicts: any[] = [];
  showDuplicateWarning = false;
  conflictResolutions: Map<string, string> = new Map(); // Store resolution choices for each conflict
  pendingDiscountDTO: DiscountRequestDTO | null = null; // Store the DTO that was being submitted
  brandSearchControl = new FormControl('');
  categorySearchControl = new FormControl('');
  brandCategorySearchControl = new FormControl('');

  filteredBrands: any[] = [];
  filteredCategories: any[] = [];
  filteredBrandCategories: BrandHasCategory[] = [];
  showBrandDropdown: boolean = false;
  showCategoryDropdown: boolean = false;
  showBrandCategoryDropdown: boolean = false;
  
  // Multi-selection arrays
  selectedBrandIds: number[] = [];
  selectedCategoryIds: number[] = [];
  selectedBrandCategoryIds: string[] = [];
  
  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private discountService: DiscountService,
    private brandService: BrandService,
    private categoryService: CategoryService,
    private router: Router
  ) {}

 discountValueValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (!control || !control.parent) return null;

    const type = control.parent.get('discountType')?.value;
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return { required: true };
    }

    // Convert to number for validation
    const numValue = Number(value);

    // For FIXED: must be positive and max 15 digits
    if (type === 'FIXED') {
      if (numValue <= 0) return { type: 'positive' };
      if (value.toString().length > 15) return { maxdigits: true };
      if (numValue % 1 !== 0) return { type: 'integer' };
    }

    // For PERCENTAGE: must be > 0 and <= 100
    if (type === 'PERCENTAGE') {
      if (numValue <= 0) return { type: 'positive' };
      if (numValue > 100) return { type: 'maxPercentage' };
    }

    return null;
  };
}

  // Custom validator for arrays to ensure they have at least one item
  arrayRequiredValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value || !Array.isArray(control.value) || control.value.length === 0) {
        return { required: true };
      }
    return null;
  };
}

  ngOnInit(): void {
    this.discountForm = this.fb.group({
      name: ['', Validators.required],
      discountType: ['PERCENTAGE', Validators.required],
      discountValue: [null, [Validators.required, this.discountValueValidator()]],
      description: ['', Validators.required],
      targetType: ['PRODUCT', Validators.required],
      productId: [null],
      productIds: [[]],
      brandId: [null],
      brandIds: [[]],
      categoryId: [null],
      categoryIds: [[]],
      brandCategoryId: [null],
      brandCategoryIds: [[]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      status: [true, Validators.required],
      isEvent: [false, Validators.required],
    }, {
      validators: [this.startEndDateNotSameTimeValidator()]
    });
    
    // Add target type change listener to update validation
    this.discountForm.get('targetType')?.valueChanges.subscribe(targetType => {
      this.resetTargetValidation();
      this.updateTargetValidation(targetType);
    });

    this.loadProducts();
    this.loadBrands();
    this.loadCategories();
    this.loadBrandCategories();
    this.loadExistingDiscounts(); // Add this line
    
    this.eventForm = this.fb.group({
      productIds: [[], Validators.required],
    });

    this.searchControl.valueChanges.subscribe(term => {
      this.searchTerm = term || '';
      this.filterProductsBySearch();
    });
    
    
     this.discountForm.get('discountType')?.valueChanges.subscribe(() => {
  this.discountForm.get('discountValue')?.updateValueAndValidity();
});

    // Filter brands on search
    this.brandSearchControl.valueChanges.subscribe(term => {
      this.filterBrands(term || '');
    });
    // Filter categories on search
    this.categorySearchControl.valueChanges.subscribe(term => {
      this.filterCategories(term || '');
    });
    // Filter brand categories on search
    this.brandCategorySearchControl.valueChanges.subscribe(term => {
      this.filterBrandCategories(term || '');
    });

    // Keep brandSearchControl in sync with selected brand
    this.discountForm.get('brandId')?.valueChanges.subscribe(id => {
      if (id) {
        const brand = this.brands.find((b: any) => b.id === id);
        if (brand) {
          this.brandSearchControl.setValue(brand.name, { emitEvent: false });
        }
      }
    });
  }

 

  // Validator: start and end date must not be the same exact time
  startEndDateNotSameTimeValidator(): ValidatorFn {
    return (group: AbstractControl): { [key: string]: any } | null => {
      const start = group.get('startDate')?.value;
      const end = group.get('endDate')?.value;
      if (start && end && new Date(start).getTime() === new Date(end).getTime()) {
        return { sameDateTime: true };
      }
      return null;
    };
  }


  loadProducts() {
  this.productService.getAllAcProduct().subscribe({
    next: (products) => {
      this.products = products;
      this.filterProductsBySearch(); // <-- Add this line
    },
    error: () => {
      this.products = [];
      this.filterProductsBySearch(); // <-- Also add here for consistency
    }
  });
}

  loadBrands() {
    this.brandService.getAllBrand().subscribe({
      next: (brands) => {
        this.brands = brands;
        this.filterBrands(this.brandSearchControl.value || '');
      },
      error: () => {
        this.brands = [];
        this.filterBrands('');
      }
    });
  }

  loadCategories() {
    this.categoryService.getAllCategory().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.filterCategories(this.categorySearchControl.value || '');
      },
      error: () => {
        this.categories = [];
        this.filterCategories('');
      }
    });
  }

  loadBrandCategories() {
    this.brandService.getAllBrandCategories().subscribe({
      next: (brandCategories) => {
        this.brandCategories = brandCategories;
        this.filterBrandCategories(this.brandCategorySearchControl.value || '');
      },
      error: () => {
        this.brandCategories = [];
        this.filterBrandCategories('');
      }
    });
  }

  filterBrands(term: string) {
    const search = term.toLowerCase();
    this.filteredBrands = this.brands.filter((brand: any) =>
      brand.name && brand.name.toLowerCase().includes(search)
    );
  }

  filterCategories(term: string) {
    const search = term.toLowerCase();
    this.filteredCategories = this.categories.filter((category: any) =>
      category.name && category.name.toLowerCase().includes(search)
    );
  }

  filterBrandCategories(term: string) {
    const search = term.toLowerCase();
    this.filteredBrandCategories = this.brandCategories.filter((bc: BrandHasCategory) =>
      (bc.brand.name && bc.brand.name.toLowerCase().includes(search)) ||
      (bc.category.name && bc.category.name.toLowerCase().includes(search))
    );
  }

  loadExistingDiscounts() {
    this.discountService.getActiveDiscount().subscribe({
      next: (discounts) => {
        // Populate discountedProducts with existing discount info
        discounts.forEach(discount => {
          if (discount.affectedProductIds && discount.affectedProductIds.length > 0) {
            discount.affectedProductIds.forEach(productId => {
              this.discountedProducts[productId] = {
                discount_percent: discount.discount_percent,
                event_name: discount.name
              };
            });
          }
        });
      },
      error: (error) => {
        console.error('Failed to load existing discounts:', error);
      }
    });
  }

  updateTargetValidation(targetType: string) {
    const productControl = this.discountForm.get('productIds');
    const brandControl = this.discountForm.get('brandIds');
    const categoryControl = this.discountForm.get('categoryIds');
    const brandCategoryControl = this.discountForm.get('brandCategoryIds');

    // Clear all validations first
    productControl?.clearValidators();
    brandControl?.clearValidators();
    categoryControl?.clearValidators();
    brandCategoryControl?.clearValidators();

    // Set validation based on target type
    switch (targetType) {
      case 'PRODUCT':
        productControl?.setValidators([this.arrayRequiredValidator()]);
        break;
      case 'BRAND':
        brandControl?.setValidators([this.arrayRequiredValidator()]);
        break;
      case 'CATEGORY':
        categoryControl?.setValidators([this.arrayRequiredValidator()]);
        break;
      case 'BRAND_CATEGORY':
        brandCategoryControl?.setValidators([this.arrayRequiredValidator()]);
        break;
    }

    // Update validation
    productControl?.updateValueAndValidity();
    brandControl?.updateValueAndValidity();
    categoryControl?.updateValueAndValidity();
    brandCategoryControl?.updateValueAndValidity();
    
    // Mark the appropriate control as touched to trigger validation display
    switch (targetType) {
      case 'PRODUCT':
        productControl?.markAsTouched();
        break;
      case 'BRAND':
        brandControl?.markAsTouched();
        break;
      case 'CATEGORY':
        categoryControl?.markAsTouched();
        break;
      case 'BRAND_CATEGORY':
        brandCategoryControl?.markAsTouched();
        break;
    }
  }

  // Method to manually validate the current target type
  validateCurrentTarget() {
    const targetType = this.targetType;
    let isValid = false;
    
    switch (targetType) {
      case 'PRODUCT':
        isValid = this.selectedProductIds.length > 0;
        break;
      case 'BRAND':
        isValid = this.selectedBrandIds.length > 0;
        break;
      case 'CATEGORY':
        isValid = this.selectedCategoryIds.length > 0;
        break;
      case 'BRAND_CATEGORY':
        isValid = this.selectedBrandCategoryIds.length > 0;
        break;
    }
    
    return isValid;
  }

  // Method to reset form validation for target fields
  resetTargetValidation() {
    const productControl = this.discountForm.get('productIds');
    const brandControl = this.discountForm.get('brandIds');
    const categoryControl = this.discountForm.get('categoryIds');
    const brandCategoryControl = this.discountForm.get('brandCategoryIds');

    // Clear all validations
    productControl?.clearValidators();
    brandControl?.clearValidators();
    categoryControl?.clearValidators();
    brandCategoryControl?.clearValidators();

    // Update validation
    productControl?.updateValueAndValidity();
    brandControl?.updateValueAndValidity();
    categoryControl?.updateValueAndValidity();
    brandCategoryControl?.updateValueAndValidity();
  }

  get discountType() {
    return this.discountForm.get('discountType')?.value;
  }

  get targetType() {
    return this.discountForm.get('targetType')?.value;
  }

  onProductCheckboxChange(event: any, productId: number) {
    this.productTouched = true;
    if (event.target.checked) {
      if (!this.selectedProductIds.includes(productId)) {
        this.selectedProductIds.push(productId);
      }
    } else {
      this.selectedProductIds = this.selectedProductIds.filter(id => id !== productId);
    }
    // Update the form value for productIds as a comma-separated string
    this.discountForm.patchValue({
      productId: this.selectedProductIds.length > 0 ? this.selectedProductIds : null
    });
  }

  // New method to check for duplicate discounts
  checkForDuplicateDiscounts(dto: DiscountRequestDTO): void {
    this.discountService.checkDuplicateDiscount(dto).subscribe({
      next: (conflicts) => {
        if (conflicts && conflicts.length > 0) {
          // Show error message and prevent creation
          this.showDuplicateError(conflicts);
          this.isSubmitting = false;
        } else {
          // No conflicts, proceed with creating discount
          this.createDiscount(dto);
        }
      },
      error: (error) => {
        console.error('Error checking for duplicates:', error);
        // If check fails, proceed with creation (fail-safe)
        this.createDiscount(dto);
      }
    });
  }

  // Method to show duplicate error
  showDuplicateError(conflicts: any[]): void {
    this.duplicateConflicts = conflicts;
    this.showDuplicateWarning = true;
    // Initialize default resolutions (SKIP for all conflicts)
    this.conflictResolutions.clear();
    conflicts.forEach(conflict => {
      const conflictKey = `${conflict.targetType}-${conflict.targetId}`;
      this.conflictResolutions.set(conflictKey, 'SKIP');
    });
  }

  // Method to close duplicate warning
  closeDuplicateWarning(): void {
    this.showDuplicateWarning = false;
    this.duplicateConflicts = [];
    this.conflictResolutions.clear();
    this.pendingDiscountDTO = null;
    this.isSubmitting = false;
  }

  // Method to get resolution for a specific conflict
  getConflictResolution(conflict: any): string {
    const conflictKey = `${conflict.targetType}-${conflict.targetId}`;
    return this.conflictResolutions.get(conflictKey) || 'SKIP';
  }

  // Method to set resolution for a specific conflict
  setConflictResolution(conflict: any, resolution: string): void {
    const conflictKey = `${conflict.targetType}-${conflict.targetId}`;
    this.conflictResolutions.set(conflictKey, resolution);
  }

  // Method to check if we can proceed with resolution
  canProceedWithResolution(): boolean {
    return this.duplicateConflicts.length > 0 && this.pendingDiscountDTO !== null;
  }

  // Method to proceed with the chosen resolutions
  proceedWithResolution(): void {
    if (!this.pendingDiscountDTO) return;
    
    // Check if any conflict is set to OVERWRITE
    const hasOverwrite = Array.from(this.conflictResolutions.values()).some(resolution => resolution === 'OVERWRITE');
    
    console.log('[Discount] Proceeding with resolution. DTO:', this.pendingDiscountDTO);
    console.log('[Discount] Conflict resolutions:', Array.from(this.conflictResolutions.entries()));
    
    if (hasOverwrite) {
      // Use the new endpoint with resolution
      this.createDiscountWithResolution(this.pendingDiscountDTO, this.conflictResolutions);
    } else {
      // All conflicts are SKIP, proceed normally
      this.createDiscount(this.pendingDiscountDTO);
    }
  }

  // Method to create discount with resolution
  createDiscountWithResolution(dto: DiscountRequestDTO, conflictResolutions: any): void {
    console.log('[Discount] Sending createDiscountWithResolution payload:', dto, conflictResolutions);
    this.discountService.createDiscountWithResolution(dto, conflictResolutions).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeDuplicateWarning();
        this.router.navigate(['discount-list']);
      },
      error: () => {
        this.isSubmitting = false;
        alert('Failed to create discount event.');
        this.closeDuplicateWarning();
      }
    });
  }

  // Method to create discount after duplicate check
  createDiscount(dto: DiscountRequestDTO): void {
    this.discountService.createDiscount(dto).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['discount-list']);
      },
      error: () => {
        this.isSubmitting = false;
        alert('Failed to create discount event.');
        console.log('dto payload :', dto);
        console.log('dto payload (JSON):', JSON.stringify(dto, null, 2));
      }
    });
  }



  onSubmit() {
    this.productTouched = true;
    
    // Debug form state
    console.log('Form valid:', this.discountForm.valid);
    console.log('Form invalid:', this.discountForm.invalid);
    console.log('Form errors:', this.discountForm.errors);
    console.log('Form value:', this.discountForm.value);
    console.log('Target type:', this.targetType);
    console.log('Selected products:', this.selectedProductIds);
    console.log('Selected brands:', this.selectedBrandIds);
    console.log('Selected categories:', this.selectedCategoryIds);
    console.log('Selected brand categories:', this.selectedBrandCategoryIds);
    
    // Check if form is invalid
    if (this.discountForm.invalid) {
      console.log('Form is invalid:', this.discountForm.errors);
      // Log individual field errors
      Object.keys(this.discountForm.controls).forEach(key => {
        const control = this.discountForm.get(key);
        if (control?.errors) {
          console.log(`${key} errors:`, control.errors);
        }
      });
      return;
    }
    
    // Check target-specific validation
    if (!this.validateCurrentTarget()) {
      console.log('No valid target selected for type:', this.targetType);
      return;
    }
    
    this.isSubmitting = true;
    const form = this.discountForm.value;

    const dto: DiscountRequestDTO = {
      name: form.name,
      description: form.description,
      discountType: form.discountType,
      discount_percent: form.discountType === 'PERCENTAGE' ? form.discountValue : 0,
      discount_amount: form.discountType === 'FIXED' ? form.discountValue : 0,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : '',
      endDate: form.endDate ? new Date(form.endDate).toISOString() : '',
      status: form.status,
      targetType: form.targetType.toUpperCase(),
      productIds: this.targetType === 'PRODUCT' && this.selectedProductIds.length > 0
        ? this.selectedProductIds.join(',')
        : undefined,
      brandIds: this.targetType === 'BRAND' && this.selectedBrandIds.length > 0
        ? this.selectedBrandIds.join(',')
        : undefined,
      categoryIds: this.targetType === 'CATEGORY' && this.selectedCategoryIds.length > 0
        ? this.selectedCategoryIds.join(',')
        : undefined,
      brandCategoryIds: this.targetType === 'BRAND_CATEGORY' && this.selectedBrandCategoryIds.length > 0
        ? this.selectedBrandCategoryIds.join(',')
        : undefined,
      brandId: undefined,
      categoryId: undefined,
      brandCategoryId: undefined,
      targetId: undefined,
      isEvent: form.isEvent
    };
    
    console.log('Submitting DTO:', dto);
    
    // Store the DTO for potential conflict resolution
    this.pendingDiscountDTO = dto;
    
    // Check for duplicates before creating
    this.checkForDuplicateDiscounts(dto);
  }

  onCancel() {
    this.router.navigate(['discount-list']);
  }

  // Get product image URL
  getProductImageUrl(product: ProductDTO): string {
    if (product.productImages?.length > 0) {
      return 'http://localhost:8080' + product.productImages[0].imageUrl;
    }
    return '/assets/project_img/fashion_store.jpg';
  }

  openProductModal() {
    this.tempSelectedProductIds = [...this.selectedProductIds];
    this.showProductModal = true;
  }

  closeProductModal() {
    this.showProductModal = false;
  }

  confirmProductSelection() {
    this.selectedProductIds = [...this.tempSelectedProductIds];
    this.discountForm.patchValue({
      productIds: this.selectedProductIds.length > 0 ? this.selectedProductIds : null
    });
    this.discountForm.get('productIds')?.markAsTouched();
    // Modal will close via data-bs-dismiss
  }

  onModalProductCheckboxChange(event: any, productId: number) {
    // Prevent selection if product already has discount
    if (this.isProductAlreadyDiscounted(productId)) {
      event.target.checked = false;
      return;
    }
    
    if (event.target.checked) {
      if (!this.tempSelectedProductIds.includes(productId)) {
        this.tempSelectedProductIds.push(productId);
      }
    } else {
      this.tempSelectedProductIds = this.tempSelectedProductIds.filter(id => id !== productId);
    }
  }

  get selectedProductCount(): number {
    return this.selectedProductIds.length;
  }

 filterProductsBySearch() {
  if (!this.searchTerm.trim()) {
    this.filteredProducts = this.products;
    return;
  }
  const searchLower = this.searchTerm.toLowerCase();
  this.filteredProducts = this.products.filter(product => {
    // Product name and code
    let matches = product.productName.toLowerCase().includes(searchLower) ||
                  product.productCode.toLowerCase().includes(searchLower);

    // Brand and category (if available)
    if (product.categoryBrandArray && Array.isArray(product.categoryBrandArray)) {
      matches = matches ||
        product.categoryBrandArray.some(pair =>
          (pair.brandName && pair.brandName.toLowerCase().includes(searchLower)) ||
          (pair.cateName && pair.cateName.toLowerCase().includes(searchLower))
        );
    }
    return matches;
  });
}

  openProductSelectionModal() {
    this.tempSelectedProductIds = [...(this.eventForm.get('productIds')?.value || [])];
    this.searchTerm = '';
    this.filterProductsBySearch();
  }

  closeProductSelectionModal() {
    this.showProductModal = false;
  }

  isProductAlreadyDiscounted(productId: number): boolean {
    return !!this.discountedProducts[productId];
  }

  getExistingDiscountInfo(productId: number) {
    return this.discountedProducts[productId];
  }

  getSelectableProductsCount(): number {
    return this.filteredProducts.filter(product => !this.isProductAlreadyDiscounted(product.id)).length;
  }

  isProductSelected(productId: number): boolean {
    return this.tempSelectedProductIds.includes(productId);
  }

  toggleProductSelection(productId: number) {
    // Prevent selection if product already has discount
    if (this.isProductAlreadyDiscounted(productId)) {
      return;
    }
    
    const idx = this.tempSelectedProductIds.indexOf(productId);
    if (idx > -1) {
      this.tempSelectedProductIds.splice(idx, 1);
    } else {
      this.tempSelectedProductIds.push(productId);
    }
  }

  areAllProductsSelected(): boolean {
    const selectableProducts = this.filteredProducts.filter(product => !this.isProductAlreadyDiscounted(product.id));
    return selectableProducts.length > 0 &&
      selectableProducts.every(product => this.tempSelectedProductIds.includes(product.id));
  }

  toggleAllProducts() {
    if (this.areAllProductsSelected()) {
      this.filteredProducts.forEach(product => {
        const idx = this.tempSelectedProductIds.indexOf(product.id);
        if (idx > -1) {
          this.tempSelectedProductIds.splice(idx, 1);
        }
      });
    } else {
      this.filteredProducts.forEach(product => {
        // Only add products that don't already have discounts
        if (!this.tempSelectedProductIds.includes(product.id) && !this.isProductAlreadyDiscounted(product.id)) {
          this.tempSelectedProductIds.push(product.id);
        }
      });
    }
  }

  getSelectedProductsCount(): number {
    return this.selectedProductIds.length;
  }

  onDiscountValueKeydown(event: KeyboardEvent) {
    if (this.discountType === 'FIXED') {
      if (event.key === '.' || event.key === ',' || event.key === 'Decimal') {
        event.preventDefault();
      }
    }
  }

  getBrandNameById(id: any): string {
    const brand = this.brands.find((b: any) => b.id === id);
    return brand ? brand.name : '';
  }

  onBrandInputChange(term: string) {
    this.brandSearchControl.setValue(term, { emitEvent: false });
    this.filterBrands(term);
    // If the input doesn't match the selected brand, clear the selection
    const selectedBrand = this.getBrandNameById(this.discountForm.get('brandId')?.value);
    if (term !== selectedBrand) {
      this.discountForm.get('brandId')?.setValue(null);
    }
    this.showBrandDropdown = true;
  }

  selectBrand(brand: any) {
    this.discountForm.get('brandId')?.setValue(brand.id);
    this.brandSearchControl.setValue(brand.name, { emitEvent: false });
    this.showBrandDropdown = false;
  }

  onBrandInputBlur() {
    setTimeout(() => {
      this.showBrandDropdown = false;
      // If the input doesn't match any brand, clear the selection
      const input = this.brandSearchControl.value;
      const match = this.brands.find((b: any) => b.name === input);
      if (!match) {
        this.discountForm.get('brandId')?.setValue(null);
      }
    }, 150);
  }

  onBrandInputEvent(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.onBrandInputChange(value);
  }
  
  // CATEGORY AUTOCOMPLETE
  getCategoryNameById(id: any): string {
    const category = this.categories.find((c: any) => c.id === id);
    return category ? category.name : '';
  }

  onCategoryInputChange(term: string) {
    this.categorySearchControl.setValue(term, { emitEvent: false });
    this.filterCategories(term);
    const selectedCategory = this.getCategoryNameById(this.discountForm.get('categoryId')?.value);
    if (term !== selectedCategory) {
      this.discountForm.get('categoryId')?.setValue(null);
    }
    this.showCategoryDropdown = true;
  }

  onCategoryInputEvent(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.onCategoryInputChange(value);
  }

  selectCategory(category: any) {
    this.discountForm.get('categoryId')?.setValue(category.id);
    this.categorySearchControl.setValue(category.name, { emitEvent: false });
    this.showCategoryDropdown = false;
  }

  onCategoryInputBlur() {
    setTimeout(() => {
      this.showCategoryDropdown = false;
      const input = this.categorySearchControl.value;
      const match = this.categories.find((c: any) => c.name === input);
      if (!match) {
        this.discountForm.get('categoryId')?.setValue(null);
      }
    }, 150);
  }

  closeCategoryDropdown() {
    this.showCategoryDropdown = false;
  }

  // BRAND CATEGORY AUTOCOMPLETE
  getBrandCategoryNameById(id: any): string {
    if (!id) return '';
    const [brandId, categoryId] = id.split('-');
    const bc = this.brandCategories.find((b: any) => b.brand.id == brandId && b.category.id == categoryId);
    return bc ? `${bc.brand.name} - ${bc.category.name}` : '';
  }

  onBrandCategoryInputChange(term: string) {
    this.brandCategorySearchControl.setValue(term, { emitEvent: false });
    this.filterBrandCategories(term);
    const selectedBC = this.getBrandCategoryNameById(this.discountForm.get('brandCategoryId')?.value);
    if (term !== selectedBC) {
      this.discountForm.get('brandCategoryId')?.setValue(null);
    }
    this.showBrandCategoryDropdown = true;
  }

  onBrandCategoryInputEvent(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.onBrandCategoryInputChange(value);
  }

  selectBrandCategory(bc: any) {
    const value = bc.brand.id + '-' + bc.category.id;
    this.discountForm.get('brandCategoryId')?.setValue(value);
    this.brandCategorySearchControl.setValue(`${bc.brand.name} - ${bc.category.name}`, { emitEvent: false });
    this.showBrandCategoryDropdown = false;
  }

  onBrandCategoryInputBlur() {
    setTimeout(() => {
      this.showBrandCategoryDropdown = false;
      const input = this.brandCategorySearchControl.value;
      const match = this.brandCategories.find((b: any) => `${b.brand.name} - ${b.category.name}` === input);
      if (!match) {
        this.discountForm.get('brandCategoryId')?.setValue(null);
      }
    }, 150);
  }

  closeBrandDropdown() {
    this.showBrandDropdown = false;
  }

  closeBrandCategoryDropdown() {
    this.showBrandCategoryDropdown = false;
  }

  // Multi-selection methods for Brands
  isBrandSelected(brandId: number): boolean {
    return this.selectedBrandIds.includes(brandId);
  }

  toggleBrandSelection(brand: any) {
    const idx = this.selectedBrandIds.indexOf(brand.id);
    if (idx > -1) {
      this.selectedBrandIds.splice(idx, 1);
    } else {
      this.selectedBrandIds.push(brand.id);
    }
    this.updateBrandFormValue();
  }

  onBrandCheckboxChange(event: any, brandId: number) {
    if (event.target.checked) {
      if (!this.selectedBrandIds.includes(brandId)) {
        this.selectedBrandIds.push(brandId);
      }
    } else {
      this.selectedBrandIds = this.selectedBrandIds.filter(id => id !== brandId);
    }
    this.updateBrandFormValue();
  }

  removeBrandSelection(brandId: number) {
    this.selectedBrandIds = this.selectedBrandIds.filter(id => id !== brandId);
    this.updateBrandFormValue();
  }

  getSelectedBrandsCount(): number {
    return this.selectedBrandIds.length;
  }

  getSelectedBrandIds(): number[] {
    return this.selectedBrandIds;
  }

  updateBrandFormValue() {
    this.discountForm.patchValue({
      brandIds: this.selectedBrandIds.length > 0 ? this.selectedBrandIds : []
    });
    this.discountForm.get('brandIds')?.markAsTouched();
  }

  // Multi-selection methods for Categories
  isCategorySelected(categoryId: number): boolean {
    return this.selectedCategoryIds.includes(categoryId);
  }

  toggleCategorySelection(category: any) {
    const idx = this.selectedCategoryIds.indexOf(category.id);
    if (idx > -1) {
      this.selectedCategoryIds.splice(idx, 1);
    } else {
      this.selectedCategoryIds.push(category.id);
    }
    this.updateCategoryFormValue();
  }

  onCategoryCheckboxChange(event: any, categoryId: number) {
    if (event.target.checked) {
      if (!this.selectedCategoryIds.includes(categoryId)) {
        this.selectedCategoryIds.push(categoryId);
      }
    } else {
      this.selectedCategoryIds = this.selectedCategoryIds.filter(id => id !== categoryId);
    }
    this.updateCategoryFormValue();
  }

  removeCategorySelection(categoryId: number) {
    this.selectedCategoryIds = this.selectedCategoryIds.filter(id => id !== categoryId);
    this.updateCategoryFormValue();
  }

  getSelectedCategoriesCount(): number {
    return this.selectedCategoryIds.length;
  }

  getSelectedCategoryIds(): number[] {
    return this.selectedCategoryIds;
  }

  updateCategoryFormValue() {
    this.discountForm.patchValue({
      categoryIds: this.selectedCategoryIds.length > 0 ? this.selectedCategoryIds : []
    });
    this.discountForm.get('categoryIds')?.markAsTouched();
  }

  // Multi-selection methods for Brand Categories
  isBrandCategorySelected(brandCategoryId: string): boolean {
    return this.selectedBrandCategoryIds.includes(brandCategoryId);
  }

  toggleBrandCategorySelection(bc: any) {
    const brandCategoryId = bc.brand.id + '-' + bc.category.id;
    const idx = this.selectedBrandCategoryIds.indexOf(brandCategoryId);
    if (idx > -1) {
      this.selectedBrandCategoryIds.splice(idx, 1);
    } else {
      this.selectedBrandCategoryIds.push(brandCategoryId);
    }
    this.updateBrandCategoryFormValue();
  }

  onBrandCategoryCheckboxChange(event: any, bc: any) {
    const brandCategoryId = bc.brand.id + '-' + bc.category.id;
    if (event.target.checked) {
      if (!this.selectedBrandCategoryIds.includes(brandCategoryId)) {
        this.selectedBrandCategoryIds.push(brandCategoryId);
      }
    } else {
      this.selectedBrandCategoryIds = this.selectedBrandCategoryIds.filter(id => id !== brandCategoryId);
    }
    this.updateBrandCategoryFormValue();
  }

  removeBrandCategorySelection(brandCategoryId: string) {
    this.selectedBrandCategoryIds = this.selectedBrandCategoryIds.filter(id => id !== brandCategoryId);
    this.updateBrandCategoryFormValue();
  }

  getSelectedBrandCategoriesCount(): number {
    return this.selectedBrandCategoryIds.length;
  }

  getSelectedBrandCategoryIds(): string[] {
    return this.selectedBrandCategoryIds;
  }

  updateBrandCategoryFormValue() {
    this.discountForm.patchValue({
      brandCategoryIds: this.selectedBrandCategoryIds.length > 0 ? this.selectedBrandCategoryIds : []
    });
    this.discountForm.get('brandCategoryIds')?.markAsTouched();
  }
}
