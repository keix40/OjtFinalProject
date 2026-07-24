import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../services/category.service';
import { CategoryTreeDTO } from '../category';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateCategoryComponent } from '../create-category/create-category.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoryUpdateComponent } from '../category-update/category-update.component';
import Swal from 'sweetalert2';
import { LuxDialogService } from '../shared/dialog/lux-dialog.service';
import { CategoryAddSubcategoryComponent } from '../category-add-subcategory/category-add-subcategory.component';
import { PermissionService } from '../services/permission.service';
import { PermissionConstants } from '../constants/permission.constants';
import { LuxUiModule } from '../shared/ui/lux-ui.module';
import { SelectionStore } from '../core/state/selection-store';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LuxUiModule],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.css'],
  providers: [SelectionStore],
})
export class CategoryListComponent implements OnInit {
  categories: CategoryTreeDTO[] = [];
  flatCategories: any[] = [];
  paginatedCategories: any[] = [];
  loading = false;
  error = '';

  searchTerm = '';
  csvDropdownOpen = false;
  pdfDropdownOpen = false;
  showCreateCategoryModal = false;
  /** 0-based page for lux-paginator */
  totalPages = 0;
  currentPage = 0;
  itemsPerPage = 10;
  totalItems = 0;

  constructor(
    private categoryService: CategoryService,
    private modalService: NgbModal,
    public permissionService: PermissionService,
    private luxDialog: LuxDialogService,
    public selection: SelectionStore<number>
  ) {}
  public PermissionConstants = PermissionConstants;

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories() {
    this.loading = true;
    this.categoryService.getCategoryTree().subscribe({
      next: (data) => {
        this.categories = data;
        this.flatCategories = this.flattenCategories(data);
        this.totalItems = this.flatCategories.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage) || 0;
        this.currentPage = 0;
        this.selection.clear();
        this.updatePaginatedCategories();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load categories.';
        this.loading = false;
      }
    });
  }

  updatePaginatedCategories() {
    const start = this.currentPage * this.itemsPerPage;
    this.paginatedCategories = this.flatCategories.slice(start, start + this.itemsPerPage);
  }

  onPageChange(page: number) {
    if (page < 0 || (this.totalPages > 0 && page >= this.totalPages)) return;
    this.currentPage = page;
    this.updatePaginatedCategories();
  }

  get pageIds(): number[] {
    return this.paginatedCategories.map((c) => c.id);
  }

  get selectedCount(): number {
    return this.selection.count();
  }

  get selectedCategories(): any[] {
    const ids = new Set(this.selection.ids());
    return this.flatCategories.filter((c) => ids.has(c.id));
  }

  get allPageSelected(): boolean {
    return this.selection.isPageAllSelected(this.pageIds);
  }

  get partialPageSelected(): boolean {
    return this.selection.isPagePartialSelected(this.pageIds);
  }

  isRowSelected = (row: unknown): boolean =>
    this.selection.isSelected((row as { id: number }).id);

  trackById = (_i: number, row: unknown): number => (row as { id: number }).id;

  onToggleAll(checked: boolean): void {
    this.selection.setPage(this.pageIds, checked);
  }

  onToggleRow(event: { row: unknown; checked: boolean }): void {
    this.selection.toggle((event.row as { id: number }).id, event.checked);
  }

  flattenCategories(categories: CategoryTreeDTO[], level = 0, parent: CategoryTreeDTO | null = null): any[] {
    let result: any[] = [];
    for (const cat of categories) {
      result.push({ ...cat, level, parentId: parent ? parent.id : null });
      if ((cat as any).subcategories && (cat as any).subcategories.length > 0) {
        result = result.concat(this.flattenCategories((cat as any).subcategories, level + 1, cat));
      }
    }
    return result;
  }

  getCategoryImageUrl(cat: CategoryTreeDTO): string {
    if (!cat.image || cat.image.includes('null')) return '';
    if (cat.image.startsWith('http://') || cat.image.startsWith('https://')) return cat.image;
    return `http://localhost:8080${cat.image}`;
  }

  getCategoryBackgroundColor(cat: any): string {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-emerald-500'
    ];
    const name = cat.name || '';
    const charCodeSum = name.split('').reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  }

  getCategoryIndent(level: number): string {
    return `pl-${Math.min(level * 4, 12)}`; // Tailwind: pl-0, pl-4, pl-8, pl-12
  }

  editCategory(cat: any): void {
    const modalRef = this.modalService.open(CategoryUpdateComponent, {
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.categoryId = cat.id;

    modalRef.result.then((result) => {
      if (result === 'updated') {
        this.loadCategories();
        // Optionally show a success message
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  async deleteCategory(cat: CategoryTreeDTO) {
    const confirmed = await this.luxDialog.confirm({
      title: 'Delete Category',
      text: `Are you sure you want to delete "${cat.name}"? This action cannot be undone.`,
      confirmText: 'Yes, delete it!',
      destructive: true
    });
    if (!confirmed) return;

    this.categoryService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.loadCategories();
        this.luxDialog.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Category has been deleted successfully.',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: () => {
        this.luxDialog.error('Error', 'Failed to delete category. Please try again.');
      }
    });
  }

  openAddSubCategoryModal(parentCategoryId: number) {
    const modalRef = this.modalService.open(CategoryAddSubcategoryComponent);
    modalRef.componentInstance.parentId = parentCategoryId;
    // Find the parent in flatCategories and pass its subcategories' names for preselection
    const parent = this.flatCategories.find(cat => cat.id === parentCategoryId);
    if (parent && parent.subcategories) {
      modalRef.componentInstance.preselectedSubCategoryNames = parent.subcategories.map((sub: any) => sub.name);
    } else {
      modalRef.componentInstance.preselectedSubCategoryNames = [];
    }

    modalRef.result.then((result) => {
      if (result === 'success') {
        this.loadCategories(); // Refresh the list after successful subcategory addition
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  exportToPDF(type: 'all' | 'selected' = 'all') {
    try {
      const categoriesToExport = type === 'all' ? this.flatCategories : this.selectedCategories;
      
      if (categoriesToExport.length === 0) {
        this.luxDialog.fire({
          icon: 'warning',
          title: 'No Data to Export',
          text: 'There are no categories to export.',
        });
        return;
      }

      // Show loading
      this.luxDialog.fire({
        title: 'Generating PDF Report...',
        text: 'Please wait while we prepare your report.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      if (type === 'selected') {
        const categoryIds = this.selectedCategories.map(cat => cat.id);
        this.categoryService.exportSelectedCategoriesToPDF(categoryIds).subscribe({
          next: (blob: Blob) => {
            console.log('✓ Category PDF export successful. Blob size:', blob.size, 'bytes');
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Britium_Gallery_Category_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);

            this.luxDialog.fire({
              icon: 'success',
              title: 'Export Successful!',
              text: 'Category report has been exported successfully.',
              timer: 3000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('❌ Category PDF export error:', error);
            this.luxDialog.fire({
              icon: 'error',
              title: 'Export Failed',
              text: 'There was an error exporting the category report to PDF. Please try again.',
            });
          }
        });
      } else {
        this.categoryService.exportCategoryReportToPDF().subscribe({
          next: (blob: Blob) => {
            console.log('✓ Category PDF export successful. Blob size:', blob.size, 'bytes');
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Britium_Gallery_Category_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);

            this.luxDialog.fire({
              icon: 'success',
              title: 'Export Successful!',
              text: 'Category report has been exported successfully.',
              timer: 3000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('❌ Category PDF export error:', error);
            this.luxDialog.fire({
              icon: 'error',
              title: 'Export Failed',
              text: 'There was an error exporting the category report to PDF. Please try again.',
            });
          }
        });
      }
    } catch (error) {
      console.error('Category PDF export error:', error);
      this.luxDialog.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'There was an error exporting to PDF. Please try again.',
      });
    }
  }

  exportToCSV(type: 'all' | 'selected' = 'all') {
    try {
      const categoriesToExport = type === 'all' ? this.flatCategories : this.selectedCategories;
      
      if (categoriesToExport.length === 0) {
        this.luxDialog.fire({
          icon: 'warning',
          title: 'No Data to Export',
          text: 'There are no categories to export.',
        });
        return;
      }

      // Show loading
      this.luxDialog.fire({
        title: 'Generating CSV Report...',
        text: 'Please wait while we prepare your report.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      if (type === 'selected') {
        const categoryIds = this.selectedCategories.map(cat => cat.id);
        this.categoryService.exportSelectedCategoriesToCSV(categoryIds).subscribe({
          next: (blob: Blob) => {
            console.log('✓ Category CSV export successful. Blob size:', blob.size, 'bytes');
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Britium_Gallery_Category_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);

            this.luxDialog.fire({
              icon: 'success',
              title: 'Export Successful!',
              text: 'Category report has been exported successfully.',
              timer: 3000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('❌ Category CSV export error:', error);
            this.luxDialog.fire({
              icon: 'error',
              title: 'Export Failed',
              text: 'There was an error exporting the category report to CSV. Please try again.',
            });
          }
        });
      } else {
        this.categoryService.exportCategoryReportToCSV().subscribe({
          next: (blob: Blob) => {
            console.log('✓ Category CSV export successful. Blob size:', blob.size, 'bytes');
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Britium_Gallery_Category_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);

            this.luxDialog.fire({
              icon: 'success',
              title: 'Export Successful!',
              text: 'Category report has been exported successfully.',
              timer: 3000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('❌ Category CSV export error:', error);
            this.luxDialog.fire({
              icon: 'error',
              title: 'Export Failed',
              text: 'There was an error exporting the category report to CSV. Please try again.',
            });
          }
        });
      }
    } catch (error) {
      console.error('Category CSV export error:', error);
      this.luxDialog.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'There was an error exporting to CSV. Please try again.',
      });
    }
  }

  onSearch() {
    if (!this.searchTerm) {
      this.flatCategories = this.flattenCategories(this.categories);
    } else {
      const term = this.searchTerm.toLowerCase();
      this.flatCategories = this.flattenCategories(this.categories).filter(cat =>
        cat.name && cat.name.toLowerCase().includes(term)
      );
    }
    this.totalItems = this.flatCategories.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage) || 0;
    this.currentPage = 0;
    this.updatePaginatedCategories();
  }

  openCreateCategoryModal(): void {
    const modalRef = this.modalService.open(CreateCategoryComponent, {
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.result.then((result) => {
      if (result === 'success') {
        this.loadCategories(); // Refresh the list
        // Optionally show a success message (e.g., with Swal)
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  closeCreateCategoryModal() {
    this.showCreateCategoryModal = false;
  }

  getCategoryIndentStyle(level: number): { [key: string]: string } {
    return { paddingLeft: `${Math.min(level, 4) * 1}rem` };
  }
}
