import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ReturnService } from '../services/return.service';
import { ReturnRequestDTO } from '../user-order';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
declare var $: any;
declare var lucide: any;

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

  constructor(private returnService: ReturnService) {}

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
    const exportData = (type === 'all' ? this.dataSource.data : this.selectedRows);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Returns');

    // Define columns
    worksheet.columns = [
      { header: 'Order ID', key: 'orderCode', width: 16 },
      { header: 'Date', key: 'requestedAt', width: 18 },
      { header: 'Customer', key: 'userName', width: 22 },
      { header: 'Products', key: 'products', width: 32 },
      { header: 'Reason', key: 'reasonForReturn', width: 22 },
      { header: 'Return Detail', key: 'returnDetail', width: 28 },
      { header: 'Status', key: 'status', width: 14 },
    ];

    // Add rows
    exportData.forEach((row: any) => {
      worksheet.addRow({
        orderCode: row.orderCode ?? '',
        requestedAt: row.requestedAt ? new Date(row.requestedAt).toLocaleDateString() : '',
        userName: row.userName ?? '',
        products: row.products ? row.products.map((p: any) => p.productName).join(', ') : '',
        reasonForReturn: row.reasonForReturn ?? '',
        returnDetail: row.returnDetail ?? '',
        status: row.status ?? ''
      });
    });

    // Style header
    worksheet.getRow(1).eachCell((cell: any) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1976D2' } // Blue
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Style rows (alternating color)
    worksheet.eachRow((row: any, rowNumber: any) => {
      if (rowNumber === 1) return;
      row.eachCell((cell: any) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        if (rowNumber % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F4F6FA' } // Light gray
          };
        }
      });
    });

    workbook.xlsx.writeBuffer().then((buffer: any) => {
      const fileName = type === 'all' ? 'return-requests-all.xlsx' : 'return-requests-selected.xlsx';
      saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName);
    });
  }

  exportPDF(type: 'all' | 'selected') {
    const exportData = (type === 'all' ? this.dataSource.data : this.selectedRows).map((row: any) => [
      String(row.orderCode ?? ''),
      row.requestedAt ? new Date(row.requestedAt).toLocaleDateString() : '',
      String(row.userName ?? ''),
      row.products ? row.products.map((p: any) => p.productName).join(', ') : '',
      String(row.reasonForReturn ?? ''),
      String(row.returnDetail ?? ''),
      String(row.status ?? '')
    ]);
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Order ID', 'Date', 'Customer', 'Product', 'Reason', 'Return Detail', 'Status']],
      body: exportData,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [25, 118, 210], textColor: 255, fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: [244, 246, 250] },
      startY: 20,
      margin: { left: 10, right: 10 },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1
    });
    doc.save(type === 'all' ? 'return-requests-all.pdf' : 'return-requests-selected.pdf');
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
    if (row.products && row.products.length > 0) {
      return row.products.map(p => p.productName).join(', ');
    }
    return '-';
  }
}
