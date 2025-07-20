import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../services/category.service';
import { BrandService } from '../services/brand.service';
import { AttributeService } from '../services/attribute.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-edit',
  templateUrl: './product-edit.component.html',
  styleUrls: ['./product-edit.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class ProductEditComponent implements OnInit {
  productForm!: FormGroup;
  submitted = false;
  editMode = true;
  editingProductId: string | null = null;
  categories: any[] = [];
  brands: any[] = [];
  productAttributes: any[] = [];
  selectedImages: File[] = [];
  selectedImagesPreview: string[] = [];
  categoryBrandArray!: FormArray;

  constructor(
    private fb: FormBuilder,
    private proService: ProductService,
    private cateService: CategoryService,
    private brandService: BrandService,
    private attributeService: AttributeService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadBrands();
    this.loadAttributes();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.editingProductId = id;
        this.loadProductForEdit(id);
      }
    });
  }

  private initForm(): void {
    this.categoryBrandArray = this.fb.array([]);
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
  }

  loadCategories(): void {
    this.cateService.getAllCategory().subscribe(data => this.categories = data);
  }
  loadBrands(): void {
    this.brandService.getAllBrand().subscribe(data => this.brands = data);
  }
  loadAttributes(): void {
    this.attributeService.getAllAttribute().subscribe((data: any) => this.productAttributes = data);
  }

  loadProductForEdit(id: string): void {
    this.proService.getProductDetailById(id).subscribe(product => {
      this.productForm.patchValue({
        productName: product.productName,
        description: product.description,
        price: product.price,
        quantity: product.quantity,
        status: product.status,
      });
      // Patch categories & brands
      if (product.categoryBrandPairs && product.categoryBrandPairs.length > 0) {
        this.categoryBrandArray.clear();
        product.categoryBrandPairs.forEach((pair: any) => {
          this.categoryBrandArray.push(this.fb.group({
            categoryId: [pair.categoryId, Validators.required],
            brandId: [pair.brandId],
            availableBrands: [this.brands]
          }));
        });
      }
      // Patch images (for preview only, not files)
      this.selectedImages = [];
      this.selectedImagesPreview = (product.productImages || []).map((img: any) =>
        img.imageUrl.startsWith('http') ? img.imageUrl : `http://localhost:8080${img.imageUrl}`
      );
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
      // Patch variants
      if (product.variants && Array.isArray(product.variants)) {
        const variantsFormArray = this.productForm.get('variants') as FormArray;
        variantsFormArray.clear();
        product.variants.forEach((variant: any) => {
          variantsFormArray.push(this.fb.group({
            attributes: this.fb.array(variant.attributes || []),
            sku: [variant.sku, Validators.required],
            price: [variant.price, [Validators.required, Validators.min(0.01)]],
            stock: [variant.stock, [Validators.required, Validators.min(1)]],
            images: [variant.images || []]
          }));
        });
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.productForm.valid && this.editingProductId) {
      const formData = this.productForm.value;
      const fd = new FormData();
      const categoryBrandPairs = this.categoryBrandArray.controls.map((group: any) => ({
        categoryId: group.get('categoryId')?.value,
        brandId: group.get('brandId')?.value || null
      }));
      formData.categoryBrandPairs = categoryBrandPairs;
      const productBlob = new Blob([JSON.stringify(formData)], { type: 'application/json' });
      fd.append('product', productBlob);
      for (const file of this.selectedImages) {
        fd.append('images', file);
      }
      if (formData.variants && formData.variants.length > 0) {
        formData.variants.forEach((variant: any, variantIndex: number) => {
          if (variant.images && variant.images.length > 0) {
            variant.images.forEach((image: any) => {
              if (image.file) {
                fd.append(`variantImages_${variantIndex}`, image.file);
              }
            });
          }
        });
      }
      this.proService.updateProduct(this.editingProductId, fd).subscribe({
        next: () => {
          Swal.fire('Success', 'Product updated successfully!', 'success');
          this.router.navigate(['/productlist']);
        },
        error: (err) => {
          Swal.fire('Error', 'Failed to update product.', 'error');
        }
      });
    }
  }

  get variants(): FormArray {
    return this.productForm.get('variants') as FormArray;
  }
} 