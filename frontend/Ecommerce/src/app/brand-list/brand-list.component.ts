import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrandService } from '../services/brand.service';
import { BrandListDTO, BrandDTO } from '../brand';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateBrandComponent } from '../create-brand/create-brand.component';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { BrandUpdateComponent } from '../brand-update/brand-update.component';

@Component({
  selector: 'app-brand-list',
  standalone: false,
  templateUrl: './brand-list.component.html',
  styleUrl: './brand-list.component.css'
})
export class BrandListComponent implements OnInit, AfterViewInit, OnDestroy {
  brands: BrandListDTO[] = [];
  filteredBrands: BrandListDTO[] = [];
  selectedBrands: BrandListDTO[] = [];
  loading = false;
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;

  // Track failed images
  failedImages = new Set<number>();

  // Export dropdown states
  excelDropdownOpen = false;
  pdfDropdownOpen = false;

  // Track if the modal is open
  isBrandModalOpen = false;

  constructor(
    private brandService: BrandService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadBrands();
  }

  ngAfterViewInit(): void {
    // Initialize any third-party libraries if needed
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  loadBrands(): void {
    this.loading = true;
    this.brandService.getAllBrand().subscribe({
      next: (data) => {
        console.log('Raw brand data:', data);
        this.brands = data;
        this.filteredBrands = [...data];
        this.totalItems = data.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading brands:', err);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load brands. Please try again.',
          confirmButtonColor: '#3085d6'
        });
      }
    });
  }

  getBrandImageUrl(brand: BrandListDTO): string {
    if (!brand.image || brand.image.trim() === '') {
      return '';
    }
    const imagePath = brand.image;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    if (imagePath.startsWith('/assets/')) {
      return imagePath;
    }
    return `http://localhost:8080${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
  }

  getBrandInitial(brand: BrandListDTO): string {
    const name = brand.name?.toString().trim();
    if (!name || name.length === 0) {
      return 'B';
    }
    return name.charAt(0).toUpperCase();
  }

  getBrandBackgroundColor(brand: BrandListDTO): string {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-emerald-500'
    ];
    const name = brand.name?.toString() || '';
    const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredBrands = [...this.brands];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredBrands = this.brands.filter(brand => 
        brand.name.toLowerCase().includes(searchLower) ||
        brand.categories.some(cat => cat.name.toLowerCase().includes(searchLower))
      );
    }
    this.totalItems = this.filteredBrands.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.currentPage = 1;
  }

  get paginatedBrands(): BrandListDTO[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredBrands.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onBrandSelect(brand: BrandListDTO, event: any): void {
    if (event.target.checked) {
      this.selectedBrands.push(brand);
    } else {
      this.selectedBrands = this.selectedBrands.filter(b => b.id !== brand.id);
    }
  }

  onSelectAll(event: any): void {
    if (event.target.checked) {
      this.selectedBrands = [...this.paginatedBrands];
    } else {
      this.selectedBrands = [];
    }
  }

  isAllSelected(): boolean {
    return this.selectedBrands.length === this.paginatedBrands.length && this.paginatedBrands.length > 0;
  }

  isBrandSelected(brand: BrandListDTO): boolean {
    return this.selectedBrands.some(b => b.id === brand.id);
  }

  onCardSelect(brand: BrandListDTO): void {
    if (this.isBrandSelected(brand)) {
      this.selectedBrands = this.selectedBrands.filter(b => b.id !== brand.id);
    } else {
      this.selectedBrands.push(brand);
    }
  }

  openCreateBrandModal(): void {
    this.isBrandModalOpen = true;
    const modalRef = this.modalService.open(CreateBrandComponent, {
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.result.then((result) => {
      this.isBrandModalOpen = false;
      if (result === 'success') {
        this.loadBrands();
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Brand created successfully!',
          timer: 2000,
          showConfirmButton: false
        });
      }
    }).catch(() => {
      this.isBrandModalOpen = false;
      // Modal dismissed
    });
  }

  editBrand(brand: BrandListDTO): void {
    const modalRef = this.modalService.open(BrandUpdateComponent, {
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.brandId = brand.id;

    modalRef.result.then((result) => {
      if (result === 'updated') {
        this.loadBrands();
        // Optionally show a success message
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  deleteBrand(brand: BrandListDTO): void {
    Swal.fire({
      title: 'Delete Brand',
      text: `Are you sure you want to delete "${brand.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.brandService.deleteBrand(brand.id).subscribe({
          next: () => {
            this.loadBrands();
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Brand has been deleted successfully.',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (err) => {
            console.error('Error deleting brand:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to delete brand. Please try again.',
              confirmButtonColor: '#3085d6'
            });
          }
        });
      }
    });
  }

  // Export functionality
  toggleExcelDropdown(): void {
    this.excelDropdownOpen = !this.excelDropdownOpen;
    if (this.excelDropdownOpen) {
      this.pdfDropdownOpen = false;
    }
  }

  togglePdfDropdown(): void {
    this.pdfDropdownOpen = !this.pdfDropdownOpen;
    if (this.pdfDropdownOpen) {
      this.excelDropdownOpen = false;
    }
  }

  exportToExcel(type: 'all' | 'selected' = 'all'): void {
    try {
      const brandsToExport = type === 'selected' ? this.selectedBrands : this.filteredBrands;
      
      if (brandsToExport.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'No Data to Export',
          text: 'There are no brands to export.',
          confirmButtonColor: '#3085d6'
        });
        return;
      }

      const exportData = brandsToExport.map(brand => ({
        'Brand ID': brand.id,
        'Brand Name': brand.name,
        'Image URL': brand.image || 'N/A',
        'Categories': brand.categories.map(cat => cat.name).join(', ') || 'N/A',
        'Category Count': brand.categories.length
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Brands');

      // Auto-size columns
      const columnWidths = [
        { wch: 10 }, // Brand ID
        { wch: 25 }, // Brand Name
        { wch: 40 }, // Image URL
        { wch: 30 }, // Categories
        { wch: 15 }  // Category Count
      ];
      worksheet['!cols'] = columnWidths;

      const fileName = `brands_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      Swal.fire({
        icon: 'success',
        title: 'Export Successful',
        text: `Brands exported to ${fileName}`,
        confirmButtonColor: '#3085d6'
      });
    } catch (error) {
      console.error('Excel export error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'There was an error exporting to Excel. Please try again.',
        confirmButtonColor: '#3085d6'
      });
    }
  }

  exportToPDF(type: 'all' | 'selected' = 'all'): void {
    try {
      const brandsToExport = type === 'selected' ? this.selectedBrands : this.filteredBrands;
      
      if (brandsToExport.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'No Data to Export',
          text: 'There are no brands to export.',
          confirmButtonColor: '#3085d6'
        });
        return;
      }

      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      // Add title
      doc.setFontSize(18);
      doc.text('Brand Management Report', 14, 20);
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.text(`Total Brands: ${brandsToExport.length}`, 14, 40);

      // Prepare table data
      const tableData = brandsToExport.map(brand => [
        brand.id.toString(),
        brand.name,
        brand.categories.map(cat => cat.name).join(', ') || 'N/A',
        brand.categories.length.toString()
      ]);

      // Add table
      (doc as any).autoTable({
        head: [['Brand ID', 'Brand Name', 'Categories', 'Category Count']],
        body: tableData,
        startY: 50,
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [30, 46, 63],
          textColor: 255
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });

      const fileName = `brands_${type}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      Swal.fire({
        icon: 'success',
        title: 'Export Successful',
        text: `Brands exported to ${fileName}`,
        confirmButtonColor: '#3085d6'
      });
    } catch (error) {
      console.error('PDF export error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'There was an error exporting to PDF. Please try again.',
        confirmButtonColor: '#3085d6'
      });
    }
  }

  getCategoryNames(brand: BrandListDTO): string {
    return brand.categories.map(cat => cat.name).join(', ') || 'No categories';
  }

  onImageError(event: Event, brandId: number): void {
    const target = event.target as HTMLImageElement;
    console.log(`Image failed to load for brand ID: ${brandId}, URL: ${target.src}`);
    this.failedImages.add(brandId);
  }

  hasImageFailed(brand: BrandListDTO): boolean {
    return this.failedImages.has(brand.id);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Math utility for template
  get Math() {
    return Math;
  }
}
