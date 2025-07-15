import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BrandService } from '../services/brand.service';
import { CategoryService } from '../services/category.service';
import { Router } from '@angular/router';
import { Category, CategoryDTO } from '../category';
import { Brand } from '../brand';
import { NgForm } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-category',
  standalone: false,
  templateUrl: './create-category.component.html',
  styleUrls: ['./create-category.component.css']
})
export class CreateCategoryComponent {
  categoryNames: string[] = ['']; // multiple category names
  selectedParentCategoryId?: number;

  selectedBrandId: number = 0;
  newBrandName: string = '';
  brandOption: 'old' | 'new' | 'none' = 'old';

  brands: Brand[] = [];
  categories: Category[] = [];

  selectedImageFile?: File;
  imagePreviewUrl: string | ArrayBuffer | null = null; 

  brandId: number | null = null;
  brandName: string | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    private brandService: BrandService,
    private cateService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBrand();
    this.loadCategory();
  }

  loadBrand() {
    this.brandService.getAllBrand().subscribe({
      next: data => this.brands = data,
      error: err => console.error('Brand load error:', err)
    });
  }

  loadCategory() {
    this.cateService.getAllCategory().subscribe({
      next: data => this.categories = data,
      error: err => console.error('Category load error:', err)
    });
  }

  addCategoryField() {
    this.categoryNames.push('');
  }
  
  removeCategoryField(index: number) {
    if (this.categoryNames.length > 1) {
      this.categoryNames.splice(index, 1);
    }
  }

  createCategory(form: NgForm) {
    if (form.invalid) return;

    // Determine brandId/brandName based on selected option
    if (this.brandOption === 'old') {
      this.brandId = this.selectedBrandId;
      this.brandName = null;
    } else if (this.brandOption === 'none') {
      this.brandId = 0;
      this.brandName = null;
    } else {
      this.brandId = null;
      this.brandName = this.newBrandName.trim();
    }

    // Unique and trimmed category names
    const uniqueNames = Array.from(new Set(
      this.categoryNames.map(n => n.trim()).filter(n => n.length > 0)
    ));

    if (uniqueNames.length === 0) return;

    const dto: CategoryDTO = {
      cateNames: uniqueNames,
      brandId: this.brandId ?? 0,
      brandName: this.brandName ?? '',
      parentId: this.selectedParentCategoryId || undefined
    };

    this.cateService.createCategoryWithImage(dto, this.selectedImageFile).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Category created successfully!',
          timer: 1800,
          showConfirmButton: false
        });
        this.activeModal.close('success');
        if (this.router.url !== '/categorylist') {
          this.router.navigate(['/product']);
        }
        else{
          this.router.navigate(['/categorylist']);
        }
      },
      error: err => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error || 'Failed to create category.',
          showConfirmButton: true
        });
        console.error('Category create error:', err);
      }
    });
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImageFile = file;

      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.selectedImageFile = undefined;
      this.imagePreviewUrl = null;
    }
  }

  removeImage() {
    this.selectedImageFile = undefined;
    this.imagePreviewUrl = null;
    const fileInput = document.getElementById('categoryImageInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }
}