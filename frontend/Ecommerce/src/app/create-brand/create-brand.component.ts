import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BrandDTO } from '../brand';
import { BrandService } from '../services/brand.service';
import { CategoryService } from '../services/category.service';
import { Category } from '../category';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-brand',
  standalone: false,
  templateUrl: './create-brand.component.html',
  styleUrls: ['./create-brand.component.css']
})
export class CreateBrandComponent implements OnInit {
  brand: BrandDTO = {
    brandName: '',
    categoryIds: [],
    categoryName: ''
  };

  categories: Category[] = [];
  categoryOption: 'old' | 'new' = 'old';
  selectedCategoryIds: number[] = [];
  newCategoryName: string = '';

  selectedImageFile?: File;
  imagePreview?: string;

  constructor(
    public activeModal: NgbActiveModal,
    private brandService: BrandService,
    private cateService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories() {
    this.cateService.getAllCategory().subscribe({
      next: (data) => (this.categories = data),
      error: (err) => console.error('Category load error:', err)
    });
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImageFile = input.files[0];

      // Preview
      const reader = new FileReader();
      reader.onload = e => this.imagePreview = reader.result as string;
      reader.readAsDataURL(this.selectedImageFile);
    }
  }

  removeImage() {
    this.selectedImageFile = undefined;
    this.imagePreview = undefined;
    // Reset the file input
    const fileInput = document.getElementById('imageInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
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

    this.brandService.createBrandWithImage(this.brand, this.selectedImageFile).subscribe({
      next: () => {
        this.activeModal.close('success');
        if (this.router.url !== '/brandlist') {
          this.router.navigate(['/product']);
        }
        else{
          this.router.navigate(['/brandlist']);
        }
      },
      error: err => {
        console.error('Brand create error:', err);
      }
    });
  }
}
