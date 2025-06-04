import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BrandService } from '../brand.service';
import { CategoryService } from '../category.service';
import { Router } from '@angular/router';
import { Category, CategoryDTO } from '../category';
import { Brand } from '../brand';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-create-category',
  standalone: false,
  templateUrl: './create-category.component.html',
  styleUrl: './create-category.component.css'
})
export class CreateCategoryComponent {
category : CategoryDTO = {
    cateName : "",
    brandId : 0,
    brandName : ""
  };

  categories: Category[] = [];
  selectedBrandId: number = 0;
  brands: Brand[] = [];

  brandOption: 'old' | 'new' | 'none' = 'old';
  newBrandName: string = '';

  constructor(
    public activeModal: NgbActiveModal,
    private brandService: BrandService,
    private cateService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBrand();
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

  createCategory(form: NgForm) {
    if (form.invalid) return;

    if (this.brandOption === 'old') {
      this.category.brandId = this.selectedBrandId;
      this.category.brandName = ''; 
    } else {
      this.category.brandId = 0;
      this.category.brandName = this.newBrandName.trim();
    }

    this.cateService.createCategory(this.category).subscribe({
      next: (data) => {
        console.log('Category created:', data);
        this.activeModal.close(data);
        this.router.navigate(['/product']);
      },
      error: (err) => {
        console.error('Category create error:', err);
      }
    });
  }
}
