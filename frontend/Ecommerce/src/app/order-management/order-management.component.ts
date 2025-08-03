import { Component, OnInit, AfterViewInit } from '@angular/core';
import { OrderService } from '../services/order.service';
import { UserOrderListDTO } from '../user-order';
import { AuthService } from '../auth/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
declare var $: any;
declare var lucide: any;
import { OrderInvoiceComponent } from '../order-invoice/order-invoice.component';
import { PermissionService } from '../services/permission.service';
import { PermissionConstants } from '../constants/permission.constants';
import { DiscountService } from '../services/discount.service';
import { PriceFormatService } from '../services/price-format.service';

// Extended interface to include checked property for selection
interface OrderWithSelection extends UserOrderListDTO {
  checked: boolean;
}

@Component({
  selector: 'app-order-management',
  standalone: false,
  templateUrl: './order-management.component.html',
  styleUrl: './order-management.component.css'
})
export class OrderManagementComponent implements OnInit, AfterViewInit {
  orders: OrderWithSelection[] = [];
  filteredOrders: OrderWithSelection[] = [];
  selectedOrder: UserOrderListDTO | null = null;
  selectedStatusInModal: string = '';
  currentAvailableStatuses: any[] = [];
  
  // Filter properties
  selectedStatus: string = 'all';
  selectedDateRange: string = 'all';
  
  // Selection properties
  selectAll: boolean = false;
  
