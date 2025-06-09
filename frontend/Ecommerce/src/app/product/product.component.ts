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
    categoryBrandPairs: []
  };

  categories: Category[] = [];

  categoryBrandPairs: {
    category: number | null;
    brand: number | null;
    availableBrands: Brand[];
  }[] = [
    { category: null, brand: null, availableBrands: [] }
  ];

  selectedImages: File[] = [];
  selectedImagesPreview: string[] = [];

  hasVariant: boolean = false;

  constructor(
    private proService: ProductService,
    private cateService: CategoryService,
    private brandService: BrandService,
    private router: Router,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.loadCategory();
  }

  loadCategory() {
    this.cateService.getAllCategory().subscribe({
      next: (data) => this.categories = data,
      error: (err) => console.error('Category error:', err)
    });
  }

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      for (let file of files) {
        this.selectedImages.push(file);
  
        const reader = new FileReader();
        reader.onload = () => {
          this.selectedImagesPreview.push(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
  
      input.value = '';
    }
  }
  
  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
    this.selectedImagesPreview.splice(index, 1);
  }

  addCategoryBrandPair() {
    this.categoryBrandPairs.push({
      category: null,
      brand: null,
      availableBrands: []
    });
  }

  async onCategoryChange(index: number) {
    const selectedCategory = this.categoryBrandPairs[index].category;

    if (selectedCategory === 0) {
      try {
        const newCategory = await this.modalService.openCreateCategoryModal();
        if (newCategory) {
          this.loadCategory();
          this.categoryBrandPairs[index].category = newCategory.id;
        } else {
          this.categoryBrandPairs[index].category = null;
        }
      } catch {
        this.categoryBrandPairs[index].category = null;
      }
    } else if (selectedCategory) {
      this.brandService.getBrandByCateId(selectedCategory).subscribe({
        next: (brands) => {
          this.categoryBrandPairs[index].availableBrands = brands;
          if (!brands.find(b => b.id === this.categoryBrandPairs[index].brand)) {
            this.categoryBrandPairs[index].brand = null;
          }
        },
        error: () => {
          this.categoryBrandPairs[index].availableBrands = [];
          this.categoryBrandPairs[index].brand = null;
        }
      });
    }
  }

  async onBrandChange(index: number) {
    const selectedBrand = this.categoryBrandPairs[index].brand;

    if (selectedBrand === 0) {
      try {
        const newBrand = await this.modalService.openCreateBrandModal();
        if (newBrand) {
          this.onCategoryChange(index); // Reload brands
          this.categoryBrandPairs[index].brand = newBrand.id;
        } else {
          this.categoryBrandPairs[index].brand = null;
        }
      } catch {
        this.categoryBrandPairs[index].brand = null;
      }
    }
  }

  onSubmit(form: NgForm) {
    if (!form.valid) return;
  
    this.product.categoryBrandPairs = this.categoryBrandPairs
      .filter(pair => pair.category !== null)
      .map(pair => ({
        categoryId: pair.category!,
        brandId: pair.brand ?? null
      }));
  
    const formData = new FormData();
    const productBlob = new Blob([JSON.stringify(this.product)], {
      type: 'application/json'
    });
    formData.append('product', productBlob);
  
    this.selectedImages.forEach(image => formData.append('images', image));
  
    this.proService.createProduct(formData).subscribe({
      next: () => {
        form.resetForm();
        this.selectedImages = [];
        this.categoryBrandPairs = [{ category: null, brand: null, availableBrands: [] }];
        this.router.navigate(['/productlist']);
      },
      error: (err) => {
        console.error('Product creation failed:', err);
        this.router.navigate(['/product']);
      }
    });
  }  

  removeCategoryBrandPair(index: number) {
    this.categoryBrandPairs.splice(index, 1);
  }
  
}
