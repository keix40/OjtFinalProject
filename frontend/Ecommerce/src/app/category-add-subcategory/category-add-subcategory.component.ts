import { Component, Input } from '@angular/core';
import { Category, SubCategoryDTO } from '../category';
import { CategoryService } from '../services/category.service';
import { FormsModule, NgForm } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-add-subcategory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-add-subcategory.component.html',
  styleUrls: ['./category-add-subcategory.component.css'] 
})
export class CategoryAddSubcategoryComponent {
  @Input() parentId?: number;
  @Input() preselectedSubCategoryNames: string[] = [];
  categories: Category[] = [];
  parentCategory?: Category;
  selectedSubCategoryNames: string[] = [];

  constructor(private categoryService: CategoryService, public activeModal: NgbActiveModal) {}

  ngOnInit(): void {
    this.loadAllCategories();
    // Preselect subcategories if provided
    if (this.preselectedSubCategoryNames && this.preselectedSubCategoryNames.length > 0) {
      this.selectedSubCategoryNames = [...this.preselectedSubCategoryNames];
    }
  }

  loadAllCategories() {
    this.categoryService.getAllCategory().subscribe({
      next: data => {
        this.categories = data;
        if (this.parentId) {
          this.parentCategory = this.categories.find(c => c.id === this.parentId);
        }
      },
      error: err => console.error(err)
    });
  }

  getSubCategoryOptions(): Category[] {
    // Exclude only the parent itself
    return this.categories.filter(c => c.id !== this.parentId);
  }

  submit(form: NgForm) {
    if (!this.parentId || this.selectedSubCategoryNames.length === 0) return;
    const dto: SubCategoryDTO = {
      parentId: this.parentId,
      subCategoryNames: this.selectedSubCategoryNames
    };
    this.categoryService.addSubCategories(dto).subscribe({
      next: res => {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Subcategories added successfully!',
          timer: 1800,
          showConfirmButton: false
        });
        this.activeModal.close('success');
      },
      error: err => {
        Swal.fire('Error', err.error || 'Failed to add subcategories.', 'error');
      }
    });
  }
}
