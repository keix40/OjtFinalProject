import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrandService } from '../services/brand.service';
import { BrandListDTO, BrandDTO } from '../brand';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateBrandComponent } from '../create-brand/create-brand.component';
import Swal from 'sweetalert2';
import { LuxDialogService } from '../shared/dialog/lux-dialog.service';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { BrandUpdateComponent } from '../brand-update/brand-update.component';
import { PermissionService } from '../services/permission.service';
import { PermissionConstants } from '../constants/permission.constants';
import { SelectionStore } from '../core/state/selection-store';

@Component({
  selector: 'app-brand-list',
  standalone: false,
  templateUrl: './brand-list.component.html',
  styleUrl: './brand-list.component.css',
  providers: [SelectionStore],
})
export class BrandListComponent implements OnInit, AfterViewInit, OnDestroy {
  brands: BrandListDTO[] = [];
  filteredBrands: BrandListDTO[] = [];
  loading = false;
  searchTerm = '';
  /** 0-based page for lux-paginator */
  currentPage = 0;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;

  failedImages = new Set<number>();
  csvDropdownOpen = false;
  pdfDropdownOpen = false;
  isBrandModalOpen = false;

  constructor(
    private brandService: BrandService,
    private modalService: NgbModal,
    public permissionService: PermissionService,
    private luxDialog: LuxDialogService,
    public selection: SelectionStore<number>
  ) {}
  public PermissionConstants = PermissionConstants;

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
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage) || 0;
        this.currentPage = 0;
        this.selection.clear();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading brands:', err);
        this.loading = false;
        this.luxDialog.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load brands. Please try again.',
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

  getBrandTone(brand: BrandListDTO): string {
    const tones = [
      'var(--lux-champagne-soft)',
      'rgba(95,115,85,.18)',
      'rgba(74,90,102,.18)',
      'rgba(158,74,67,.15)',
      'rgba(176,130,52,.18)',
    ];
    const name = brand.name?.toString() || '';
    const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return tones[charCodeSum % tones.length];
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredBrands = [...this.brands];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredBrands = this.brands.filter(
        (brand) =>
          brand.name.toLowerCase().includes(searchLower) ||
          brand.categories.some((cat) => cat.name.toLowerCase().includes(searchLower))
      );
    }
    this.totalItems = this.filteredBrands.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage) || 0;
    this.currentPage = 0;
  }

  get paginatedBrands(): BrandListDTO[] {
    const startIndex = this.currentPage * this.itemsPerPage;
    return this.filteredBrands.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get pageIds(): number[] {
    return this.paginatedBrands.map((b) => b.id);
  }

  get selectedCount(): number {
    return this.selection.count();
  }

  get selectedBrands(): BrandListDTO[] {
    const ids = new Set(this.selection.ids());
    return this.filteredBrands.filter((b) => ids.has(b.id));
  }

  get allPageSelected(): boolean {
    return this.selection.isPageAllSelected(this.pageIds);
  }

  get partialPageSelected(): boolean {
    return this.selection.isPagePartialSelected(this.pageIds);
  }

  isRowSelected = (row: unknown): boolean =>
    this.selection.isSelected((row as BrandListDTO).id);

  trackById = (_i: number, row: unknown): number => (row as BrandListDTO).id;

  onToggleAll(checked: boolean): void {
    this.selection.setPage(this.pageIds, checked);
  }

  onToggleRow(event: { row: unknown; checked: boolean }): void {
    this.selection.toggle((event.row as BrandListDTO).id, event.checked);
  }

  onPageChange(page: number): void {
    if (page < 0 || (this.totalPages > 0 && page >= this.totalPages)) return;
    this.currentPage = page;
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
        this.luxDialog.fire({
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
        this.luxDialog.fire({
          icon: 'success',
          title: 'Success',
          text: 'Brand updated successfully!',
          timer: 2000,
          showConfirmButton: false
        });
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  async deleteBrand(brand: BrandListDTO): Promise<void> {
    const confirmed = await this.luxDialog.confirm({
      title: 'Delete Brand',
      text: `Are you sure you want to delete "${brand.name}"? This action cannot be undone.`,
      confirmText: 'Yes, delete it!',
      destructive: true
    });
    if (!confirmed) return;

    this.brandService.deleteBrand(brand.id).subscribe({
      next: () => {
        this.loadBrands();
        this.luxDialog.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Brand has been deleted successfully.',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (err) => {
        console.error('Error deleting brand:', err);
        this.luxDialog.error('Error', 'Failed to delete brand. Please try again.');
      }
    });
  }

  // Export functionality using Jasper Reports
  toggleCsvDropdown(): void {
    this.csvDropdownOpen = !this.csvDropdownOpen;
    if (this.csvDropdownOpen) {
      this.pdfDropdownOpen = false;
    }
  }

  togglePdfDropdown(): void {
    this.pdfDropdownOpen = !this.pdfDropdownOpen;
    if (this.pdfDropdownOpen) {
      this.csvDropdownOpen = false;
    }
  }

  exportToPDF(type: 'all' | 'selected' = 'all'): void {
    try {
      const brandsToExport = type === 'selected' ? this.selectedBrands : this.filteredBrands;
      
      if (brandsToExport.length === 0) {
        this.luxDialog.fire({
          icon: 'warning',
          title: 'No Data to Export',
          text: 'There are no brands to export.',
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
        const brandIds = this.selectedBrands.map(brand => brand.id);
        this.brandService.exportSelectedBrandsToPDF(brandIds).subscribe({
          next: (blob: Blob) => {
            console.log('✓ Brand PDF export successful. Blob size:', blob.size, 'bytes');
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Britium_Gallery_Brand_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);

            this.luxDialog.fire({
              icon: 'success',
              title: 'Export Successful!',
              text: 'Brand report has been exported successfully.',
              timer: 3000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('❌ Brand PDF export error:', error);
            this.luxDialog.fire({
              icon: 'error',
              title: 'Export Failed',
              text: 'There was an error exporting the brand report to PDF. Please try again.',
            });
          }
        });
      } else {
        this.brandService.exportBrandReportToPDF().subscribe({
          next: (blob: Blob) => {
            console.log('✓ Brand PDF export successful. Blob size:', blob.size, 'bytes');
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Britium_Gallery_Brand_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);

            this.luxDialog.fire({
              icon: 'success',
              title: 'Export Successful!',
              text: 'Brand report has been exported successfully.',
              timer: 3000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('❌ Brand PDF export error:', error);
            this.luxDialog.fire({
              icon: 'error',
              title: 'Export Failed',
              text: 'There was an error exporting the brand report to PDF. Please try again.',
            });
          }
        });
      }
    } catch (error) {
      console.error('Brand PDF export error:', error);
      this.luxDialog.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'There was an error exporting to PDF. Please try again.',
      });
    }
  }

  exportToCSV(type: 'all' | 'selected' = 'all'): void {
    try {
      const brandsToExport = type === 'selected' ? this.selectedBrands : this.filteredBrands;
      
      if (brandsToExport.length === 0) {
        this.luxDialog.fire({
          icon: 'warning',
          title: 'No Data to Export',
          text: 'There are no brands to export.',
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
        const brandIds = this.selectedBrands.map(brand => brand.id);
        this.brandService.exportSelectedBrandsToCSV(brandIds).subscribe({
          next: (blob: Blob) => {
            console.log('✓ Brand CSV export successful. Blob size:', blob.size, 'bytes');
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Britium_Gallery_Brand_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);

            this.luxDialog.fire({
              icon: 'success',
              title: 'Export Successful!',
              text: 'Brand report has been exported successfully.',
              timer: 3000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('❌ Brand CSV export error:', error);
            this.luxDialog.fire({
              icon: 'error',
              title: 'Export Failed',
              text: 'There was an error exporting the brand report to CSV. Please try again.',
            });
          }
        });
      } else {
        this.brandService.exportBrandReportToCSV().subscribe({
          next: (blob: Blob) => {
            console.log('✓ Brand CSV export successful. Blob size:', blob.size, 'bytes');
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Britium_Gallery_Brand_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);

            this.luxDialog.fire({
              icon: 'success',
              title: 'Export Successful!',
              text: 'Brand report has been exported successfully.',
              timer: 3000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('❌ Brand CSV export error:', error);
            this.luxDialog.fire({
              icon: 'error',
              title: 'Export Failed',
              text: 'There was an error exporting the brand report to CSV. Please try again.',
            });
          }
        });
      }
    } catch (error) {
      console.error('Brand CSV export error:', error);
      this.luxDialog.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'There was an error exporting to CSV. Please try again.',
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
}
