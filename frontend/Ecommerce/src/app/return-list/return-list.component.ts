import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ReturnService } from '../services/return.service';
import { ReturnRequestDTO } from '../user-order';
import { PriceFormatService } from '../services/price-format.service';
import { SelectionStore } from '../core/state/selection-store';
import { LuxDialogService } from '../shared/dialog/lux-dialog.service';

declare var lucide: any;

@Component({
  selector: 'app-return-list',
  standalone: false,
  templateUrl: './return-list.component.html',
  styleUrl: './return-list.component.css',
  providers: [SelectionStore],
})
export class ReturnListComponent implements OnInit, AfterViewInit, OnDestroy {
  returns: ReturnRequestDTO[] = [];

  pageSize = 10;
  /** 0-based */
  currentPage = 0;

  statusFilter = 'All';
  sortBy = 'Newest';
  searchText = '';
  isLoading = false;

  statusOptions: string[] = ['All'];
  sortOptions = [
    { value: 'Newest', label: 'Newest' },
    { value: 'Oldest', label: 'Oldest' },
  ];

  showExcelDropdown = false;
  showPdfDropdown = false;

  showDetailModal = false;
  selectedRequest: ReturnRequestDTO | null = null;
  adminDecision = '';

  constructor(
    private returnService: ReturnService,
    private priceFormatService: PriceFormatService,
    public selection: SelectionStore<number>,
    private dialog: LuxDialogService
  ) {}

