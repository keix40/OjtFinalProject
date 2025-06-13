import { Component, Input, OnInit, Optional } from '@angular/core';
import { Product } from '../product';
import { ProductService } from '../product.service';
import { NgForm } from '@angular/forms';
import { CategoryService } from '../category.service';
import { BrandService } from '../brand.service';
import { Brand } from '../brand';
import { Category } from '../category';
import { Router } from '@angular/router';
import { ModalService } from '../modal.service';
// import { AttributeValue, Attribute } from '../attribute';
import { AttributeService } from '../attribute.service';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

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

interface VariantAttributeValue {
  attributeId: number;
  valueId: number;
  value: string;
}

interface Variant {
  id: string;
  attributes: { attributeId: number; attributeName: string; valueId: number; value: string }[];
  sku: string;
  price: number;
  stock: number;
  images: { file: File; preview: string }[];
}

@Component({
  selector: 'app-product',
  standalone: false,
  templateUrl: './product.component.html',
  styleUrl: './product.component.css'
})
export class ProductComponent implements OnInit {
  productForm!: FormGroup;
  submitted = false;
  categories: Category[] = [];
  brands: Brand[] = [];
  hasVariant: boolean = false;
  selectedImages: File[] = [];
  selectedImagesPreview: string[] = [];
  isDragging = false;
  maxFileSize = 5 * 1024 * 1024; // 5MB
  validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  uploadError = '';

  // Mock available attributes
  availableAttributes: Attribute[] = [
    { id: 1, name: 'Color', values: [ { id: 1, value: 'Red', isNew: false }, { id: 2, value: 'Blue', isNew: false }, { id: 3, value: 'Green', isNew: false }, { id: 4, value: 'Black', isNew: false } ] },
    { id: 2, name: 'Size', values: [ { id: 5, value: 'S', isNew: false }, { id: 6, value: 'M', isNew: false }, { id: 7, value: 'L', isNew: false }, { id: 8, value: 'XL', isNew: false } ] }
  ];

  // Product-level selected attributes
  productAttributes: ProductAttribute[] = [];

  // For add attribute dropdown
  selectedAttributeId: number | null = null;

  // For new attribute modal
  showNewAttributeModal = false;
  newAttributeName = '';
  newAttributeValues: string[] = [];
  newAttributeValueInput = '';

  selectedValueIdMap: { [attrId: number]: number | null } = {};

  constructor(
    private fb: FormBuilder,
    private proService: ProductService,
    private cateService: CategoryService,
    private brandService: BrandService,
    private router: Router,
    private modalService: ModalService,
  ) {
    this.initForm();
  }

