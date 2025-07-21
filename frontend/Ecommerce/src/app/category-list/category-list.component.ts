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
import { CategoryAddSubcategoryComponent } from '../category-add-subcategory/category-add-subcategory.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.css']
})
export class CategoryListComponent implements OnInit {
  categories: CategoryTreeDTO[] = [];
  flatCategories: any[] = [];
  paginatedCategories: any[] = [];
  loading = false;
  error = '';

  // Additions for template compatibility
  searchTerm: string = '';
  selectedCategories: any[] = [];
  excelDropdownOpen = false;
  pdfDropdownOpen = false;
  showCreateCategoryModal: boolean = false;
  // Pagination properties
  totalPages: number = 1;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  Math = Math;

  constructor(
    private categoryService: CategoryService,
    private modalService: NgbModal
  ) {}

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
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.currentPage = 1;
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
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedCategories = this.flatCategories.slice(start, end);
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePaginatedCategories();
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
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

  deleteCategory(cat: CategoryTreeDTO) {
    Swal.fire({
      title: 'Delete Category',
      text: `Are you sure you want to delete "${cat.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.categoryService.deleteCategory(cat.id).subscribe({
          next: () => {
            this.loadCategories();
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Category has been deleted successfully.',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to delete category. Please try again.',
              confirmButtonColor: '#3085d6'
            });
          }
        });
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

  exportToExcel(type: 'all' | 'selected' = 'all') {
    const exportData = (type === 'all' ? this.flatCategories : this.selectedCategories).map(cat => ({
      'Category ID': cat.id,
      'Category Name': cat.name,
      'Parent ID': cat.parentId,
      'Level': cat.level
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Categories');
    XLSX.writeFile(workbook, `categories_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  exportToPDF(type: 'all' | 'selected' = 'all') {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    doc.setFontSize(18);
    doc.text('Category Management Report', 14, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Total Categories: ${this.flatCategories.length}`, 14, 40);
    const exportData = (type === 'all' ? this.flatCategories : this.selectedCategories);
    const tableData = exportData.map(cat => [
      cat.id.toString(),
      cat.name,
      cat.parentId ? cat.parentId.toString() : '-',
      cat.level.toString()
    ]);
    (doc as any).autoTable({
      head: [['Category ID', 'Category Name', 'Parent ID', 'Level']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 46, 63], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    doc.save(`categories_${new Date().toISOString().split('T')[0]}.pdf`);
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
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.currentPage = 1;
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

  isAllSelected(): boolean {
    return this.flatCategories.length > 0 && this.selectedCategories.length === this.flatCategories.length;
  }

  onSelectAll(event: any) {
    if (event.target.checked) {
      this.selectedCategories = [...this.flatCategories];
    } else {
      this.selectedCategories = [];
    }
  }

  isCategorySelected(cat: any): boolean {
    return this.selectedCategories.some(selected => selected.id === cat.id);
  }

  onCategorySelect(cat: any, event: any) {
    if (event.target.checked) {
      if (!this.isCategorySelected(cat)) {
        this.selectedCategories.push(cat);
      }
    } else {
      this.selectedCategories = this.selectedCategories.filter(selected => selected.id !== cat.id);
    }
  }

  
}
