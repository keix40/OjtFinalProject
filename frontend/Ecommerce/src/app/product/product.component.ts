import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../product.service';
import { Category } from '../category';
import { Brand } from '../brand';
import { CategoryService } from '../category.service';
import { BrandService } from '../brand.service';
import { AttributeService } from '../attribute.service';
import { ModalService } from '../modal.service';


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
export class ProductComponent implements OnInit {
  // ===== Form Properties =====
  productForm!: FormGroup;
  submitted = false;
  hasVariant = false;
  sku: string = 'XXXXXXXXXXX';

  // ===== Data Properties =====
  categories: Category[] = [];
  brands: Brand[] = [];
  productAttributes: ProductAttribute[] = [];
  selectedAttributeId: number | null = null;

  // ===== Image Properties =====
  selectedImages: File[] = [];
  selectedImagesPreview: string[] = [];
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

  // ===== Constructor =====
  constructor(
    private fb: FormBuilder,
    private proService: ProductService,
    private cateService: CategoryService,
    private brandService: BrandService,
    private attributeService: AttributeService,
    private router: Router,
    private modalService: ModalService,
  ) {
    this.initForm();
  }

  // ===== Lifecycle Hooks =====
  ngOnInit(): void {
    this.submitted = false;
    this.loadCategories();
    this.loadBrands();
    this.loadAttributes();

    // Update SKU live as the form changes
    this.productForm.valueChanges.subscribe(() => {
      this.updateSKU();
    });
  }

