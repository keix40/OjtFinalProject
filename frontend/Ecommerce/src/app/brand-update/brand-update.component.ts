import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BrandService } from '../services/brand.service';
import { CategoryService } from '../services/category.service';
import { BrandListDTO, BrandDTO } from '../brand';
import { Category } from '../category';

@Component({
  selector: 'app-brand-update',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './brand-update.component.html',
  styleUrls: ['./brand-update.component.css']
})
export class BrandUpdateComponent implements OnInit {
  @Input() brandId!: number;
  brand?: BrandDTO;
  categories: Category[] = [];
  selectedCategoryIds: number[] = [];
  loading = true;

  imageFile?: File;
  imagePreviewUrl?: string;

  constructor(
    public activeModal: NgbActiveModal,
    private brandService: BrandService,
    private cateService: CategoryService
  ) {}

  ngOnInit(): void {
    // Fetch all categories
    this.cateService.getAllCategory().subscribe({
      next: (cats) => {
        this.categories = cats;
        // Fetch brand details
        if (this.brandId) {
          this.brandService.getBrandById(this.brandId).subscribe({
            next: (data) => {
              console.log('Brand data:', data);
              this.brand = data;
              this.imagePreviewUrl = this.brand.image ? 'http://localhost:8080' + this.brand.image : undefined;
              this.selectedCategoryIds = data.categoryIds ?? [];
              this.loading = false;
            },
            error: () => {
              this.loading = false;
            }
          });
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onImageSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      this.imageFile = fileInput.files[0];
  
      // Preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviewUrl = e.target.result;
      };
      reader.readAsDataURL(this.imageFile);
    }
  }  

  removeImage() {
    this.imageFile = undefined;
    this.imagePreviewUrl = undefined;
    // Optionally reset the file input
    const fileInput = document.getElementById('imageInputUpdate') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  updateBrand(form: NgForm) {
    if (form.invalid || !this.brand) return;
    // Prepare DTO for update
    const updateDto: BrandDTO = {
      id : this.brandId,
      brandName: this.brand.brandName,
      categoryIds: this.selectedCategoryIds,
      categoryName: '', // Not used for update
      image: this.brand.image // You can add image update logic if needed
    };
    if (!this.brand?.id) return;
    this.brandService.updateBrand(this.brand!.id, updateDto, this.imageFile).subscribe({
      next: () => {
        this.activeModal.close('updated');
      }
    });
  }
}
