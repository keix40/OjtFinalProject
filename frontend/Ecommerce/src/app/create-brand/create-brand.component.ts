import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Brand, BrandDTO } from '../brand';
import { BrandService } from '../brand.service';
import { CategoryService } from '../category.service';
import { Category } from '../category';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-brand',
  standalone: false,
  templateUrl: './create-brand.component.html',
  styleUrl: './create-brand.component.css'
})
export class CreateBrandComponent {
  brand: BrandDTO = {
    brandName: '',
    categoryIds: [],
    categoryName: ''
  };

  categories: Category[] = [];
  brands: Brand[] = [];

  categoryOption: 'old' | 'new' = 'old';
  selectedCategoryIds: number[] = [];  // <-- MULTI SELECT ARRAY
  newCategoryName: string = '';

  constructor(
    public activeModal: NgbActiveModal,
    private brandService: BrandService,
    private cateService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategory();
  }

  loadCategory() {
    this.cateService.getAllCategory().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => {
        console.log('Category load error:', err);
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

  createBrand(form: NgForm) {
    if (form.invalid) return;

    if (this.categoryOption === 'old') {
      this.brand.categoryIds = [...this.selectedCategoryIds];
      this.brand.categoryName = ''; 
    } else {
      this.brand.categoryIds = [];
      this.brand.categoryName = this.newCategoryName.trim();
    }

    this.brandService.createBrand(this.brand).subscribe({
      next: (data) => {
        console.log('Brand created:', data);
        this.activeModal.close(data);
        this.router.navigate(['/product']);
      },
      error: (err) => {
        console.error('Brand create error:', err);
      }
    });
  }
}
