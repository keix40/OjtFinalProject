import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoryService } from '../services/category.service';
import { BrandService } from '../services/brand.service';
import { Category } from '../category';
import { NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { PermissionService } from '../services/permission.service';
import { PermissionConstants } from '../constants/permission.constants';

@Component({
  selector: 'app-category-update',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-update.component.html',
  styleUrls: ['./category-update.component.css']
})
export class CategoryUpdateComponent implements OnInit {
  @Input() categoryId!: number;

  category: Category | null = null;
  categories: Category[] = [];
  categoryNames: string[] = [''];
  selectedParentCategoryId?: number;
  selectedImageFile?: File;
  imagePreviewUrl: string | ArrayBuffer | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    private categoryService: CategoryService,
    private brandService: BrandService,
    public permissionService: PermissionService
  ) {}
  public PermissionConstants = PermissionConstants;

  ngOnInit(): void {
    this.loadCategoriesAndSetCategory();
  }

  loadCategoriesAndSetCategory() {
    this.categoryService.getAllCategory().subscribe({
      next: (data: Category[]) => {
        this.categories = data;
        const found = data.find(c => c.id === this.categoryId);
        if (found) {
          this.category = found;
          this.categoryNames = [found.name];
          this.selectedParentCategoryId = found.parentId || undefined;
          this.imagePreviewUrl = found.image ? `http://localhost:8080${found.image}` : null;
        }
      }
    });
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImageFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedImageFile = undefined;
    this.imagePreviewUrl = null;
  }

  updateCategory(form: NgForm) {
    if (form.invalid || !this.category) return;
    const name = this.categoryNames[0];
    const parentId = this.selectedParentCategoryId;
    this.categoryService.updateCategory(this.categoryId, name, parentId, this.selectedImageFile).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Category updated successfully!',
          timer: 2000,
          showConfirmButton: false
        });
        this.activeModal.close('updated');
      }
    });
  }
}