  // ===== Form Initialization =====
  private initForm(): void {
    this.productForm = this.fb.group({
      productName: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      status: [1, Validators.required],
      brands: this.fb.array([this.fb.control(null, Validators.required)]),
      categories: this.fb.array([this.fb.control(null, Validators.required)]),
      hasVariant: [false],
      attributes: this.fb.array([]),
      variants: this.fb.array([])
    });
    this.submitted = false;
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

  // ===== Data Loading Methods =====
  private loadCategories(): void {
    this.cateService.getAllCategory().subscribe({
      next: (data) => this.categories = data,
      error: (err) => console.error('Category error:', err)
    });
  }

  private loadBrands(): void {
    this.brandService.getAllBrand().subscribe({
      next: (data: Brand[]) => this.brands = data,
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
                if (Array.isArray(values) && values.length > 0 && typeof values[0] === 'object' && 'id' in values[0] && 'value' in values[0]) {
                  attribute.values = values.map((v: any) => ({ ...v, isNew: false }));
                } else {
                  attribute.values = values.map((v: any) => ({ id: -1, value: v ? String(v) : '', isNew: false }));
                }
                console.log('Mapped attribute values:', attribute.values);
              }
            }
          });
        });
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
    };
    reader.readAsDataURL(file);
  }

  removeImage(index: number): void {
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
    }
    this.selectedAttributeId = null;
  }

  removeProductAttribute(attrIndex: number): void {
    this.productAttributes.splice(attrIndex, 1);
    this.regenerateVariants();
  }

  // ===== Attribute Modal Methods =====
  openNewAttributeModal(): void {
    this.showNewAttributeModal = true;
    this.newAttributeName = '';
    this.newAttributeValues = [];
    this.newAttributeValueInput = '';
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

    const newAttrId = Math.max(0, ...this.availableAttributes.map(a => a.id)) + 1;
    const values: AttributeValue[] = this.newAttributeValues.map((v, i) => ({
      id: newAttrId * 100 + i,
      value: v,
      isNew: true
    }));

    const newAttr: Attribute = {
      id: newAttrId,
      name: this.newAttributeName.trim(),
      values
    };

    this.availableAttributes.push(newAttr);
    this.productAttributes.push({
      attributeId: newAttr.id,
      attributeName: newAttr.name,
      allowedValues: [...values]
    });

    this.closeNewAttributeModal();
    this.regenerateVariants();
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
    while (this.variants.length) {
      this.variants.removeAt(0);
    }

    const formData = this.productForm.value;

    // Get product name
    const productName = typeof formData.productName === 'string'
      ? formData.productName
      : null;

    // Get categories
    const categories = this.getCategoryNames();

    // Get brands
    const brands = this.getBrandNames();

    // Create each variant with unique SKU
    combinations.forEach((attributes, idx) => {
      // Create attribute pairs with proper names and values
      const attrPairs = attributes.map(a => ({
        attributeName: a.attributeName || '',
        value: a.value || ''
      }));

      // Generate unique SKU
      const sku = this.generateSKU12(
        productName,
        categories,
        brands,
        attrPairs,
        idx
      );

      // Create variant form group
      const variant = this.fb.group({
        attributes: this.fb.array(attributes),
        sku: [sku, Validators.required],
        price: [formData.price || 0, [Validators.required, Validators.min(0.01)]],
        stock: [formData.quantity || 0, [Validators.required, Validators.min(0)]],
        images: [[]]
      });

      this.variants.push(variant);
    });
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
  }

  // ===== Variant Image Methods =====
  onVariantImageSelect(index: number): void {
    const input = document.getElementById('variantImageInput' + index) as HTMLInputElement;
    if (input) input.click();
  }

  onVariantImageChange(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    const variant = this.variants.at(index);
    const currentImages = variant.get('images')?.value || [];

    for (let file of files) {
      if (!this.validateFile(file)) continue;

      this.createVariantImagePreview(file, currentImages, variant);
    }
    input.value = '';
  }

  private createVariantImagePreview(file: File, currentImages: any[], variant: any): void {
    const reader = new FileReader();
    reader.onload = () => {
      currentImages.push({
        file: file,
        preview: reader.result as string
      });
      variant.get('images')?.setValue(currentImages);
    };
    reader.readAsDataURL(file);
  }

  removeVariantImage(variantIndex: number, imageIndex: number): void {
    const variant = this.variants.at(variantIndex);
    const currentImages = variant.get('images')?.value || [];
    currentImages.splice(imageIndex, 1);
    variant.get('images')?.setValue(currentImages);
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
    const newId = Math.max(0, ...attr.allowedValues.map(v => v.id)) + 1;
    attr.allowedValues.push({ id: newId, value: value.trim(), selected: true, isNew });
    this.regenerateVariants();
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
      console.log('Form Data to be submitted:', formData);
      let payload: any = formData;
      // If you are using FormData for file upload, log the FormData as well
      if (this.selectedImages && this.selectedImages.length > 0) {
        const fd = new FormData();
        formData.categoryBrandPairs = [];
        const categoryIds = this.productForm.value.categories;
        const brandIds = this.productForm.value.brands;

        for (let i = 0; i < categoryIds.length; i++) {
          formData.categoryBrandPairs.push({
            categoryId: categoryIds[i],
            brandId: brandIds[i] || null
          });
        }
        console.log('Form Data with categoryBrandPairs:', formData);
        const productBlob = new Blob([JSON.stringify(formData)], { type: 'application/json' });
        fd.append('product', productBlob);
        
        // Add main product images
        for (const file of this.selectedImages) {
          fd.append('images', file);
        }

        // Add variant images
        if (formData.variants && formData.variants.length > 0) {
          formData.variants.forEach((variant: any, variantIndex: number) => {
            if (variant.images && variant.images.length > 0) {
              variant.images.forEach((image: any, imgIndex: number) => {
                if (image.file) {
                  fd.append(`variantImages_${variantIndex}`, image.file);
                }
              });
            }
          });
        }

        // Log FormData keys and values
        for (const pair of fd.entries()) {
          console.log('FormData:', pair[0], pair[1]);
        }

        // Add debug logging for variant images
        if (formData.variants && formData.variants.length > 0) {
          console.log('Variant Images Debug:');
          formData.variants.forEach((variant: any, index: number) => {
            console.log(`Variant ${index + 1} Images:`, variant.images);
            if (variant.images && variant.images.length > 0) {
              variant.images.forEach((image: any, imgIndex: number) => {
                console.log(`Variant ${index + 1} Image ${imgIndex + 1}:`, {
                  fileName: image.file?.name,
                  fileSize: image.file?.size,
                  fileType: image.file?.type,
                  previewUrl: image.preview
                });
              });
            }
          });
        }

        payload = fd;
      }
      this.proService.createProduct(payload,).subscribe({
        next: (data) => {
          const productId = data.id || data.productId || data;
          let categoryName: string | null = null;
          let brandName: string | null = null;
          const foundCategory = this.categories.find(c => c.id === this.productForm.value.category);
          if (foundCategory && typeof foundCategory.name === 'string') {
            categoryName = foundCategory.name;
          }
          const foundBrand = this.brands.find(b => b.id === this.productForm.value.brand);
          if (foundBrand && typeof foundBrand.name === 'string') {
            brandName = foundBrand.name;
          }
          let attr1: string | null = null;
          let attr2: string | null = null;
          let attrValues: string[] = [];
          if (this.productAttributes && this.productAttributes.length > 0) {
            for (const attr of this.productAttributes) {
              if (attr.allowedValues && attr.allowedValues.length > 0) {
                console.log('Attribute:', attr.attributeName, 'Values:', attr.allowedValues);
                const selected = attr.allowedValues.find((v: any) => v.selected);
                if (selected) {
                  console.log('Selected value for', attr.attributeName, ':', selected.value);
                }
                const valueToUse = selected || attr.allowedValues[0];
                if (valueToUse && valueToUse.value) {
                  attrValues.push(valueToUse.value);
                }
              }
              if (attrValues.length === 2) break;
            }
          }
          console.log('Attribute values used for SKU:', attrValues);
          attr1 = attrValues[0] || null;
          attr2 = attrValues[1] || null;
          this.sku = this.generateSKU12(
            this.productForm.value.productName,
            [categoryName !== null ? String(categoryName) : ''],
            [brandName !== null ? String(brandName) : ''],
            [
              { attributeName: 'attr1', value: attrValues[0] || '' },
              { attributeName: 'attr2', value: attrValues[1] || '' }
            ],
            0 // variantIndex
          );
          console.log('Generated SKU:', this.sku);
        },
        error: (err) => {
          console.error('Error creating product:', err);
        }
      });
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
    this.modalService.openCreateCategoryModal();
  }

  openNewBrandModal(): void {
    this.modalService.openCreateBrandModal();
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
}