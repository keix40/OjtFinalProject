import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ReturnService } from '../services/return.service';
import { ReturnRequestDTO } from '../user-order';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { PriceFormatService } from '../services/price-format.service';
declare var $: any;
declare var lucide: any;
import Swal from 'sweetalert2';

interface RefundRequest {
  returnRequestId: number;
  refundAmount: number;
  refundMethod: string;
  adminRemark?: string;
}

@Component({
  selector: 'app-return-list',
  standalone: false,
  templateUrl: './return-list.component.html',
  styleUrl: './return-list.component.css'
})
export class ReturnListComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = ['id', 'date', 'customer', 'product', 'reason', 'returnDetail', 'status', 'actions'];
  dataSource = new MatTableDataSource<ReturnRequestDTO>([]);

  // Pagination
  pageSize: number = 10;
  currentPage: number = 1;
  // Returns after all filters (status, search, sort) applied
  get filteredReturns(): ReturnRequestDTO[] {
    let filtered = this.dataSource.data;
    if (this.statusFilter !== 'All') {
      filtered = filtered.filter((r: any) => r.status === this.statusFilter);
    }
    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter((r: any) =>
        r.userName.toLowerCase().includes(search) ||
        (r.products && r.products.map((p: any) => p.productName).join(', ').toLowerCase().includes(search)) ||
        r.reasonForReturn.toLowerCase().includes(search) ||
        r.id.toString().includes(search)
      );
    }
    if (this.sortBy === 'Newest') {
      filtered = filtered.sort((a: any, b: any) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    } else {
      filtered = filtered.sort((a: any, b: any) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime());
    }
    return filtered;
  }

  get paginatedReturns(): ReturnRequestDTO[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredReturns.slice(start, start + this.pageSize);
  }
  get totalItems(): number {
    return this.filteredReturns.length;
  }
  get showingFrom(): number {
    return this.totalItems === 0 ? 0 : (this.pageSize * (this.currentPage - 1)) + 1;
  }
  get showingTo(): number {
    return Math.min(this.pageSize * this.currentPage, this.totalItems);
  }
  get showPagination(): boolean {
    return this.totalPages > 1;
  }
  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      setTimeout(() => {
        if (typeof window !== 'undefined' && (window as any).lucide) {
          (window as any).lucide.createIcons();
        } else if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }, 0);
    }
  }
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      setTimeout(() => {
        if (typeof window !== 'undefined' && (window as any).lucide) {
          (window as any).lucide.createIcons();
        } else if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }, 0);
    }
  }
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      setTimeout(() => {
        if (typeof window !== 'undefined' && (window as any).lucide) {
          (window as any).lucide.createIcons();
        } else if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }, 0);
    }
  }
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      setTimeout(() => {
        if (typeof window !== 'undefined' && (window as any).lucide) {
          (window as any).lucide.createIcons();
        } else if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }, 0);
    }
  }

  statusFilter: string = 'All';
  sortBy: string = 'Newest';
  searchText: string = '';
  isLoading = false;

  statusOptions: string[] = ['All']; // Will be updated dynamically
  sortOptions = [
    { value: 'Newest', label: 'Newest' },
    { value: 'Oldest', label: 'Oldest' }
  ];

  selectedRows: ReturnRequestDTO[] = [];

  private dataTable: any;

  showDetailModal = false;
  selectedRequest: ReturnRequestDTO | null = null;
  adminDecision: string = '';

  // Dropdown toggles for export buttons
  showExcelDropdown: boolean = false;
  showPdfDropdown: boolean = false;

  toggleExcelDropdown() {
    this.showExcelDropdown = !this.showExcelDropdown;
    if (this.showExcelDropdown) {
      this.showPdfDropdown = false;
    }
  }

  togglePdfDropdown() {
    this.showPdfDropdown = !this.showPdfDropdown;
    if (this.showPdfDropdown) {
      this.showExcelDropdown = false;
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredReturns.length / this.pageSize);
  }

  constructor(
    private returnService: ReturnService,
    private priceFormatService: PriceFormatService
  ) {}

  ngOnInit() {
    this.fetchReturns();
  }

  ngAfterViewInit() {
    // DataTables removed
  }

  ngOnDestroy() {
    // DataTables removed
  }

  fetchReturns() {
    this.isLoading = true;
    this.returnService.getAllReturn().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        // Dynamically extract unique statuses from data
        const statuses = Array.from(new Set(data.map((r: any) => r.status).filter((s: any) => !!s)));
        this.statusOptions = ['All', ...statuses];
        this.isLoading = false;
        this.currentPage = 1; // Reset to first page on fetch
      },
      error: () => { this.isLoading = false; }
    });
  }

  applyFilters() {
    let filtered = this.dataSource.data;
    if (this.statusFilter !== 'All') {
      filtered = filtered.filter((r: any) => r.status === this.statusFilter);
    }
    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter((r: any) =>
        r.userName.toLowerCase().includes(search) ||
        r.productName.toLowerCase().includes(search) ||
        r.reasonForReturn.toLowerCase().includes(search) ||
        r.id.toString().includes(search)
      );
    }
    if (this.sortBy === 'Newest') {
      filtered = filtered.sort((a: any, b: any) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    } else {
      filtered = filtered.sort((a: any, b: any) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime());
    }
    this.dataSource.data = filtered;
  }

  onStatusFilterChange() {
    this.currentPage = 1;
  }

  onSortChange() {
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  isSelected(row: ReturnRequestDTO): boolean {
    return this.selectedRows.some(r => r.id === row.id);
  }

  toggleRow(row: ReturnRequestDTO, event: any) {
    if (event.target.checked) {
      if (!this.isSelected(row)) {
        this.selectedRows.push(row);
      }
    } else {
      this.selectedRows = this.selectedRows.filter(r => r.id !== row.id);
    }
  }

  isAllSelected(): boolean {
    return this.dataSource.data.length > 0 && this.selectedRows.length === this.dataSource.data.length;
  }

  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.selectedRows = [...this.dataSource.data];
    } else {
      this.selectedRows = [];
    }
  }

  exportExcel(type: 'all' | 'selected') {
    try {
      const returnsToExport = type === 'all' ? this.dataSource.data : this.selectedRows;
      
      if (returnsToExport.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'No Data to Export',
          text: 'There are no return requests to export.',
          confirmButtonColor: '#3085d6'
        });
        return;
      }

      // Show loading
      Swal.fire({
        title: 'Generating CSV Report...',
        text: 'Please wait while we prepare your report.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      if (type === 'selected') {
        const returnIds = this.selectedRows.map(returnRequest => returnRequest.id);
        this.returnService.exportSelectedReturnsToCSV(returnIds).subscribe({
          next: (blob: Blob) => {
            console.log('✓ Return CSV export successful. Blob size:', blob.size, 'bytes');
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Britium_Gallery_Return_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);

            Swal.fire({
              icon: 'success',
              title: 'Export Successful!',
              text: 'Return report has been exported successfully.',
              timer: 3000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('❌ Return CSV export error:', error);
            Swal.fire({
              icon: 'error',
              title: 'Export Failed',
              text: 'There was an error exporting the return report to CSV. Please try again.',
              confirmButtonColor: '#3085d6'
            });
          }
        });
      } else {
        this.returnService.exportReturnReportToCSV().subscribe({
          next: (blob: Blob) => {
            console.log('✓ Return CSV export successful. Blob size:', blob.size, 'bytes');
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Britium_Gallery_Return_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);

            Swal.fire({
              icon: 'success',
              title: 'Export Successful!',
              text: 'Return report has been exported successfully.',
              timer: 3000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('❌ Return CSV export error:', error);
            Swal.fire({
              icon: 'error',
              title: 'Export Failed',
              text: 'There was an error exporting the return report to CSV. Please try again.',
              confirmButtonColor: '#3085d6'
            });
          }
        });
      }
    } catch (error) {
      console.error('Return CSV export error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'There was an error exporting to CSV. Please try again.',
        confirmButtonColor: '#3085d6'
      });
    }
  }

  exportPDF(type: 'all' | 'selected') {
    try {
      const returnsToExport = type === 'all' ? this.dataSource.data : this.selectedRows;
      
      if (returnsToExport.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'No Data to Export',
          text: 'There are no return requests to export.',
          confirmButtonColor: '#3085d6'
        });
        return;
      }

      // Show loading
      Swal.fire({
        title: 'Generating PDF Report...',
        text: 'Please wait while we prepare your report.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      if (type === 'selected') {
        const returnIds = this.selectedRows.map(returnRequest => returnRequest.id);
        this.returnService.exportSelectedReturnsToPDF(returnIds).subscribe({
          next: (blob: Blob) => {
            console.log('✓ Return PDF export successful. Blob size:', blob.size, 'bytes');
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Britium_Gallery_Return_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);

            Swal.fire({
              icon: 'success',
              title: 'Export Successful!',
              text: 'Return report has been exported successfully.',
              timer: 3000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('❌ Return PDF export error:', error);
            Swal.fire({
              icon: 'error',
              title: 'Export Failed',
              text: 'There was an error exporting the return report to PDF. Please try again.',
              confirmButtonColor: '#3085d6'
            });
          }
        });
      } else {
        this.returnService.exportReturnReportToPDF().subscribe({
          next: (blob: Blob) => {
            console.log('✓ Return PDF export successful. Blob size:', blob.size, 'bytes');
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Britium_Gallery_Return_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);

            Swal.fire({
              icon: 'success',
              title: 'Export Successful!',
              text: 'Return report has been exported successfully.',
              timer: 3000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('❌ Return PDF export error:', error);
            Swal.fire({
              icon: 'error',
              title: 'Export Failed',
              text: 'There was an error exporting the return report to PDF. Please try again.',
              confirmButtonColor: '#3085d6'
            });
          }
        });
      }
    } catch (error) {
      console.error('Return PDF export error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'There was an error exporting to PDF. Please try again.',
        confirmButtonColor: '#3085d6'
      });
    }
  }

  onExportOption(event: Event) {
    const select = event.target as HTMLSelectElement;
    const option = select && select.value ? select.value : '';
    switch (option) {
      case 'excel-all':
        this.exportExcel('all');
        break;
      case 'excel-selected':
        if (this.selectedRows.length > 0) this.exportExcel('selected');
        break;
      case 'pdf-all':
        this.exportPDF('all');
        break;
      case 'pdf-selected':
        if (this.selectedRows.length > 0) this.exportPDF('selected');
        break;
    }
    // Reset dropdown (if needed)
    if (select) select.selectedIndex = 0;
  }

  onDatatableSelect({ selected }: { selected: ReturnRequestDTO[] }) {
    this.selectedRows = [...selected];
  }

  private initDataTable() {
    setTimeout(() => {
      this.dataTable = ($('#returnsTable') as any).DataTable({
        paging: true,
        searching: true,
        ordering: true,
        responsive: true
      });
    }, 0);
  }

  openDetailModal(request: ReturnRequestDTO) {
    this.selectedRequest = request;
    this.adminDecision = '';
    this.showDetailModal = true;
  }
  
  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedRequest = null;
    this.adminDecision = '';
  }

  getImageUrl(img: string): string {
    if (!img) return '';
    // If already absolute, return as is
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    // Otherwise, prepend the base URL
    return `http://localhost:8080${img}`;
  }

  getProductNames(row: ReturnRequestDTO): string {
    if (!row.products || row.products.length === 0) return 'No products';
    return row.products.map((p: any) => p.productName).join(', ');
  }

  // Price formatting methods
  formatPrice(price: number, currency: string = 'MMK'): string {
    return this.priceFormatService.formatPrice(price, currency);
  }

  formatPriceOnly(price: number): string {
    return this.priceFormatService.formatPriceOnly(price);
  }

  formatDiscountedPrice(originalPrice: number, discountValue: number, discountType: string, currency: string = 'MMK'): string {
    return this.priceFormatService.formatDiscountedPrice(originalPrice, discountValue, discountType, currency);
  }

  formatDiscountText(discountValue: number, discountType: string): string {
    return this.priceFormatService.formatDiscountText(discountValue, discountType);
  }
}
