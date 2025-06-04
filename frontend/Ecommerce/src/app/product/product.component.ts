import { Component, OnInit } from '@angular/core';
import { Product } from '../product';
import { ProductService } from '../product.service';
import { NgForm } from '@angular/forms';
import { CategoryService } from '../category.service';
import { BrandService } from '../brand.service';
import { Brand } from '../brand';
import { Category } from '../category';
import { Router } from '@angular/router';
import { ModalService } from '../modal.service';
import { CreateBrandComponent } from '../create-brand/create-brand.component';

@Component({
  selector: 'app-product',
  standalone: false,
  templateUrl: './product.component.html',
  styleUrl: './product.component.css'
})
export class ProductComponent{
product: Product = {
    productName: '',
    price: 0,
    quantity: 0,
    description: '',
    brand: { id: 0 },
    category: { id: 0 }
  };

  brands: Brand[] = [];
  categories: Category[] = [];

  selectedImages: File[] = [];
  selectedCategoryId: number = 0;

  constructor(
    private proService: ProductService,
    private cateService: CategoryService,
    private brandService: BrandService,
    private router: Router,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.loadCategory();
    this.loadBrand();
    this.selectedCategoryId = this.product.category.id || 0;
  }

  loadCategory() {
    this.cateService.getAllCategory().subscribe({
      next: (data) => {
        this.categories = data;
        console.log('Category Success');
      },
      error: (err) => {
        console.log('Category Fail', err.status, err.message, err.error);
      }
    });
  }

  loadBrand() {
    this.brandService.getAllBrand().subscribe({
      next: (data) => {
        this.brands = data;
        console.log('Brand Success');
      },
      error: (err) => {
        console.log('Brand Fail', err.status, err.message, err.error);
      }
    });
  }

  onCategoryChange() {
    if (this.selectedCategoryId === 0) {
      this.showCreateCategoryModal();
      return;
    }

    if (this.selectedCategoryId) {
      this.product.category.id = this.selectedCategoryId;

      this.brandService.getBrandByCateId(this.selectedCategoryId).subscribe({
        next: (data) => {
          this.brands = data;

          if (!this.brands.find(b => b.id === this.product.brand.id)) {
            this.product.brand.id = 0;
          }
        },
        error: (err) => {
          console.error('Error loading brands by category', err);
          this.brands = [];
          this.product.brand.id = 0;
        }
      });
    } else {
      this.brands = [];
      this.product.category.id = 0;
      this.product.brand.id = 0;
    }
  }

  onImageSelect(event: any) {
    this.selectedImages = Array.from(event.target.files);
  }

  onSubmit(form: NgForm) {
    const formData = new FormData();

    const productBlob = new Blob([JSON.stringify(this.product)], { type: 'application/json' });
    formData.append('product', productBlob);

    this.selectedImages.forEach((image) => {
      formData.append('images', image);
    });

    this.proService.createProduct(formData).subscribe({
      next: (res) => {
        console.log(res);
        form.resetForm();
        this.selectedImages = [];
        this.router.navigate(['/product']);
      },
      error: (err) => {
        console.error(err);
        this.router.navigate(['/product']);
      }
    });
  }

  selectedBrandId: number | string | null = null;

  onBrandChange() {
    if (this.product.brand.id === 0) {
      this.showCreateBrandModal();
    }
  }

  showCreateBrandModal() {
    this.modalService.openCreateBrandModal()
      .then((newBrand) => {
        if (newBrand) {
           this.loadBrand();
          this.product.brand.id = newBrand.id;
        }
      })
      .catch(() => {
        console.log('Modal dismissed');
      });
  }

  showCreateCategoryModal() {
    this.modalService.openCreateCategoryModal().then((newCategory) => {
      if (newCategory) {
        this.loadCategory();
        this.selectedCategoryId = newCategory.id;
        this.product.category.id = newCategory.id;
        
        this.onCategoryChange();
      }
    }).catch(() => {
      console.log('Category modal dismissed');
    });
  }

}