  private initForm() {
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

  ngOnInit(): void {
    this.submitted = false;
    this.loadCategories();
    this.loadBrands();
  }

  private loadCategories() {
    this.cateService.getAllCategory().subscribe({
      next: (data) => this.categories = data,
      error: (err) => console.error('Category error:', err)
    });
  }

  private loadBrands() {
    this.brandService.getAllBrand().subscribe({
      next: (data: Brand[]) => this.brands = data,
      error: (err: any) => console.error('Brand error:', err)
    });
  }

  // Form getters
  get attributes() {
    return this.productForm.get('attributes') as FormArray;
  }

  get variants() {
    return this.productForm.get('variants') as FormArray;
  }

  get variantFormGroups(): FormGroup[] {
    return (this.variants as FormArray).controls as FormGroup[];
  }

  // Image handling
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
      // Validate file type
      if (!this.validImageTypes.includes(file.type)) {
        this.uploadError = 'Invalid file type. Please upload only JPG, PNG, GIF, or WebP images.';
        continue;
      }

      // Validate file size
      if (file.size > this.maxFileSize) {
        this.uploadError = 'File size exceeds 5MB limit.';
        continue;
      }

      this.selectedImages.push(file);
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedImagesPreview.push(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
    this.selectedImagesPreview.splice(index, 1);
  }

  // Drag and drop handlers
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

  // Attribute management
  addProductAttribute() {
    if (this.selectedAttributeId) {
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
  }

  removeProductAttribute(attrIndex: number) {
    this.productAttributes.splice(attrIndex, 1);
    this.regenerateVariants();
  }

  // New attribute modal
  openNewAttributeModal() {
    this.showNewAttributeModal = true;
    this.newAttributeName = '';
    this.newAttributeValues = [];
    this.newAttributeValueInput = '';
  }

  closeNewAttributeModal() {
    this.showNewAttributeModal = false;
  }

  addNewAttributeValue() {
    if (this.newAttributeValueInput.trim()) {
      this.newAttributeValues.push(this.newAttributeValueInput.trim());
      this.newAttributeValueInput = '';
    }
  }

  saveNewAttribute() {
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

  // Variant management
  private regenerateVariants() {
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
      while (this.variants.length) this.variants.removeAt(0);
      return;
    }
    const cartesian = (arr: any[][]): any[][] =>
      arr.reduce((a, b) => a.flatMap(d => b.map(e => [...d, e])), [[]]);
    const combinations = cartesian(valueCombinations);
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

  onVariantImageSelect(index: number) {
    const input = document.getElementById('variantImageInput' + index) as HTMLInputElement;
    if (input) input.click();
  }

  onVariantImageChange(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      const variant = this.variants.at(index);
      const currentImages = variant.get('images')?.value || [];
      
      for (let file of files) {
        // Validate file type
        if (!this.validImageTypes.includes(file.type)) {
          this.uploadError = 'Invalid file type. Please upload only JPG, PNG, GIF, or WebP images.';
          continue;
        }

        // Validate file size
        if (file.size > this.maxFileSize) {
          this.uploadError = 'File size exceeds 5MB limit.';
          continue;
        }

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
      input.value = '';
    }
  }

  removeVariantImage(variantIndex: number, imageIndex: number) {
    const variant = this.variants.at(variantIndex);
    const currentImages = variant.get('images')?.value || [];
    currentImages.splice(imageIndex, 1);
    variant.get('images')?.setValue(currentImages);
  }

  private clearVariants() {
    while (this.variants.length) {
      this.variants.removeAt(0);
    }
    this.productAttributes = [];
  }

  // Helper methods
  isAttributeDisabled(attrId: number): boolean {
    return this.productAttributes.some(pa => pa.attributeId === attrId);
  }

  getAttributeValues(attributeId: number): AttributeValue[] {
    const attr = this.availableAttributes.find(a => a.id === attributeId);
    return attr ? attr.values : [];
  }

  // Form submission
  onSubmit() {
    this.submitted = true;
    if (this.productForm.valid) {
      const formData = this.productForm.value;
      console.log('Form Data:', {
        ...formData,
        images: this.selectedImages,
        variants: this.variants.value
      });
      
      // Here you would typically call your service to save the product
      // this.proService.createProduct(formData).subscribe(...)
    } else {
      this.markFormGroupTouched(this.productForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  addNewAttributeValueToAttribute(attrIndex: number, value: string, isNew: boolean = false) {
    if (!value.trim()) return;
    const attr = this.productAttributes[attrIndex];
    const newId = Math.max(0, ...attr.allowedValues.map(v => v.id)) + 1;
    attr.allowedValues.push({ id: newId, value: value.trim(), selected: true, isNew });
    this.regenerateVariants();
  }

  toggleAttributeValue(attrIndex: number, valueIndex: number) {
    const attr = this.productAttributes[attrIndex];
    attr.allowedValues[valueIndex].selected = !attr.allowedValues[valueIndex].selected;
    this.regenerateVariants();
  }

  getOriginalValues(attr: ProductAttribute) {
    return attr.allowedValues.filter(v => !v.isNew);
  }

  getNewValues(attr: ProductAttribute) {
    return attr.allowedValues.filter(v => v.isNew);
  }
}