  ngOnInit() {
    this.fetchReturns();
    document.addEventListener('click', this.handleDocumentClick);
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.handleDocumentClick);
  }

  private handleDocumentClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    if (!target.closest('.admin-export')) {
      this.showExcelDropdown = false;
      this.showPdfDropdown = false;
    }
  };

  private refreshIcons(): void {
    setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).lucide) {
        (window as any).lucide.createIcons();
      } else if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }, 0);
  }

  get filteredReturns(): ReturnRequestDTO[] {
    let filtered = [...this.returns];
    if (this.statusFilter !== 'All') {
      filtered = filtered.filter((r) => r.status === this.statusFilter);
    }
    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(
        (r: any) =>
          (r.userName || '').toLowerCase().includes(search) ||
          (r.products &&
            r.products
              .map((p: any) => p.productName)
              .join(', ')
              .toLowerCase()
              .includes(search)) ||
          (r.reasonForReturn || '').toLowerCase().includes(search) ||
          (r.orderCode || '').toLowerCase().includes(search) ||
          r.id.toString().includes(search)
      );
    }
    filtered.sort((a: any, b: any) => {
      const diff =
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
      return this.sortBy === 'Newest' ? diff : -diff;
    });
    return filtered;
  }

  get paginatedReturns(): ReturnRequestDTO[] {
    const start = this.currentPage * this.pageSize;
    return this.filteredReturns.slice(start, start + this.pageSize);
  }

  get totalItems(): number {
    return this.filteredReturns.length;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredReturns.length / this.pageSize) || 0;
  }

  get pageIds(): number[] {
    return this.paginatedReturns.map((r) => r.id);
  }

  get allPageSelected(): boolean {
    return this.selection.isPageAllSelected(this.pageIds);
  }

  get partialPageSelected(): boolean {
    return this.selection.isPagePartialSelected(this.pageIds);
  }

  get selectedRows(): ReturnRequestDTO[] {
    const ids = new Set(this.selection.ids());
    return this.returns.filter((r) => ids.has(r.id));
  }

  isRowSelected = (row: unknown): boolean =>
    this.selection.isSelected((row as ReturnRequestDTO).id);

  trackByReturn = (_: number, row: unknown) => (row as ReturnRequestDTO).id;

  onToggleAll(checked: boolean): void {
    this.selection.setPage(this.pageIds, checked);
  }

  onToggleRow(event: { row: unknown; checked: boolean }): void {
    this.selection.toggle((event.row as ReturnRequestDTO).id, event.checked);
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.refreshIcons();
  }

  toggleExcelDropdown() {
    this.showExcelDropdown = !this.showExcelDropdown;
    if (this.showExcelDropdown) this.showPdfDropdown = false;
  }

  togglePdfDropdown() {
    this.showPdfDropdown = !this.showPdfDropdown;
    if (this.showPdfDropdown) this.showExcelDropdown = false;
  }

  fetchReturns() {
    this.isLoading = true;
    this.returnService.getAllReturn().subscribe({
      next: (data) => {
        this.returns = data;
        const statuses = Array.from(
          new Set(data.map((r: any) => r.status).filter((s: any) => !!s))
        );
        this.statusOptions = ['All', ...statuses];
        this.isLoading = false;
        this.currentPage = 0;
        this.refreshIcons();
      },
      error: () => {
        this.isLoading = false;
        this.dialog.error('Error', 'Failed to load return requests.');
      },
    });
  }

  onStatusFilterChange() {
    this.currentPage = 0;
  }

  onSortChange() {
    this.currentPage = 0;
  }

  onSearchChange() {
    this.currentPage = 0;
  }

  clearFilters(): void {
    this.statusFilter = 'All';
    this.sortBy = 'Newest';
    this.searchText = '';
    this.currentPage = 0;
  }

  statusTone(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
    switch ((status || '').toLowerCase()) {
      case 'approved':
        return 'success';
      case 'rejected':
      case 'cancelled':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'info';
    }
  }

  async exportExcel(type: 'all' | 'selected') {
    const returnsToExport = type === 'all' ? this.filteredReturns : this.selectedRows;
    if (returnsToExport.length === 0) {
      await this.dialog.warning('No Data to Export', 'There are no return requests to export.');
      return;
    }

    if (type === 'selected') {
      const returnIds = this.selectedRows.map((r) => r.id);
      this.returnService.exportSelectedReturnsToCSV(returnIds).subscribe({
        next: (blob: Blob) => this.downloadBlob(blob, 'csv'),
        error: () =>
          this.dialog.error('Export Failed', 'There was an error exporting the return report to CSV.'),
      });
    } else {
      this.returnService.exportReturnReportToCSV().subscribe({
        next: (blob: Blob) => this.downloadBlob(blob, 'csv'),
        error: () =>
          this.dialog.error('Export Failed', 'There was an error exporting the return report to CSV.'),
      });
    }
  }

  async exportPDF(type: 'all' | 'selected') {
    const returnsToExport = type === 'all' ? this.filteredReturns : this.selectedRows;
    if (returnsToExport.length === 0) {
      await this.dialog.warning('No Data to Export', 'There are no return requests to export.');
      return;
    }

    if (type === 'selected') {
      const returnIds = this.selectedRows.map((r) => r.id);
      this.returnService.exportSelectedReturnsToPDF(returnIds).subscribe({
        next: (blob: Blob) => this.downloadBlob(blob, 'pdf'),
        error: () =>
          this.dialog.error('Export Failed', 'There was an error exporting the return report to PDF.'),
      });
    } else {
      this.returnService.exportReturnReportToPDF().subscribe({
        next: (blob: Blob) => this.downloadBlob(blob, 'pdf'),
        error: () =>
          this.dialog.error('Export Failed', 'There was an error exporting the return report to PDF.'),
      });
    }
  }

  private downloadBlob(blob: Blob, kind: 'csv' | 'pdf') {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Britium_Gallery_Return_Report_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, '-')}.${kind}`;
    link.click();
    window.URL.revokeObjectURL(url);
    this.dialog.toast('Return report exported');
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
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    return `http://localhost:8080${img}`;
  }

  getProductNames(row: ReturnRequestDTO): string {
    if (!row.products || row.products.length === 0) return 'No products';
    return row.products.map((p: any) => p.productName).join(', ');
  }

  formatPrice(price: number, currency: string = 'MMK'): string {
    return this.priceFormatService.formatPrice(price, currency);
  }

  formatPriceOnly(price: number): string {
    return this.priceFormatService.formatPriceOnly(price);
  }

  formatDiscountedPrice(
    originalPrice: number,
    discountValue: number,
    discountType: string,
    currency: string = 'MMK'
  ): string {
    return this.priceFormatService.formatDiscountedPrice(
      originalPrice,
      discountValue,
      discountType,
      currency
    );
  }

  formatDiscountText(discountValue: number, discountType: string): string {
    return this.priceFormatService.formatDiscountText(discountValue, discountType);
  }
}