  // Date range options
  dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];
  
  // Status options
  statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PAID', label: 'Paid' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'RETURNED', label: 'Returned' }
  ];

  // Available statuses for admin to change
  availableStatuses = [
    { value: 'PENDING', label: 'Pending', color: 'warning' },
    { value: 'PAID', label: 'Paid', color: 'info' },
    { value: 'PROCESSING', label: 'Processing', color: 'primary' },
    { value: 'SHIPPED', label: 'Shipped', color: 'info' },
    { value: 'DELIVERED', label: 'Delivered', color: 'success' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'danger' },
    { value: 'RETURNED', label: 'Returned', color: 'secondary' }
  ];

  // Get filtered available statuses based on order's return requests
  getAvailableStatusesForOrder(order: UserOrderListDTO): any[] {
    // Check if order has return requests with refundType "REPLACEMENT"
    const hasReplacementRequest = order.returnRequests && order.returnRequests.some(
      returnRequest => returnRequest.refundType === 'REPLACEMENT'
    );

    if (hasReplacementRequest) {
      // For replacement orders, exclude DELIVERED status
      return this.availableStatuses.filter(status => status.value !== 'DELIVERED');
    }

    // Return all available statuses for normal orders
    return this.availableStatuses;
  }

  // Helper method to check if order has replacement request
  hasReplacementRequest(order: UserOrderListDTO): boolean {
    return order.returnRequests && order.returnRequests.some(
      returnRequest => returnRequest.refundType === 'REPLACEMENT'
    );
  }

  // Helper method to check if order is cancelled with approved return requests
  isCancelledWithApprovedReturn(order: UserOrderListDTO): boolean {
    return order.status === 'CANCELLED' && order.returnRequests && order.returnRequests.some(
      returnRequest => returnRequest.status === 'APPROVED'
    );
  }

  // Get approved return request for cancelled order
  getApprovedReturnRequest(order: UserOrderListDTO): any {
    if (!this.isCancelledWithApprovedReturn(order)) return null;
    return order.returnRequests.find(
      returnRequest => returnRequest.status === 'APPROVED'
    );
  }

  // Check if status update section should be shown
  shouldShowStatusUpdate(order: UserOrderListDTO): boolean {
    // If order is RETURNED, never allow update
    if (order.status === 'RETURNED') return false;
    // If order is DELIVERED, only allow update if replacement request exists
    if (order.status === 'DELIVERED') {
      return this.hasReplacementRequest(order);
    }
    // If cancelled with approved return, don't allow
    if (this.isCancelledWithApprovedReturn(order)) return false;
    // Otherwise, allow
    return true;
  }

  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  paginatedOrders: OrderWithSelection[] = [];
  
  pdfDropdownOpen: boolean = false;
  csvDropdownOpen: boolean = false;
  
  // Track selected order IDs across all pages
  selectedOrderIds: Set<number> = new Set();

  // --- Discount Info Helpers ---
  discountInfoMap: { [id: number]: any } = {};

  // Call this after loading orders to fetch discount info for all used discount IDs
  async fetchDiscountInfoForOrders() {
    const ids = Array.from(new Set(this.orders.map(o => o.userDiscountId).filter((id): id is number => id !== undefined && id !== null)));
    for (const id of ids) {
      if (!this.discountInfoMap[id]) {
        try {
          const discount = await this.discountService.getDiscountById(id).toPromise();
          if (discount && typeof discount === 'object') {
            this.discountInfoMap[id] = {
              code: (discount as any).code || '',
              name: (discount as any).name || '',
              type: (discount as any).discountType || '',
              value: (discount as any).discountValue || 0
            };
          } else {
            this.discountInfoMap[id] = { code: 'N/A', name: 'Unknown Discount', type: '', value: 0 };
          }
        } catch (e) {
          this.discountInfoMap[id] = { code: 'N/A', name: 'Unknown Discount', type: '', value: 0 };
        }
      }
    }
  }

  getDiscountInfo(order: UserOrderListDTO) {
    if (!order.userDiscountId) return null;
    return this.discountInfoMap[order.userDiscountId] || null;
  }

  getProductOriginalPrice(product: any): number {
    // If product has discountRule, calculate original price
    if (product.discountRule && product.unitPrice) {
      const rule = product.discountRule;
      if (rule.discount && rule.discount.discountType === 'PERCENTAGE') {
        return Math.round(product.unitPrice / (1 - rule.discount.discountValue));
      } else if (rule.discount && rule.discount.discountType === 'FIXED') {
        return Math.round(product.unitPrice + rule.discount.discountValue);
      }
    }
    return product.unitPrice;
  }

  getProductDiscountedPrice(product: any): number {
    return product.unitPrice;
  }

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private modalService: NgbModal,
    public permissionService: PermissionService,
    private discountService: DiscountService,
    private priceFormatService: PriceFormatService
  ) {}
  public PermissionConstants = PermissionConstants;

  ngOnInit(): void {
    this.loadOrders();
    document.addEventListener('click', this.handleDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
  }

  private handleDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.pdfDropdownOpen = false;
      this.csvDropdownOpen = false;
    }
  }



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

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    } else if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  async loadOrders() {
    this.orderService.getAllOrder().subscribe({
      next: async (data) => {
        this.orders = data.map(order => ({ ...order, checked: false }));
        this.filteredOrders = [...this.orders];
        this.currentPage = 1;
        this.updatePaginatedOrders();
        await this.fetchDiscountInfoForOrders();
        setTimeout(() => {
          $('#orderTable').DataTable({
            destroy: true,
            columnDefs: [
              { orderable: false, targets: 0 }
            ],
            order: [[2, 'desc']]
          });
          if (typeof window !== 'undefined' && (window as any).lucide) {
            (window as any).lucide.createIcons();
          } else if (typeof lucide !== 'undefined') {
            lucide.createIcons();
          }
        }, 100);
      },
      error: (err) => {
        console.error('Order loading error:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error Loading Orders',
          text: 'There was an error loading your orders. Please try again later.',
          confirmButtonColor: '#3085d6'
        });
      }
    });
  }

  onStatusChange() {
    this.applyFilters();
  }

  onDateRangeChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.orders];

    // Filter by status
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(order => 
        order.status.toUpperCase() === this.selectedStatus.toUpperCase()
      );
    }

    // Filter by date range
    if (this.selectedDateRange !== 'all') {
      const now = new Date();
      const orderDate = new Date();
      
      filtered = filtered.filter(order => {
        orderDate.setTime(new Date(order.orderDate).getTime());
        
        switch (this.selectedDateRange) {
          case 'today':
            return this.isSameDay(orderDate, now);
          case 'week':
            return this.isThisWeek(orderDate, now);
          case 'month':
            return this.isThisMonth(orderDate, now);
          case 'year':
            return this.isThisYear(orderDate, now);
          default:
            return true;
        }
      });
    }

    this.filteredOrders = filtered;
    this.currentPage = 1;
    this.updatePaginatedOrders();
    this.updateSelection();
  }

  onSearch(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredOrders = this.orders.filter(order => {
      const matchesCustomer = (order.user?.name ?? '').toLowerCase().includes(term);
      const matchesOrderCode = (order.orderCode ?? '').toLowerCase().includes(term);
      const matchesStatus = (order.status ?? '').toLowerCase().includes(term);
      return !term || matchesCustomer || matchesOrderCode || matchesStatus;
    });
    this.currentPage = 1;
    this.updatePaginatedOrders();
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  private isThisWeek(date: Date, now: Date): boolean {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return date >= weekStart && date <= weekEnd;
  }

  private isThisMonth(date: Date, now: Date): boolean {
    return date.getMonth() === now.getMonth() && 
           date.getFullYear() === now.getFullYear();
  }

  private isThisYear(date: Date, now: Date): boolean {
    return date.getFullYear() === now.getFullYear();
  }

  updatePaginatedOrders(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedOrders = this.filteredOrders.slice(start, end);
    // Re-initialize lucide icons after pagination update
    setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).lucide) {
        (window as any).lucide.createIcons();
      } else if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }, 0);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePaginatedOrders();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.pageSize);
  }

  get showPagination(): boolean {
    return this.filteredOrders.length > this.pageSize;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  get showingFrom(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  get selectedOrders(): OrderWithSelection[] {
    return this.filteredOrders.filter(order => this.selectedOrderIds.has(order.orderId));
  }
  
  toggleAllCheckboxes(): void {
    if (this.selectAll) {
      this.paginatedOrders.forEach(order => this.selectedOrderIds.add(order.orderId));
    } else {
      this.paginatedOrders.forEach(order => this.selectedOrderIds.delete(order.orderId));
    }
    this.updateSelection();
  }
  
  updateSelection(): void {
    const total = this.paginatedOrders.length;
    const selected = this.paginatedOrders.filter(order => this.selectedOrderIds.has(order.orderId)).length;
    this.selectAll = total === selected && total > 0;
  }

  onOrderCheckboxChange(order: OrderWithSelection, event: any): void {
    if (event.target.checked) {
      this.selectedOrderIds.add(order.orderId);
    } else {
      this.selectedOrderIds.delete(order.orderId);
    }
    this.updateSelection();
  }

  getStatusBadgeClass(status: string): string {
    const statusObj = this.availableStatuses.find(s => s.value === status.toUpperCase());
    return statusObj ? `bg-${statusObj.color}` : 'bg-secondary';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTotalItems(order: UserOrderListDTO): number {
    return order.products.reduce((total, product) => total + product.quantity, 0);
  }

  // Helper to get total for non-refunded products
  getRefundedTotal(order: UserOrderListDTO): number {
    if (!order.products) return 0;
    // Only consider non-returned products for subtotal and discount
    const nonReturnedProducts = order.products.filter(p => p.status !== 'RETURNED');
    const subtotal = nonReturnedProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
    // Pro-rate discount if needed (if discount is percentage, apply to subtotal; if fixed, pro-rate by value)
    let discountAmount = 0;
    if (order.discountAmount && order.subtotal) {
      // If discount is percentage, backend already calculates correct discount for subtotal
      // If fixed, pro-rate by subtotal of non-returned products
      if (order.discountType === 'PERCENTAGE') {
        discountAmount = subtotal * (order.discountValue || 0);
      } else {
        // Fixed discount: pro-rate by subtotal of non-returned products
        discountAmount = (order.discountAmount * subtotal) / order.subtotal;
      }
    }
    const deliveryFee = order.deliveryFee || 0;
    let total = subtotal - discountAmount + deliveryFee;
    // Check for approved return request with refundType 'MONEY_REFUND'
    if (order.returnRequests) {
      const approvedRefund = order.returnRequests.find(r => r.status === 'APPROVED' && r.refundType === 'MONEY_REFUND');
      if (approvedRefund && approvedRefund.refundAmount) {
        total -= approvedRefund.refundAmount;
      }
    }
    return Math.max(0, Math.round(total));
  }

  // Returns the total of originalPrice * quantity for all non-returned products (before any discount)
  getBeforeDiscountProductTotal(order: UserOrderListDTO): number {
    if (!order.products) return 0;
    return order.products
      .filter(p => p.status !== 'RETURNED')
      .reduce((sum, p) => sum + ((p.originalPrice || p.unitPrice) * p.quantity), 0);
  }

  // Returns the total of unitPrice * quantity for all non-returned products (after discount)
  getAfterDiscountProductTotal(order: UserOrderListDTO): number {
    if (!order.products) return 0;
    return order.products
      .filter(p => p.status !== 'RETURNED')
      .reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0);
  }

  // Returns the total before any discount/refund (subtotal + deliveryFee)
  getBeforeDiscountTotal(order: UserOrderListDTO): number {
    const subtotal = order.subtotal || 0;
    const deliveryFee = order.deliveryFee || 0;
    return subtotal + deliveryFee;
  }

  // Helper to get refund status and amount for display
  getMoneyRefundStatus(order: UserOrderListDTO): { show: boolean, amount: number } {
    if (order.returnRequests) {
      const approvedRefund = order.returnRequests.find(r => r.status === 'APPROVED' && r.refundType === 'MONEY_REFUND');
      if (approvedRefund && approvedRefund.refundAmount) {
        return { show: true, amount: approvedRefund.refundAmount };
      }
    }
    return { show: false, amount: 0 };
  }

  viewOrderDetails(order: UserOrderListDTO, content: any) {
    this.selectedOrder = { ...order }; // Create a copy to avoid unintended changes
    this.selectedStatusInModal = this.selectedOrder.status;
    
    // Only set available statuses if status update should be shown
    if (this.shouldShowStatusUpdate(order)) {
      this.currentAvailableStatuses = this.getAvailableStatusesForOrder(order);
    } else {
      this.currentAvailableStatuses = [];
    }
    
    this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      windowClass: 'invoice-modal' // Add custom class for styling
    });
  }

  printInvoice() {
    window.print();
  }

  changeOrderStatus() {
    if (!this.selectedOrder) return;

    const newStatus = this.selectedStatusInModal;

    Swal.fire({
      title: 'Change Order Status',
      text: `Are you sure you want to change the status of order ${this.selectedOrder.orderCode} to ${newStatus}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, change it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.updateOrderStatus(this.selectedOrder!.orderId, newStatus);
      }
    });
  }

  private updateOrderStatus(orderId: number, newStatus: string) {
    this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
      next: () => {
        // Update local data
        const order = this.orders.find(o => o.orderId === orderId);
        if (order) {
          order.status = newStatus;
        }
        if (this.selectedOrder) {
          this.selectedOrder.status = newStatus;
        }
        this.modalService.dismissAll();
        this.loadOrders(); // Refresh the data
        Swal.fire('Success!', 'Order status updated successfully.', 'success');
      },
      error: (err) => {
        console.error('Error updating order status:', err);
        
        // Better error handling
        let errorMessage = 'Failed to update order status.';
        
        if (err.status === 500) {
          if (err.error && err.error.message) {
            errorMessage = err.error.message;
          } else {
            errorMessage = 'Server error occurred. Please try again later.';
          }
        } else if (err.status === 404) {
          errorMessage = 'Order not found.';
        } else if (err.status === 400) {
          if (err.error && err.error.message) {
            errorMessage = err.error.message;
          } else {
            errorMessage = 'Invalid request. Please check the status value.';
          }
        } else if (err.error && err.error.message) {
          errorMessage = err.error.message;
        }
        
        Swal.fire('Error!', errorMessage, 'error');
      }
    });
  }

  cancelOrder(order: UserOrderListDTO) {
    Swal.fire({
      title: 'Cancel Order',
      text: `Are you sure you want to cancel order ${order.orderCode}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, cancel it!'
    }).then((result) => {
      if (result.isConfirmed) {
        // Directly call the update method for the specific order
        this.updateOrderStatus(order.orderId, 'CANCELLED');
      }
    });
  }

  // Export functionality using Jasper Reports
  exportToCSV(type: 'all' | 'selected' = 'all'): void {
    try {
      const ordersToExport = type === 'selected' ? this.selectedOrders : this.filteredOrders;
      
      if (ordersToExport.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'No Data to Export',
          text: 'There are no orders to export.',
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

      // Generate CSV data with detailed information
      const csvData = this.generateDetailedCSVData(ordersToExport);
      
      // Create CSV content
      const csvContent = this.convertToCSV(csvData);
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
      link.download = `Britium_Gallery_Detailed_Order_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);

            Swal.fire({
              icon: 'success',
              title: 'Export Successful!',
        text: 'Detailed order report has been exported successfully.',
              timer: 3000,
              showConfirmButton: false
            });

    } catch (error) {
      console.error('Order CSV export error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'There was an error exporting to CSV. Please try again.',
        confirmButtonColor: '#3085d6'
      });
    }
  }

  exportToPDF(type: 'all' | 'selected' = 'all'): void {
    try {
      const ordersToExport = type === 'selected' ? this.selectedOrders : this.filteredOrders;
      
      if (ordersToExport.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'No Data to Export',
          text: 'There are no orders to export.',
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

      // Generate PDF data with detailed information
      const pdfData = this.generateDetailedPDFData(ordersToExport);
      
      // Create PDF using jsPDF
      this.createDetailedPDF(pdfData);

            Swal.fire({
              icon: 'success',
              title: 'Export Successful!',
        text: 'Detailed order report has been exported successfully.',
              timer: 3000,
              showConfirmButton: false
            });

    } catch (error) {
      console.error('Order PDF export error:', error);
            Swal.fire({
              icon: 'error',
              title: 'Export Failed',
        text: 'There was an error exporting to PDF. Please try again.',
              confirmButtonColor: '#3085d6'
            });
          }
  }

  // Generate detailed CSV data
  private generateDetailedCSVData(orders: OrderWithSelection[]): any[] {
    const csvData: any[] = [];
    
    // Add header row
    csvData.push([
      'Order Code',
      'Order Date',
      'Customer Name',
      'Customer Phone',
      'Delivery Address',
      'Delivery Service',
      'Product Name',
      'Product SKU',
      'Variant Price',
      'Quantity',
      'Unit Price',
      'Product Total',
      'Delivery Fee',
      'Total Amount',
      'Order Status'
    ]);

    // Add data rows
    orders.forEach(order => {
      order.products.forEach(product => {
        // Get variant information
        const variantInfo = this.getVariantInfo(product);
        
        // Try to get phone number from multiple possible properties
        const phoneNumber = order.user.phNo || (order.user as any).phoneNumber || 'N/A';
        
        csvData.push([
          order.orderCode,
          this.formatDate(order.orderDate),
          order.user.name,
          (phoneNumber && phoneNumber.trim() !== '') ? phoneNumber : 'N/A',
          `${order.address.address}, ${order.address.city}, ${order.address.state} ${order.address.postalCode}, ${order.address.country}`,
          (order.deliveryService && order.deliveryService.trim() !== '') ? order.deliveryService : 'N/A',
          product.productName,
          product.sku || 'N/A',
          variantInfo.price || this.formatPriceOnly(product.unitPrice),
          product.quantity,
          this.formatPriceOnly(product.unitPrice),
          this.formatPriceOnly(product.quantity * product.unitPrice),
          this.formatPriceOnly(order.deliveryFee || 0),
          this.formatPriceOnly(this.getRefundedTotal(order)),
          order.status
        ]);
      });
    });

    return csvData;
  }

  // Generate detailed PDF data
  private generateDetailedPDFData(orders: OrderWithSelection[]): any[] {
    const pdfData: any[] = [];
    
    // Add header row
    pdfData.push([
      'Order Code',
      'Order Date',
      'Customer Name',
      'Customer Phone',
      'Delivery Address',
      'Delivery Service',
      'Product Name',
      'Product SKU',
      'Variant Price',
      'Quantity',
      'Unit Price',
      'Product Total',
      'Delivery Fee',
      'Total Amount',
      'Status'
    ]);

    // Add data rows
    orders.forEach(order => {
      order.products.forEach(product => {
        // Get variant information
        const variantInfo = this.getVariantInfo(product);
        
        // Debug logging for phone and delivery service
        console.log('Order:', order.orderCode, 'User Object:', order.user);
        console.log('Phone phNo:', order.user.phNo, 'Phone phoneNumber:', (order.user as any).phoneNumber);
        console.log('Delivery Service:', order.deliveryService);
        
        // Try to get phone number from multiple possible properties
        const phoneNumber = order.user.phNo || (order.user as any).phoneNumber || 'N/A';
        
        pdfData.push([
          order.orderCode,
          this.formatDate(order.orderDate),
          order.user.name,
          (phoneNumber && phoneNumber.trim() !== '') ? phoneNumber : 'N/A',
          `${order.address.address}, ${order.address.city}, ${order.address.state} ${order.address.postalCode}, ${order.address.country}`,
          (order.deliveryService && order.deliveryService.trim() !== '') ? order.deliveryService : 'N/A',
          product.productName,
          product.sku || 'N/A',
          variantInfo.price || this.formatPriceOnly(product.unitPrice),
          product.quantity,
          this.formatPriceOnly(product.unitPrice),
          this.formatPriceOnly(product.quantity * product.unitPrice),
          this.formatPriceOnly(order.deliveryFee || 0),
          this.formatPriceOnly(this.getRefundedTotal(order)),
          order.status
        ]);
      });
    });

    return pdfData;
  }

  // Convert data to CSV format
  private convertToCSV(data: any[]): string {
    return data.map(row => 
      row.map((cell: any) => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');
  }

  // Create detailed PDF using jsPDF
  private createDetailedPDF(data: any[]): void {
    // Debug: Log the data being passed to PDF
    console.log('PDF Data Headers:', data[0]);
    console.log('PDF Data First Row:', data[1]);
    console.log('Total PDF Rows:', data.length);
    
    // Import jsPDF dynamically
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then(({ default: autoTable }) => {
        const doc = new jsPDF('landscape');
        
        // Get page width for centering
        const pageWidth = doc.internal.pageSize.width;
        
        // Add centered title
        doc.setFontSize(18);
        const title = 'Britium Gallery - Detailed Order Report';
        const titleWidth = doc.getTextWidth(title);
        const titleX = (pageWidth - titleWidth) / 2;
        doc.text(title, titleX, 22);
        
        // Add centered subtitle
        doc.setFontSize(12);
        const subtitle = `Generated on: ${new Date().toLocaleDateString()}`;
        const subtitleWidth = doc.getTextWidth(subtitle);
        const subtitleX = (pageWidth - subtitleWidth) / 2;
        doc.text(subtitle, subtitleX, 32);
        
        // Create table
        autoTable(doc, {
          head: [data[0]],
          body: data.slice(1),
          startY: 40,
          styles: {
            fontSize: 8,
            cellPadding: 3
          },
          headStyles: {
            fillColor: [66, 139, 202],
            textColor: 255,
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          columnStyles: {
            0: { cellWidth: 22 }, // Order Code
            1: { cellWidth: 22 }, // Order Date
            2: { cellWidth: 25 }, // Customer Name
            3: { cellWidth: 22 }, // Customer Phone
            4: { cellWidth: 40 }, // Delivery Address
            5: { cellWidth: 22 }, // Delivery Service
            6: { cellWidth: 30 }, // Product Name
            7: { cellWidth: 18 }, // Product SKU
            8: { cellWidth: 18 }, // Variant Price
            9: { cellWidth: 12 }, // Quantity
            10: { cellWidth: 18 }, // Unit Price
            11: { cellWidth: 18 }, // Product Total
            12: { cellWidth: 18 }, // Delivery Fee
            13: { cellWidth: 22 }, // Total Amount
            14: { cellWidth: 18 }  // Status
          }
        });
        
        // Save the PDF
        doc.save(`Britium_Gallery_Detailed_Order_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`);
      });
    });
  }

  get totalItems(): number {
    return this.filteredOrders.length;
  }

  openInvoiceModal(order: any) {
    const modalRef = this.modalService.open(OrderInvoiceComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.order = order;
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

  // Helper method to get variant information
  private getVariantInfo(product: any): { price: string } {
    if (product.variant) {
      return {
        price: this.formatPriceOnly(product.variant.price || product.unitPrice)
      };
    } else if (product.variantId) {
      // If variant exists but not as nested object, try to get from variantId
      return {
        price: this.formatPriceOnly(product.unitPrice)
      };
    } else {
      return {
        price: this.formatPriceOnly(product.unitPrice)
      };
    }
  }
}
