import { Component, OnInit, AfterViewInit, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { Category } from '../category';
import { Brand } from '../brand';
import { CategoryService } from '../services/category.service';
import { BrandService } from '../services/brand.service';
import { AttributeService } from '../services/attribute.service';
import { ModalService } from '../services/modal.service';
import { AttributeAndValueDTO } from '../attribute';
import Swal from 'sweetalert2';
import { ActivatedRoute } from '@angular/router';


// ===== Interfaces =====
interface AttributeValue {
  id: number;
  value: string;
  selected?: boolean;
  isNew: boolean;
}

interface Attribute {
  id: number;
  name: string;
  values: AttributeValue[];
}

interface ProductAttribute {
  attributeId: number;
  attributeName: string;
  allowedValues: AttributeValue[];
}

interface Variant {
  id: string;
  attributes: {
    attributeId: number;
    attributeName: string;
    valueId: number;
    value: string
  }[];
  sku: string;
  price: number;
  stock: number;
  images: {
    file: File;
    preview: string
  }[];
}

// ===== Constants =====
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

// ===== Component =====
@Component({
  selector: 'app-product',
  standalone: false,
  templateUrl: './product.component.html',
  styleUrl: './product.component.css'
})
export class ProductComponent implements OnInit, AfterViewInit, AfterViewChecked {
  // ===== Form Properties =====
  productForm!: FormGroup;
  submitted = false;
  hasVariant = false;
  sku: string = 'XXXXXXXXXXX';
  editMode = false;
  editingProductId: string | null = null;

  // ===== Data Properties =====
  categories: Category[] = [];
  brands: Brand[] = [];
  productAttributes: ProductAttribute[] = [];
  selectedAttributeId: number | null = null;

  // ===== Image Properties =====
  selectedImages: File[] = [];
  selectedImagesPreview: string[] = [];
  existingImages: any[] = [];
  imagesMarkedForDeletion: number[] = [];
  // For variant images
  existingVariantImages: { [variantIndex: number]: any[] } = {};
  variantImagesMarkedForDeletion: { [variantIndex: number]: number[] } = {};
  newVariantImages: { [variantIndex: number]: File[] } = {};
  newVariantImagesPreview: { [variantIndex: number]: string[] } = {};
  isDragging = false;
  uploadError = '';

  // ===== Attribute Modal Properties =====
  showNewAttributeModal = false;
  newAttributeName = '';
  newAttributeValues: string[] = [];
  newAttributeValueInput = '';
  selectedValueIdMap: { [attrId: number]: number | null } = {};

  // ===== Data Properties =====
  availableAttributes: Attribute[] = [];

  // ===== Icon Management =====
  private iconInitialized = false;

  // ===== New Form Array =====
  categoryBrandArray!: FormArray;
  removedCategoryBrandPairs: any[] = [];

  // ===== Constructor =====
  constructor(
    private fb: FormBuilder,
    private proService: ProductService,
    private cateService: CategoryService,
    private brandService: BrandService,
    private attributeService: AttributeService,
    private router: Router,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {
    this.initForm();
  }

  // ===== Lifecycle Hooks =====
  ngOnInit(): void {
    this.submitted = false;
    this.loadCategories();
    this.loadBrands();
    this.loadAttributes();

    // Initialize Lucide icons
    this.initializeLucideIcons();

    // Update SKU live as the form changes
    this.productForm.valueChanges.subscribe(() => {
      this.updateSKU();
    });

    // Hard-disable logic for hasVariant
    const nameCtrl = this.productForm.get('productName');
    const priceCtrl = this.productForm.get('price');
    const quantityCtrl = this.productForm.get('quantity');
    const hasVariantCtrl = this.productForm.get('hasVariant');
    const updateHasVariantState = () => {
      if (!this.canEnableVariants) {
        hasVariantCtrl?.disable({ emitEvent: false });
        hasVariantCtrl?.setValue(false, { emitEvent: false });
      } else {
        hasVariantCtrl?.enable({ emitEvent: false });
      }
    };
    [nameCtrl, priceCtrl, quantityCtrl].forEach(ctrl => {
      ctrl?.valueChanges.subscribe(updateHasVariantState);
    });
    // Also run once on init
    updateHasVariantState();

    // Check for edit mode
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.editMode = true;
        this.editingProductId = id;
        this.loadProductForEdit(id);
      }
    });
  }

  ngAfterViewInit(): void {
    // Initialize icons after view is initialized
    this.initializeLucideIcons();
  }

  ngAfterViewChecked(): void {
    // Re-initialize icons after view changes
    this.initializeLucideIcons();
  }

  // ===== Icon Initialization =====
  private initializeLucideIcons(): void {
    // Wait for DOM to be ready
    setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).lucide) {
        try {
          (window as any).lucide.createIcons();
          this.iconInitialized = true;
        } catch (error) {
          console.warn('Failed to initialize Lucide icons:', error);
        }
      }
    }, 100);
  }

  private forceIconReinitialization(): void {
    this.iconInitialized = false;
    this.initializeLucideIcons();
  }

  // ===== Form Initialization =====
  private initForm(): void {
    this.categoryBrandArray = this.fb.array([
      this.fb.group({
        categoryId: [null, Validators.required],
        brandId: [null], // brand is optional
        availableBrands: [this.brands]
      })
    ]);

    this.productForm = this.fb.group({
      productName: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [null, [Validators.required, Validators.min(0.01)]],
      quantity: [null, [Validators.required, Validators.min(1)]],
      status: [1, Validators.required],
      hasVariant: [false],
      attributes: this.fb.array([]),
      variants: this.fb.array([]),
      categoryBrandArray: this.categoryBrandArray,
      brands: this.fb.array([]),
      categories: this.fb.array([])
    });


    // Assign reference for convenience
    this.categoryBrandArray = this.productForm.get('categoryBrandArray') as FormArray;

    // Sync and setup
    this.submitted = false;

    // Watch hasVariant changes
    this.productForm.get('hasVariant')?.valueChanges.subscribe(hasVariant => {
      this.hasVariant = hasVariant;
      if (!hasVariant) {
        this.clearVariants();
      }
    });
  }

  // ===== Form Getters =====
  get attributes() {
    return this.productForm.get('attributes') as FormArray;
  }

  get variants() {
    return this.productForm.get('variants') as FormArray;
  }

  get variantFormGroups(): FormGroup[] {
    return (this.variants as FormArray).controls as FormGroup[];
  }

  get categoriesArray() {
    return this.productForm.get('categories') as FormArray;
  }
  get brandsArray() {
    return this.productForm.get('brands') as FormArray;
  }

  get categoryBrandArrayFormArray(): FormArray {
    return this.productForm.get('categoryBrandArray') as FormArray;
  }

  get canSubmitProduct(): boolean {
    // Allow submit if all required fields are present and valid
    if (!this.productForm.valid) return false;
    if (this.productForm.get('hasVariant')?.value) {
      // For variants, check that all required fields are present
      for (let i = 0; i < this.variants.length; i++) {
        const variant = this.variants.at(i) as FormGroup;
        if (!variant.get('sku')?.value || !variant.get('price')?.valid || !variant.get('stock')?.valid) {
          return false;
        }
      }
      // Optionally, check that total variant stock matches product quantity
      const productQuantity = Number(this.productForm.get('quantity')?.value ?? 0);
      const totalVariantStock = this.variants.controls.reduce((sum, variant) => {
        const stock = Number((variant as FormGroup).get('stock')?.value ?? 0);
        return sum + (isNaN(stock) ? 0 : stock);
      }, 0);
      return productQuantity > 0 && totalVariantStock === productQuantity;
    }
    return true;
  }

  // ===== Validation for Variant Checkbox =====
  get canEnableVariants(): boolean {
    const nameCtrl = this.productForm.get('productName');
    const priceCtrl = this.productForm.get('price');
    const quantityCtrl = this.productForm.get('quantity');
    // Strictly check for null, empty string, or invalid
    const nameValid = !!nameCtrl && nameCtrl.value && nameCtrl.valid;
    const priceValid = !!priceCtrl && priceCtrl.value != null && priceCtrl.valid;
    const quantityValid = !!quantityCtrl && quantityCtrl.value != null && quantityCtrl.valid;
    const result = nameValid && priceValid && quantityValid;
    if (!result) {
      console.log('canEnableVariants is false:', {
        nameValid, priceValid, quantityValid,
        nameValue: nameCtrl?.value, priceValue: priceCtrl?.value, quantityValue: quantityCtrl?.value
      });
    }
    return result;
  }

  // ===== Data Loading Methods =====
  private loadCategories(): void {
    this.cateService.getAllCategory().subscribe({
      next: (data) => this.categories = data,
      error: (err) => console.error('Category error:', err)
    });
  }

  // After loading brands, update availableBrands for each group
  private loadBrands(): void {
    this.brandService.getAllBrand().subscribe({
      next: (data: Brand[]) => {
        this.brands = data;
        // Update availableBrands for all existing pairs
        if (this.categoryBrandArray && this.categoryBrandArray.length > 0) {
          this.categoryBrandArray.controls.forEach(group => {
            group.patchValue({ availableBrands: this.brands });
          });
        }
      },
      error: (err: any) => console.error('Brand error:', err)
    });
  }

  private loadAttributes(): void {
    this.attributeService.getAllAttribute().subscribe({
      next: (attributes) => {
        this.availableAttributes = attributes.map(attr => ({
          id: attr.id,
          name: attr.name,
          values: []
        }));

        attributes.forEach(attr => {
          this.attributeService.getValueById(attr.id).subscribe({
            next: (result: any) => {
              // result is an array of DTOs, so get the first one and its values
              const values = Array.isArray(result) && result.length > 0 && result[0].values ? result[0].values : [];
              const attribute = this.availableAttributes.find(a => a.id === attr.id);
              if (attribute) {
                console.log('Raw values from backend for attribute', attr.id, ':', values);
                if (Array.isArray(values) && values.length > 0 && typeof values[0] === 'object' && 'value' in values[0]) {
                  attribute.values = values.map((v: any) => ({
                    id: v.id,
                    value: v.value,
                    isNew: false
                  }));
                } else {
                  attribute.values = values.map((v: any, i: number) => ({
                    id: i,
                    value: v ? String(v) : '',
                    isNew: false
                  }));
                }
                console.log('Mapped attribute values:', attribute.values);
              }
            }
          });
        });
      }
    });
  }

  // Patch variants (update by id if exists, ensure all fields are present)
  loadProductForEdit(id: string): void {
    this.proService.getProductDetailById(id).subscribe(product => {
      this.productForm.patchValue({
        productName: product.productName,
        productCode: product.productCode,
        price: product.price,
        quantity: product.quantity,
        description: product.description,
        status: product.status,
        hasVariant: !!product.hasVariant
      });
      // Patch categories & brands
      if (product.categoryBrandArray && product.categoryBrandArray.length > 0) {
        this.categoryBrandArray.clear();
        product.categoryBrandArray.forEach((pair: any) => {
          let availableBrands = this.brands;
          this.categoryBrandArray.push(this.fb.group({
            categoryId: [pair.categoryId, Validators.required],
            brandId: [pair.brandId],
            availableBrands: [availableBrands]
          }));
        });
      }
      // Patch product images
      this.selectedImages = [];
      this.selectedImagesPreview = [];
      this.existingImages = (product.productImages || []).filter((img: any) => !img.variantId).map((img: any) => ({
        id: img.id,
        imageUrl: img.imageUrl.startsWith('http') ? img.imageUrl : `http://localhost:8080${img.imageUrl}`
      }));
      this.imagesMarkedForDeletion = [];
      // Patch variants and their images
      if (product.variants && Array.isArray(product.variants)) {
        const variantsFormArray = this.productForm.get('variants') as FormArray;
        variantsFormArray.clear();
        this.existingVariantImages = {};
        this.variantImagesMarkedForDeletion = {};
        this.newVariantImages = {};
        this.newVariantImagesPreview = {};
        product.variants.forEach((variant: any, idx: number) => {
          variantsFormArray.push(this.fb.group({
            id: [variant.id],
            sku: [variant.sku, Validators.required],
            price: [variant.price, [Validators.required, Validators.min(0.01)]],
            stock: [variant.stock, [Validators.required, Validators.min(1)]],
            attributes: this.fb.array(variant.attributes || []),
            images: [[]]
          }));
          // Existing images for this variant
          this.existingVariantImages[idx] = (product.productImages || []).filter((img: any) => img.variantId === variant.id).map((img: any) => ({
            id: img.id,
            imageUrl: img.imageUrl.startsWith('http') ? img.imageUrl : `http://localhost:8080${img.imageUrl}`
          }));
          this.variantImagesMarkedForDeletion[idx] = [];
          this.newVariantImages[idx] = [];
          this.newVariantImagesPreview[idx] = [];
        });
      }
      // Patch attributes
      if (product.attributes && Array.isArray(product.attributes)) {
        this.productAttributes = product.attributes.map((attr: any) => ({
          attributeId: attr.attributeId,
          attributeName: attr.attributeName,
          allowedValues: (attr.values || []).map((val: any) => ({
            id: val.id,
            value: val.value,
            selected: val.selected,
            isNew: false
          }))
        }));
      }
    });
  }

  // ===== Image Handling Methods =====
  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
      input.value = '';
    }
  }

  handleFiles(files: File[]): void {
    this.uploadError = '';

    for (let file of files) {
      if (!this.validateFile(file)) continue;

      this.selectedImages.push(file);
      this.createImagePreview(file);
    }
    // Re-initialize icons after adding images
    setTimeout(() => this.initializeLucideIcons(), 100);
  }

  private validateFile(file: File): boolean {
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      this.uploadError = 'Invalid file type. Please upload only JPG, PNG, GIF, or WebP images.';
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      this.uploadError = 'File size exceeds 5MB limit.';
      return false;
    }

    return true;
  }

  private createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.selectedImagesPreview.push(reader.result as string);
      // Re-initialize icons after creating image preview
      setTimeout(() => this.initializeLucideIcons(), 100);
    };
    reader.readAsDataURL(file);
  }

  // Product image remove
  removeImage(index: number, isExisting: boolean = false): void {
    if (isExisting) {
      this.removeExistingImage(index);
    } else {
      this.removeNewImage(index);
    }
    setTimeout(() => this.initializeLucideIcons(), 100);
  }

  removeExistingImage(index: number): void {
    const img = this.existingImages[index];
    if (img && img.id) {
      this.imagesMarkedForDeletion.push(img.id);
    }
    this.existingImages.splice(index, 1);
  }

  removeNewImage(index: number): void {
    this.selectedImages.splice(index, 1);
    this.selectedImagesPreview.splice(index, 1);
  }

  // ===== Drag and Drop Methods =====
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  // ===== Attribute Management Methods =====
  addProductAttribute(): void {
    if (!this.selectedAttributeId) return;

    const attr = this.availableAttributes.find(a => a.id === this.selectedAttributeId);
    console.log('Adding attribute to productAttributes:', attr);
    console.log('Allowed values:', attr?.values);
    if (attr && !this.productAttributes.some(pa => pa.attributeId === attr.id)) {
      const allowedValues = (attr.values || []).map(v => ({ ...v, selected: false, isNew: !!v.isNew }));
      console.log('Allowed values to push:', allowedValues);
      this.productAttributes.push({
        attributeId: attr.id,
        attributeName: attr.name,
        allowedValues
      });
      // this.regenerateVariants(); // Commented out so the card stays visible
      console.log('productAttributes after push:', this.productAttributes);
      // Re-initialize icons after adding attribute
      setTimeout(() => this.initializeLucideIcons(), 100);
    }
    this.selectedAttributeId = null;
  }

  removeProductAttribute(attrIndex: number): void {
    console.log('[DEBUG] removeProductAttribute called with index:', attrIndex);
    console.log('[DEBUG] productAttributes before:', this.productAttributes.map(a => a.attributeName));
    this.productAttributes = [
      ...this.productAttributes.slice(0, attrIndex),
      ...this.productAttributes.slice(attrIndex + 1)
    ];
    console.log('[DEBUG] productAttributes after:', this.productAttributes.map(a => a.attributeName));
    this.regenerateVariants();
  }

  // ===== Attribute Modal Methods =====
  openNewAttributeModal(): void {
    this.showNewAttributeModal = true;
    this.newAttributeName = '';
    this.newAttributeValues = [];
    this.newAttributeValueInput = '';
    // Re-initialize icons after modal opens
    setTimeout(() => this.initializeLucideIcons(), 50);
  }

  closeNewAttributeModal(): void {
    this.showNewAttributeModal = false;
  }

  addNewAttributeValue(): void {
    if (this.newAttributeValueInput.trim()) {
      this.newAttributeValues.push(this.newAttributeValueInput.trim());
      this.newAttributeValueInput = '';
    }
  }

  saveNewAttribute(): void {
    if (!this.newAttributeName.trim() || this.newAttributeValues.length === 0) return;

    // ✨ Prepare DTO with proper structure
    const values = this.newAttributeValues.map((v) => ({
      value: typeof v === 'string' ? v : (v as any).value  // <-- Ensure string
    }));

    const dto = {
      attributeId: undefined,  // ✅ send null explicitly for new attribute
      attributeName: this.newAttributeName.trim(),
      values: values
    };

    this.attributeService.create(dto as AttributeAndValueDTO).subscribe({
      next: () => {
        const newAttrId = Math.max(0, ...this.availableAttributes.map(a => a.id)) + 1;

        const attrValues = this.newAttributeValues.map((v, i) => ({
          id: newAttrId * 100 + i,
          value: typeof v === 'string' ? v : (v as any).value,  // Ensure value is string
          isNew: true
        }));

        const newAttr = {
          id: newAttrId,
          name: this.newAttributeName.trim(),
          values: attrValues
        };

        this.availableAttributes.push(newAttr);
        this.productAttributes.push({
          attributeId: newAttr.id,
          attributeName: newAttr.name,
          allowedValues: [...attrValues]
        });

        this.closeNewAttributeModal();
        this.regenerateVariants();
        // Re-initialize icons after adding new attribute
        setTimeout(() => this.initializeLucideIcons(), 100);
      },
      error: (err) => {
        console.error('Failed to create attribute:', err);
        alert(err.error || 'Unknown error');
      }
    });
  }



  // ===== Variant Management Methods =====
  private regenerateVariants(): void {
    if (!this.hasVariant || this.productAttributes.length === 0) {
      this.clearVariants();
      return;
    }

    // Get only selected values for each attribute
    const selectedAttributes = this.productAttributes.map(attr => ({
      attributeId: attr.attributeId,
      attributeName: attr.attributeName,
      values: attr.allowedValues.filter(v => v.selected)
    }));

    // Filter out attributes with no selected values
    const validAttributes = selectedAttributes.filter(attr => attr.values.length > 0);

    if (validAttributes.length === 0) {
      this.clearVariants();
      return;
    }

    // Generate all possible combinations
    const valueCombinations = validAttributes.map(attr =>
      attr.values.map(value => ({
        attributeId: attr.attributeId,
        attributeName: attr.attributeName,
        valueId: value.id,
        value: value.value
      }))
    );

    const combinations = this.generateCombinations(valueCombinations);
    this.createVariants(combinations);
    // Re-initialize icons after regenerating variants
    setTimeout(() => this.initializeLucideIcons(), 100);
  }

  private generateCombinations(arr: any[][]): any[][] {
    return arr.reduce((a, b) => a.flatMap(d => b.map(e => [...d, e])), [[]]);
  }

  private getCode(str: string | null | undefined, len: number, pad: string = 'X'): string {
    if (!str) return pad.repeat(len);
    return (str.replace(/\s+/g, '').toUpperCase() + pad.repeat(len)).substring(0, len);
  }

  private getCategoryCode(categories: string[]): string {
    if (!categories || categories.length === 0) return 'XX';
    if (categories.length > 2) return 'MC';
    return categories.map(c => this.getCode(c, 1, 'X')).join('').padEnd(2, 'X');
  }

  private getBrandCode(brands: string[]): string {
    if (!brands || brands.length === 0) return 'XX';
    if (brands.length > 2) return 'MB';
    return brands.map(b => this.getCode(b, 1, 'X')).join('').padEnd(2, 'X');
  }

  private shortHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const code = Math.abs(hash).toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '');
    return (code + 'ZZ').substring(0, 2);
  }

  private getAttrValCodeAll(attrs: { attributeName: string, value: string }[]): string {
    if (!attrs || attrs.length === 0) return 'ZZZZ';
    if (attrs.length === 1) {
      return this.getCode(attrs[0].attributeName, 2, 'Z') + this.getCode(attrs[0].value, 2, 'Z');
    }
    if (attrs.length === 2) {
      return (
        this.getCode(attrs[0].attributeName, 1, 'Z') +
        this.getCode(attrs[0].value, 1, 'Z') +
        this.getCode(attrs[1].attributeName, 1, 'Z') +
        this.getCode(attrs[1].value, 1, 'Z')
      );
    }
    const concat = attrs.map(a => (a.attributeName || '') + (a.value || '')).join('');
    return this.getCode(attrs[0].attributeName, 2, 'Z') + this.shortHash(concat);
  }

  private generateSKU12(
    productName: string | null,
    categories: string[],
    brands: string[],
    attrs: { attributeName: string, value: string }[],
    variantIndex: number
  ): string {
    // Product name code (first 2 letters uppercase)
    const pc = productName ? productName.substring(0, 2).toUpperCase() : 'XX';

    // Category code (first letter of each category, max 2)
    const cc = categories.length > 0
      ? categories
        .map(c => c.charAt(0)) // Get first character of each category
        .join('')              // Join characters into a single string
        .substring(0, 2)       // Take first 2 characters
        .toUpperCase()         // Convert to uppercase
      : 'XX';

    // Brand code (first 2 letters uppercase)
    const bc = brands.length > 0
      ? brands[0].substring(0, 2).toUpperCase()
      : 'XX';

    // Attribute-value codes (more comprehensive handling)
    let av = '';
    if (attrs.length > 0) {
      // Take first 2 letters of first attribute's value
      if (attrs.length >= 1) {
        av += attrs[0].value.substring(0, 2).toUpperCase();
      }
      // Take first letter of second attribute's value if exists
      if (attrs.length >= 2) {
        av += attrs[1].value.charAt(0).toUpperCase();
      }
      // Pad with 'V' if needed
      av = av.padEnd(3, 'V');
    } else {
      av = 'NOV'; // No variant
    }

    // Variant index (3 digits)
    const vi = (variantIndex + 1).toString().padStart(3, '0');

    // Combine all parts (total 12 characters)
    return `${pc}${cc}${bc}${av}${vi}`.substring(0, 12);
  }

  private createVariants(combinations: any[][]): void {
    // Preserve existing variant data by SKU
    const oldVariantsMap = new Map<string, any>();
    this.variants.controls.forEach((variant: any, idx: number) => {
      const sku = variant.get('sku')?.value;
      if (sku) {
        oldVariantsMap.set(sku, {
          stock: variant.get('stock')?.value,
          price: variant.get('price')?.value,
          images: variant.get('images')?.value,
          // Preserve new variant images and previews
          newVariantImages: this.newVariantImages[idx] || [],
          newVariantImagesPreview: this.newVariantImagesPreview[idx] || []
        });
      }
    });

    while (this.variants.length) {
      this.variants.removeAt(0);
    }

    const formData = this.productForm.value;
    const productName = typeof formData.productName === 'string' ? formData.productName : null;
    const categories = this.getCategoryNames();
    const brands = this.getBrandNames();
    const basePrice = Number(this.productForm.get('price')?.value ?? 0);
    // Only generate variants if every attribute has at least one selected value
    if (!combinations.length || combinations.some(attrs => !attrs.length)) {
      return;
    }

    combinations.forEach((attributes, idx) => {
      // Defensive: always ensure attributes is an array of objects with attributeName and value
      const attrPairs = (attributes || []).map(a => ({
        attributeName: a.attributeName || '',
        value: a.value || ''
      }));

      const sku = this.generateSKU12(
        productName,
        categories,
        brands,
        attrPairs,
        idx
      );

      // Try to restore old data by SKU
      const oldData = oldVariantsMap.get(sku);

      const variant = this.fb.group({
        attributes: this.fb.array(attributes),
        sku: [sku, Validators.required],
        price: [oldData?.price ?? basePrice, [Validators.required, Validators.min(0.01)]],
        stock: [oldData?.stock ?? null, [Validators.required, Validators.min(1)]],
        images: [oldData?.images ?? []]
      });
      this.variants.push(variant);

      // Restore newVariantImages and newVariantImagesPreview for this index
      if (oldData) {
        this.newVariantImages[idx] = oldData.newVariantImages || [];
        this.newVariantImagesPreview[idx] = oldData.newVariantImagesPreview || [];
      } else {
        this.newVariantImages[idx] = [];
        this.newVariantImagesPreview[idx] = [];
      }
    });

    // Subscribe to stock changes for all variants
    this.variants.controls.forEach((variant) => {
      (variant as FormGroup).get('stock')?.valueChanges.subscribe(() => {
        this.checkTotalVariantStock(variant as FormGroup);
      });
    });
    // Initial check (no adjustment needed)
    this.checkTotalVariantStock();
  }

  private getCategoryNames(): string[] {
    return this.categoriesArray.value
      .map((catId: any) => {
        const cat = this.categories.find((c) => c.id === catId);
        return cat?.name ? String(cat.name) : '';
      })
      .filter((name: string) => name !== '');
  }

  private getBrandNames(): string[] {
    return this.brandsArray.value
      .map((brandId: any) => {
        const brand = this.brands.find((b) => b.id === brandId);
        return brand?.name ? String(brand.name) : '';
      })
      .filter((name: string) => name !== '');
  }

  private clearVariants(): void {
    while (this.variants.length) {
      this.variants.removeAt(0);
    }
    this.productAttributes = [];
    // Re-initialize icons after clearing variants
    setTimeout(() => this.initializeLucideIcons(), 100);
  }

  // ===== Variant Image Methods =====
  onVariantImageSelect(index: number): void {
    const input = document.getElementById('variantImageInput' + index) as HTMLInputElement;
    if (input) input.click();
  }

  // Variant image add
  onVariantImageChange(event: any, variantIndex: number): void {
    const files: FileList = event.target.files;
    if (!this.newVariantImages[variantIndex]) this.newVariantImages[variantIndex] = [];
    if (!this.newVariantImagesPreview[variantIndex]) this.newVariantImagesPreview[variantIndex] = [];
    for (const file of Array.from(files)) {
      this.newVariantImages[variantIndex].push(file);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newVariantImagesPreview[variantIndex].push(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  // Variant image remove
  removeVariantImage(variantIndex: number, imageIndex: number, isExisting: boolean = false): void {
    if (isExisting) {
      const img = this.existingVariantImages[variantIndex][imageIndex];
      if (!this.variantImagesMarkedForDeletion[variantIndex]) this.variantImagesMarkedForDeletion[variantIndex] = [];
      this.variantImagesMarkedForDeletion[variantIndex].push(img.id);
      this.existingVariantImages[variantIndex].splice(imageIndex, 1);
    } else {
      this.newVariantImages[variantIndex].splice(imageIndex, 1);
      this.newVariantImagesPreview[variantIndex].splice(imageIndex, 1);
    }
    setTimeout(() => this.initializeLucideIcons(), 100);
  }

  removeVariantCard(variantIndex: number): void {
    console.log('[DEBUG] removeVariantCard called with index:', variantIndex);
    const before = this.variants.controls.length;
    // Get the attributes of the variant being removed
    const variantGroup = this.variants.at(variantIndex) as FormGroup;
    const variantAttrs = variantGroup.get('attributes')?.value || [];
    // Unselect the corresponding attribute values
    variantAttrs.forEach((attr: any) => {
      const prodAttr = this.productAttributes.find(a => a.attributeId === attr.attributeId);
      if (prodAttr) {
        const valueObj = prodAttr.allowedValues.find(v => v.id === attr.valueId);
        if (valueObj) {
          valueObj.selected = false;
        }
      }
    });
    // Remove the variant
    this.variants.removeAt(variantIndex);
    const after = this.variants.controls.length;
    console.log(`[DEBUG] Variants before: ${before}, after: ${after}`);
    // Regenerate variants to reflect the change
    this.regenerateVariants();
    // Force change detection
    this.cdr.detectChanges();
    // Optionally, re-initialize icons
    setTimeout(() => this.initializeLucideIcons(), 100);
  }

  // ===== Helper Methods =====
  isAttributeDisabled(attrId: number): boolean {
    return this.productAttributes.some(pa => pa.attributeId === attrId);
  }

  getAttributeValues(attributeId: number): AttributeValue[] {
    const attr = this.availableAttributes.find(a => a.id === attributeId);
    return attr ? attr.values : [];
  }

  getOriginalValues(attr: ProductAttribute): AttributeValue[] {
    const originals = attr.allowedValues.filter(v => !v.isNew);
    console.log('getOriginalValues for', attr.attributeName, ':', originals);
    return originals;
  }

  getNewValues(attr: ProductAttribute): AttributeValue[] {
    return attr.allowedValues.filter(v => v.isNew);
  }

  addNewAttributeValueToAttribute(attrIndex: number, value: string, isNew: boolean = false): void {
    if (!value.trim()) return;
    const attr = this.productAttributes[attrIndex];

    this.attributeService.addValue(attr.attributeId, value.trim()).subscribe({
      next: () => {
        // Reload attribute values from backend to get the correct IDs and state
        this.attributeService.getValueById(attr.attributeId).subscribe({
          next: (result: any) => {
            const values = Array.isArray(result) && result.length > 0 && result[0].values ? result[0].values : [];
            attr.allowedValues = values.map((v: any) => ({
              id: v.id,
              value: v.value,
              selected: false,
              isNew: false
            }));
            // Now, select the new value (case-insensitive match)
            const newVal = attr.allowedValues.find(v => v.value.toLowerCase() === value.trim().toLowerCase());
            if (newVal) {
              newVal.selected = true;
            }
            console.log('Allowed values after add:', attr.allowedValues);
            this.regenerateVariants();
            // Re-initialize icons after adding attribute value
            setTimeout(() => this.initializeLucideIcons(), 100);
          }
        });
      },
      error: (err) => {
        console.error('Failed to save value:', err);
        alert(err.error || 'Error saving value');
      }
    });
  }


  toggleAttributeValue(attrIndex: number, valueIndex: number): void {
    const attr = this.productAttributes[attrIndex];

    // Toggle the clicked value
    const clickedValue = attr.allowedValues[valueIndex];
    clickedValue.selected = !clickedValue.selected;

    console.log('Updated attribute values:', {
      attribute: attr.attributeName,
      values: attr.allowedValues.map(v => ({
        value: v.value,
        selected: v.selected
      }))
    });

    this.regenerateVariants();
    // Re-initialize icons after toggling attribute value
    setTimeout(() => this.initializeLucideIcons(), 100);
  }

  updateSKU(): void {
    const formData = this.productForm.value;

    // Get basic info
    const productName = typeof formData.productName === 'string' ? formData.productName : null;

    const foundCategory = this.categories.find(c => c.id === formData.category);
    const categoryName = foundCategory?.name || null;

    const foundBrand = this.brands.find(b => b.id === formData.brand);
    const brandName = foundBrand?.name || null;

    // Get selected attribute values
    const attrValues: string[] = [];
    if (this.productAttributes && this.productAttributes.length > 0) {
      this.productAttributes.forEach(attr => {
        const selectedValue = attr.allowedValues.find(v => v.selected);
        if (selectedValue) {
          attrValues.push(selectedValue.value);
        }
      });
    }

    console.log('Selected attribute values:', attrValues);
    this.sku = this.generateSKU12(
      productName,
      [categoryName !== null ? String(categoryName) : ''],
      [brandName !== null ? String(brandName) : ''],
      [
        { attributeName: 'attr1', value: attrValues[0] || '' },
        { attributeName: 'attr2', value: attrValues[1] || '' }
      ],
      0 // variantIndex
    );
    // Generate SKU
    ;

    console.log('Generated SKU:', this.sku);
  }

  // ===== Form Submission Methods =====
  onSubmit(): void {
    this.submitted = true;

    if (this.productForm.valid) {
      const formData = this.productForm.value;
      const fd = new FormData();
      // Map category-brand pairs from the FormArray
      const categoryBrandPairs = this.categoryBrandArray.controls.map((group: any) => ({
        categoryId: group.get('categoryId')?.value,
        brandId: group.get('brandId')?.value || null
      }));
      formData.categoryBrandPairs = categoryBrandPairs;
      formData.categoryBrandPairsMarkedForDeletion = this.removedCategoryBrandPairs;
      formData.imagesMarkedForDeletion = this.imagesMarkedForDeletion;
      formData.variantImagesMarkedForDeletion = this.variantImagesMarkedForDeletion;
      const productBlob = new Blob([JSON.stringify(formData)], { type: 'application/json' });
      fd.append('product', productBlob);
      // Product images
      for (const file of this.selectedImages) {
        fd.append('images', file);
      }
      // Variant images
      if (formData.variants && formData.variants.length > 0) {
        formData.variants.forEach((variant: any, variantIndex: number) => {
          // New images
          if (this.newVariantImages[variantIndex] && this.newVariantImages[variantIndex].length > 0) {
            this.newVariantImages[variantIndex].forEach((file: File) => {
              fd.append(`variantImages_${variantIndex}`, file);
            });
          }
        });
      }
      if (this.editMode && this.editingProductId) {
        // Call update product
        this.proService.updateProduct(this.editingProductId, fd).subscribe({
          next: (data) => {
            // Show Swal success box
            Swal.fire({
              icon: 'success',
              title: 'Product updated successfully!',
              showConfirmButton: true,
              confirmButtonText: 'OK'
            }).then(() => {
              this.router.navigate(['/productlist']);
            });
          },
          error: (err) => {
            console.error('Error updating product:', err);
          }
        });
      } else {
        // Create new product
      this.proService.createProduct(fd).subscribe({
        next: (data) => {
          Swal.fire({
            icon: 'success',
            title: 'Product created successfully!',
            showConfirmButton: true,
            confirmButtonText: 'OK'
          }).then(() => {
            this.router.navigate(['/productlist']);
          });
        },
        error: (err) => {
          console.error('Error creating product:', err);
        }
      });
      }
    } else {
      this.markFormGroupTouched(this.productForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  openNewCategoryModal(): void {
    this.modalService.openCreateCategoryModal().then((result) => {
      if (result === 'success') {
        this.loadCategories();
      }
    }).catch(() => {
      // Modal dismissed — do nothing
    });
  }

  openNewBrandModal(): void {
    this.modalService.openCreateBrandModal().then((result) => {
      if (result === 'success') {
        this.loadBrands();
        if (this.categoryBrandArray && this.categoryBrandArray.length > 0) {
          this.categoryBrandArray.controls.forEach(group => {
            group.patchValue({ availableBrands: this.brands });
          });
        }
      }
    }).catch(() => {
      // Modal dismissed — do nothing
    });
  }

  addCategorySelect(): void {
    this.categoriesArray.push(this.fb.control(null, Validators.required));
  }
  removeCategorySelect(index: number): void {
    if (this.categoriesArray.length > 1) {
      this.categoriesArray.removeAt(index);
    }

  }
  addBrandSelect(): void {
    this.brandsArray.push(this.fb.control(null, Validators.required));
  }
  removeBrandSelect(index: number): void {
    if (this.brandsArray.length > 1) {
      this.brandsArray.removeAt(index);
    }
  }

  onCategorySelectChange(event: any, index: number): void {
    if (event.target.value === 'create-new') {
      this.openNewCategoryModal();
      // Reset the select to null after opening modal
      this.categoriesArray.at(index).setValue(null);
    }
  }
  onBrandSelectChange(event: any, index: number): void {
    if (event.target.value === 'create-new') {
      this.openNewBrandModal();
      // Reset the select to null after opening modal
      this.brandsArray.at(index).setValue(null);
    }
  }
  openNewCategoryOrBrandModal(): void {
    // You can implement a combined modal, or for now just open category modal as an example
    this.openNewCategoryModal();
  }

  // ===== New Form Array Methods =====
  addCategoryBrandPair() {
    const group = this.fb.group({
      categoryId: [null, Validators.required],
      brandId: [null],
      availableBrands: [this.brands]
    });
    this.categoryBrandArray.push(group);
    // Re-initialize icons after adding category-brand pair
    setTimeout(() => this.initializeLucideIcons(), 100);
  }

  removeCategoryBrandPair(index: number) {
    if (this.categoryBrandArray.length > 1) {
      const group = this.categoryBrandArray.at(index);
      const removedPair = {
        categoryId: group.get('categoryId')?.value,
        brandId: group.get('brandId')?.value
      };
      this.removedCategoryBrandPairs.push(removedPair);
      this.categoryBrandArray.removeAt(index);
    }
  }

  onCategoryChange(index: number) {
    const group = this.categoryBrandArray.at(index);
    const categoryId = group.get('categoryId')?.value;
    if (categoryId === 'add_new_category') {
      this.openNewCategoryModal();
      group.patchValue({ categoryId: null });
      return;
    }
    if (!categoryId) {
      // If no category selected, show all brands
      group.patchValue({ availableBrands: this.brands, brandId: null });
      return;
    }
    this.brandService.getBrandByCateId(categoryId).subscribe((brands: Brand[]) => {
      group.patchValue({ availableBrands: brands, brandId: null });
    });
  }

  onBrandChange(index: number) {
    const group = this.categoryBrandArray.at(index);
    const brandId = group.get('brandId')?.value;
    if (brandId === 'add_new_brand') {
      this.openNewBrandModal();
      group.patchValue({ brandId: null });
      return;
    }
  }

  resetAllVariantPrices(): void {
    const basePrice = this.productForm.get('price')?.value;
    this.variants.controls.forEach((variant) => {
      (variant as FormGroup).get('price')?.setValue(basePrice);
    });
  }

  private checkTotalVariantStock(lastEditedVariant?: FormGroup): void {
    const productQuantity = Number(this.productForm.get('quantity')?.value ?? 0);
    const stocks = this.variants.controls.map(variant => Number((variant as FormGroup).get('stock')?.value ?? 0));
    const totalVariantStock = stocks.reduce((sum, stock) => sum + (isNaN(stock) ? 0 : stock), 0);
    if (totalVariantStock > productQuantity && lastEditedVariant) {
      const message = 'Stock exceeds product quantity';
      Swal.fire({
        toast: true,
        position: 'top',
        title: message,
        icon: undefined,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: 'rgba(30, 41, 59, 0.85)', // Semi-transparent slate
        color: '#f8fafc',
        customClass: {
          popup: 'rounded-xl shadow-2xl px-4 py-2 mx-auto backdrop-blur-sm', // Use Tailwind or your own CSS for blur
          title: 'font-medium text-sm leading-snug text-center',
          timerProgressBar: 'bg-cyan-400/30'
        },
        showClass: { popup: 'animate-fade-in-down' },
        hideClass: { popup: 'animate-fade-out-up' },
        didOpen: (toast) => {
          toast.style.maxWidth = 'min(90vw, 420px)';
          toast.style.margin = '12px auto';
          toast.style.whiteSpace = 'normal';
          toast.style.wordBreak = 'break-word';
          toast.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.18)';
        }
      }).then(() => {
        // Calculate how much to reduce
        const excess = totalVariantStock - productQuantity;
        const currentStock = Number(lastEditedVariant.get('stock')?.value ?? 0);
        const newStock = Math.max(0, currentStock - excess);
        lastEditedVariant.get('stock')?.setValue(newStock);
      });
    }
  }

  // TrackBy functions for image ngFor
  trackByExistingImage(index: number, item: any): any {
    return item.id || index;
  }
  trackByNewImage(index: number, item: any): any {
    return index;
  }
}