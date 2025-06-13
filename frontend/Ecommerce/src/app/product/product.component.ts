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
  }

  // ===== Form Initialization =====
  private initForm(): void {
    this.productForm = this.fb.group({
      productName: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      status: ['active', Validators.required],
      brand: [null, Validators.required],
      category: [null, Validators.required],
      hasVariant: [false],
      attributes: this.fb.array([]),
      variants: this.fb.array([])
    });

    this.submitted = false;

    // Subscribe to hasVariant changes
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
        // Load values for each attribute
        attributes.forEach(attr => {
          this.attributeService.getValueById(attr.id).subscribe({
            next: (values) => {
              const attributeWithValues: Attribute = {
                id: attr.id,
                name: attr.name,
                values: values.map(v => ({
                  id: v.id,
                  value: v.value,
                  isNew: false
                }))
              };
              this.availableAttributes.push(attributeWithValues);
            },
            error: (err) => console.error(`Error loading values for attribute ${attr.id}:`, err)
          });
        });
      },
      error: (err) => console.error('Error loading attributes:', err)
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
    if (attr && !this.productAttributes.some(pa => pa.attributeId === attr.id)) {
      this.productAttributes.push({
        attributeId: attr.id,
        attributeName: attr.name,
        allowedValues: attr.values.map(v => ({ ...v, selected: false, isNew: false }))
      });
      this.regenerateVariants();
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

    const valueCombinations = this.productAttributes.map(attr =>
      attr.allowedValues.filter(v => v.selected).map(value => ({
        attributeId: attr.attributeId,
        attributeName: attr.attributeName,
        valueId: value.id,
        value: value.value
      }))
    );

    if (valueCombinations.some(arr => arr.length === 0)) {
      this.clearVariants();
      return;
    }

    const combinations = this.generateCombinations(valueCombinations);
    this.createVariants(combinations);
  }

  private generateCombinations(arr: any[][]): any[][] {
    return arr.reduce((a, b) => a.flatMap(d => b.map(e => [...d, e])), [[]]);
  }

  private createVariants(combinations: any[][]): void {
    while (this.variants.length) {
      this.variants.removeAt(0);
    }

    combinations.forEach(attributes => {
      const variant = this.fb.group({
        attributes: this.fb.array(attributes),
        sku: ['', Validators.required],
        price: [0, [Validators.required, Validators.min(0.01)]],
        stock: [0, [Validators.required, Validators.min(0)]],
        images: [[]]
      });
      this.variants.push(variant);
    });
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
    return attr.allowedValues.filter(v => !v.isNew);
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
    attr.allowedValues[valueIndex].selected = !attr.allowedValues[valueIndex].selected;
    this.regenerateVariants();
  }

  // ===== Form Submission Methods =====
  onSubmit(): void {
    this.submitted = true;
    if (this.productForm.valid) {
      const formData = this.productForm.value;
      console.log('Form Data:', {
        ...formData,
        images: this.selectedImages,
        variants: this.variants.value
      });
      
      this.proService.createProduct(formData).subscribe({
        next: (data) => {
          console.log('Product created successfully:', data);
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
}