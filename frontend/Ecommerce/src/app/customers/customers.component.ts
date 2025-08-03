import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { ImageService } from '../services/image.service';
import { UserService } from '../services/user.service';
import * as XLSX from 'xlsx'; // For Excel export
import jsPDF from 'jspdf'; // For PDF export
import autoTable from 'jspdf-autotable'; // For PDF table export
import { PermissionService } from '../services/permission.service';
import { PermissionConstants } from '../constants/permission.constants';
import { PriceFormatService } from '../services/price-format.service';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  status: 'active' | 'inactive' | 'suspended';
  joinDate: Date;
  totalOrders: number;
  totalSpent: number;
  addresses: Address[];
}

interface Address {
  type: 'billing' | 'shipping';
  street: string;
  city: string;
  state: string;
  zip: string;
}

@Component({
  selector: 'app-customers',
  standalone: false,
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit {
  // Data properties
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  paginatedCustomers: Customer[] = [];
  selectedCustomers: string[] = [];
  selectedCustomerDetails: Customer | null = null;
  openDropdownId: string | null = null;
  showCustomerModal: boolean = false;
  public PermissionConstants = PermissionConstants;
  public permissionService: PermissionService;
  logDropdownClick(customerId: string) {
    console.log('Dropdown for', customerId);
  }

  // Filter and search properties
  searchTerm: string = '';
  statusFilter: string = '';
  sortBy: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // Stats properties
  totalCustomers: number = 0;
  activeCustomers: number = 0;
  newCustomersThisMonth: number = 0;
  averageOrderValue: number = 0;

  // Utility property for template
  Math = Math;
  viewMode: 'table' | 'cards' = 'table';

  setViewMode(mode: 'table' | 'cards') {
    this.viewMode = mode;
  }

  // --- Export Data (Excel/PDF, All/Selected) ---
  exportDropdownOpen = false;
  excelDropdownOpen = false;
  pdfDropdownOpen = false;

  toggleExportDropdown() {
    this.exportDropdownOpen = !this.exportDropdownOpen;
  }

  exportCustomersExcel(selectedOnly: boolean = false): void {
    // Why: Allow export of all or selected customers as Excel with styled header, title, borders, and colored money column
    const exportData = (selectedOnly && this.selectedCustomers.length > 0)
      ? this.customers.filter(c => this.selectedCustomers.includes(c.id))
      : this.filteredCustomers;
    // Prepare data rows
    const dataRows = exportData.map(c => ([
      c.id,
      c.name,
      c.email,
      c.phone,
      c.status,
      c.joinDate.toLocaleDateString(),
      c.totalOrders,
      c.totalSpent
    ]));
    // Title row
    const title = [["Customer List Export"]];
    // Header row
    const header = [[
      'ID', 'Name', 'Email', 'Phone', 'Status', 'Join Date', 'Total Orders', 'Total Spent'
    ]];
    // Combine all rows
    const wsData = [...title, ...header, ...dataRows];
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(wsData);
    // Merge title row
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];
    // Set column widths
    ws['!cols'] = [
      { wch: 6 },   // ID
      { wch: 18 },  // Name
      { wch: 28 },  // Email
      { wch: 16 },  // Phone
      { wch: 10 },  // Status
      { wch: 14 },  // Join Date
      { wch: 12 },  // Total Orders
      { wch: 14 }   // Total Spent
    ];
    // Style title row (row 1, index 0)
    const titleCell = ws['A1'];
    if (titleCell) {
      titleCell.s = {
        font: { bold: true, sz: 18, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '2980B9' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { top: { style: 'thin', color: { rgb: '000000' } }, bottom: { style: 'thin', color: { rgb: '000000' } }, left: { style: 'thin', color: { rgb: '000000' } }, right: { style: 'thin', color: { rgb: '000000' } } }
      };
    }
    // Style header row (row 2, index 1)
    const headerRow = 1;
    for (let col = 0; col < header[0].length; col++) {
      const cell = ws[XLSX.utils.encode_cell({ r: headerRow, c: col })];
      if (cell) {
        cell.s = {
          font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '34495E' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: { top: { style: 'thin', color: { rgb: '000000' } }, bottom: { style: 'thin', color: { rgb: '000000' } }, left: { style: 'thin', color: { rgb: '000000' } }, right: { style: 'thin', color: { rgb: '000000' } } }
        };
      }
    }
    // Style data rows (center, bold, border; money column green)
    for (let r = 2; r < wsData.length; r++) {
      for (let c = 0; c < header[0].length; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        if (cell) {
          cell.s = {
            font: { bold: true, sz: 12, color: { rgb: c === 7 ? '27AE60' : '000000' } }, // Total Spent column green
            alignment: { horizontal: 'center', vertical: 'center' },
            border: { top: { style: 'thin', color: { rgb: '000000' } }, bottom: { style: 'thin', color: { rgb: '000000' } }, left: { style: 'thin', color: { rgb: '000000' } }, right: { style: 'thin', color: { rgb: '000000' } } }
          };
        }
      }
    }
    // Create workbook and export
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, `customers-${selectedOnly ? 'selected' : 'all'}-${new Date().toISOString().split('T')[0]}.xlsx`, { cellStyles: true });
  }

  exportCustomersPDF(selectedOnly: boolean = false): void {
    // Why: Allow export of all or selected customers as PDF with styled table, title, colored header, centered cells, money column green, and all borders
    const exportData = (selectedOnly && this.selectedCustomers.length > 0)
      ? this.customers.filter(c => this.selectedCustomers.includes(c.id))
      : this.filteredCustomers;
    const doc = new jsPDF();
    // Title row
    doc.setFontSize(18);
    doc.setTextColor(41, 128, 185);
    doc.setFont('helvetica', 'bold'); // Fix: use valid font string
    const pageWidth = doc.internal.pageSize.getWidth();
    const title = 'Customer List Export';
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, 18);
    // Table
    autoTable(doc, {
      startY: 24,
      head: [[
        'ID', 'Name', 'Email', 'Phone', 'Status', 'Join Date', 'Total Orders', 'Total Spent'
      ]],
      body: exportData.map(c => [
        c.id,
        c.name,
        c.email,
        c.phone,
        c.status,
        c.joinDate.toLocaleDateString(),
        c.totalOrders,
        c.totalSpent
      ]),
      styles: {
        fontSize: 12,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        cellPadding: 3,
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [52, 73, 94], // dark blue-gray
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 14,
        halign: 'center',
        valign: 'middle',
      },
      bodyStyles: {
        fontSize: 12,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
      },
      columnStyles: {
        7: { textColor: [39, 174, 96] } // Total Spent column green
      },
      didParseCell: (data) => {
        // Add border to all cells
        data.cell.styles.lineWidth = 0.5;
        data.cell.styles.lineColor = [0, 0, 0];
      },
      margin: { top: 24 },
      tableLineWidth: 0.5,
      tableLineColor: [0, 0, 0],
      theme: 'grid',
      didDrawPage: (data) => {
        // Center table on page (type guard for width)
        const table = data.table as any;
        const tableWidth = table && table.width ? table.width : 0;
        const pageWidth = doc.internal.pageSize.getWidth();
        if (table && table.body && table.body.length > 0 && typeof tableWidth === 'number') {
          table.x = (pageWidth - tableWidth) / 2;
        }
      }
    });
    doc.save(`customers-${selectedOnly ? 'selected' : 'all'}-${new Date().toISOString().split('T')[0]}.pdf`);
  }
  // --- End Export Data ---

  // --- Export Dropdown Logic ---
  toggleExcelDropdown() {
    this.excelDropdownOpen = !this.excelDropdownOpen;
    this.pdfDropdownOpen = false;
  }
  togglePdfDropdown() {
    this.pdfDropdownOpen = !this.pdfDropdownOpen;
    this.excelDropdownOpen = false;
  }
  closeAllDropdowns() {
    this.exportDropdownOpen = false;
    this.excelDropdownOpen = false;
    this.pdfDropdownOpen = false;
  }
  onDocumentClick(event: MouseEvent) {
    // Close dropdowns if click is outside
    this.closeAllDropdowns();
  }
  // --- End Export Dropdown Logic ---

  constructor(
    public imageService: ImageService,
    private userService: UserService,
    permissionService: PermissionService,
    private priceFormatService: PriceFormatService
  ) {
    this.permissionService = permissionService;
  }

  ngOnInit(): void {
    this.loadCustomers();
  }

  // ngAfterViewChecked() {
  //   if ((window as any)['lucide']) {
  //     (window as any)['lucide'].createIcons();
  //   }
  // }

  loadCustomers(): void {
    this.userService.getCustomers().subscribe((data: any[]) => {
      this.customers = data.map(c => ({
        id: c.userId?.toString() ?? '',
        name: c.name || '',
        email: c.email,
        phone: c.phoneNumber,
        avatar: c.profileImage ? this.imageService.getFullImageUrl(c.profileImage) : this.imageService.generateAvatarWithInitials(c.name || c.email),
        status: c.status?.toLowerCase() ?? 'active',
        joinDate: c.joinDate ? new Date(c.joinDate) : new Date(),
        totalOrders: c.totalOrders,
        totalSpent: c.totalSpent,
        addresses: []
      }));
      this.calculateStats();
      this.applyFilters();
    });
  }

  calculateStats(): void {
    this.totalCustomers = this.customers.length;
    this.activeCustomers = this.customers.filter(c => c.status === 'active').length;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    this.newCustomersThisMonth = this.customers.filter(c => 
      c.joinDate.getMonth() === currentMonth && c.joinDate.getFullYear() === currentYear
    ).length;

    const totalSpent = this.customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalOrders = this.customers.reduce((sum, c) => sum + c.totalOrders, 0);
    this.averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredCustomers = this.customers.filter(customer => {
      const matchesSearch = !this.searchTerm || 
        customer.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        customer.id.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus = !this.statusFilter || customer.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });

    this.applySorting();
  }

  applySorting(): void {
    this.filteredCustomers.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (this.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'joinDate':
          aValue = a.joinDate.getTime();
          bValue = b.joinDate.getTime();
          break;
        case 'orders':
          aValue = a.totalOrders;
          bValue = b.totalOrders;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCustomers.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedCustomers = this.filteredCustomers.slice(startIndex, endIndex);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.sortBy = 'name';
    this.currentPage = 1;
    this.applyFilters();
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Selection methods
  selectAll(event: any): void {
    if (event.target.checked) {
      this.selectedCustomers = this.paginatedCustomers.map(c => c.id);
    } else {
      this.selectedCustomers = [];
    }
  }

  toggleCustomerSelection(customerId: string, event: any): void {
    if (event.target.checked) {
      this.selectedCustomers.push(customerId);
    } else {
      this.selectedCustomers = this.selectedCustomers.filter(id => id !== customerId);
    }
  }

  // --- Customer management actions ---
  // View customer details (shows alert for now, replace with modal in production)
  viewCustomerDetails(customer: Customer): void {
    this.userService.getUserById(customer.id).subscribe(
      (user: any) => {
        this.selectedCustomerDetails = {
          ...customer,
          ...user
        };
        this.showCustomerModal = true;
      },
      err => {
        window.alert('Failed to load customer details.');
      }
    );
  }
  closeCustomerModal(): void {
    this.showCustomerModal = false;
    this.selectedCustomerDetails = null;
  }

  // Edit customer (stub, show alert for now)
  editCustomer(customer: Customer): void {
    // In production, open a modal with a form and call updateUser on save
    window.alert('Edit customer feature coming soon!');
  }

  // Activate/deactivate customer (calls backend and updates UI)
  toggleCustomerStatus(customer: Customer): void {
    const newStatus = customer.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    this.userService.updateUserStatus(customer.id, newStatus).subscribe(
      () => {
        // Fix: ensure status is set to correct union type
        customer.status = newStatus === 'ACTIVE' ? 'active' : 'inactive';
        this.calculateStats();
        window.alert(`Customer status updated to ${newStatus}.`);
      },
      err => {
        window.alert('Failed to update customer status.');
      }
    );
  }

  // Delete customer (calls backend and updates UI)
  deleteCustomer(customer: Customer): void {
    if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
      this.userService.deleteUser(customer.id).subscribe(
        () => {
          this.customers = this.customers.filter(c => c.id !== customer.id);
          this.applyFilters();
          this.calculateStats();
          window.alert('Customer deleted successfully.');
        },
        err => {
          window.alert('Failed to delete customer.');
        }
      );
    }
  }
  // --- End customer management actions ---

  // Utility methods
  exportCustomers(): void {
    const csvContent = this.generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private generateCSV(): string {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Status', 'Join Date', 'Total Orders', 'Total Spent'];
    const rows = this.filteredCustomers.map(customer => [
      customer.id,
      customer.name,
      customer.email,
      customer.phone,
      customer.status,
      customer.joinDate.toISOString().split('T')[0],
      customer.totalOrders.toString(),
      customer.totalSpent.toString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  refreshData(): void {
    this.loadCustomers();
    this.calculateStats();
    console.log('Data refreshed');
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 30) return `${diffInDays} days ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  }

  trackByCustomerId(index: number, customer: Customer): string {
    return customer.id;
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

  // Number formatting methods with thousand separators
  formatNumberWithSeparator(value: number): string {
    if (value === null || value === undefined) return '0';
    return Math.round(value).toLocaleString('en-US');
  }

  formatDecimalWithSeparator(value: number, decimals: number = 2): string {
    if (value === null || value === undefined) return '0.00';
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  formatCurrencyWithSeparator(value: number, currency: string = 'MMK'): string {
    if (value === null || value === undefined) return `0 ${currency}`;
    const formatted = Math.round(value).toLocaleString('en-US');
    return `${formatted} ${currency}`;
  }

  // Modal scroll helper method
  scrollModalToTop(): void {
    const modalContent = document.querySelector('.scrollbar-hide') as HTMLElement;
    if (modalContent) {
      modalContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Modal scroll helper method
  scrollModalToBottom(): void {
    const modalContent = document.querySelector('.scrollbar-hide') as HTMLElement;
    if (modalContent) {
      modalContent.scrollTo({ top: modalContent.scrollHeight, behavior: 'smooth' });
    }
  }
}