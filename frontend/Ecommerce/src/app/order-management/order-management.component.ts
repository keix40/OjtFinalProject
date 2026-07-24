import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { OrderService } from '../services/order.service';
import { UserOrderListDTO } from '../user-order';
import { AuthService } from '../auth/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OrderInvoiceComponent } from '../order-invoice/order-invoice.component';
import { PermissionService } from '../services/permission.service';
import { PermissionConstants } from '../constants/permission.constants';
import { DiscountService } from '../services/discount.service';
import { PriceFormatService } from '../services/price-format.service';
import { SelectionStore } from '../core/state/selection-store';
import { LuxDialogService } from '../shared/dialog/lux-dialog.service';

declare var lucide: any;

@Component({
  selector: 'app-order-management',
  standalone: false,
  templateUrl: './order-management.component.html',
  styleUrl: './order-management.component.css',
  providers: [SelectionStore],
})
export class OrderManagementComponent implements OnInit, AfterViewInit, OnDestroy {
  orders: UserOrderListDTO[] = [];
  filteredOrders: UserOrderListDTO[] = [];
  selectedOrder: UserOrderListDTO | null = null;
  selectedStatusInModal: string = '';
  currentAvailableStatuses: any[] = [];

  selectedStatus: string = 'all';
  selectedDateRange: string = 'all';

  dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ];

  statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PAID', label: 'Paid' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'RETURNED', label: 'Returned' },
  ];

  availableStatuses = [
    { value: 'PENDING', label: 'Pending', color: 'warning' },
    { value: 'PAID', label: 'Paid', color: 'info' },
    { value: 'PROCESSING', label: 'Processing', color: 'primary' },
    { value: 'SHIPPED', label: 'Shipped', color: 'info' },
    { value: 'DELIVERED', label: 'Delivered', color: 'success' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'danger' },
    { value: 'RETURNED', label: 'Returned', color: 'secondary' },
  ];

  searchTerm: string = '';
  /** 0-based page index for lux-paginator */
  currentPage: number = 0;
  pageSize: number = 10;
  paginatedOrders: UserOrderListDTO[] = [];

  pdfDropdownOpen: boolean = false;
  csvDropdownOpen: boolean = false;

  discountInfoMap: { [id: number]: any } = {};

  public PermissionConstants = PermissionConstants;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private modalService: NgbModal,
    public permissionService: PermissionService,
    private discountService: DiscountService,
    private priceFormatService: PriceFormatService,
    public selection: SelectionStore<number>,
    private dialog: LuxDialogService
  ) {}

  getAvailableStatusesForOrder(order: UserOrderListDTO): any[] {
    const hasReplacementRequest = order.returnRequests && order.returnRequests.some(
      (returnRequest) => returnRequest.refundType === 'REPLACEMENT'
    );
    if (hasReplacementRequest) {
      return this.availableStatuses.filter((status) => status.value !== 'DELIVERED');
    }
    return this.availableStatuses;
  }

  hasReplacementRequest(order: UserOrderListDTO): boolean {
    return !!(order.returnRequests && order.returnRequests.some(
      (returnRequest) => returnRequest.refundType === 'REPLACEMENT'
    ));
  }

  isCancelledWithApprovedReturn(order: UserOrderListDTO): boolean {
    return order.status === 'CANCELLED' && !!(order.returnRequests && order.returnRequests.some(
      (returnRequest) => returnRequest.status === 'APPROVED'
    ));
  }

  getApprovedReturnRequest(order: UserOrderListDTO): any {
    if (!this.isCancelledWithApprovedReturn(order)) return null;
    return order.returnRequests.find(
      (returnRequest) => returnRequest.status === 'APPROVED'
    );
  }

  shouldShowStatusUpdate(order: UserOrderListDTO): boolean {
    if (order.status === 'RETURNED') return false;
    if (order.status === 'DELIVERED') {
      return this.hasReplacementRequest(order);
    }
    if (this.isCancelledWithApprovedReturn(order)) return false;
    return true;
  }

  async fetchDiscountInfoForOrders() {
    const ids = Array.from(
      new Set(
        this.orders
          .map((o) => o.userDiscountId)
          .filter((id): id is number => id !== undefined && id !== null)
      )
    );
    for (const id of ids) {
      if (!this.discountInfoMap[id]) {
        try {
          const discount = await this.discountService.getDiscountById(id).toPromise();
          if (discount && typeof discount === 'object') {
            this.discountInfoMap[id] = {
              code: (discount as any).code || '',
              name: (discount as any).name || '',
              type: (discount as any).discountType || '',
              value: (discount as any).discountValue || 0,
            };
          } else {
            this.discountInfoMap[id] = { code: 'N/A', name: 'Unknown Discount', type: '', value: 0 };
          }
        } catch {
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

  ngOnInit(): void {
    this.loadOrders();
    document.addEventListener('click', this.handleDocumentClickBound);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleDocumentClickBound);
  }

  private handleDocumentClickBound = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    if (!target.closest('.admin-export')) {
      this.pdfDropdownOpen = false;
      this.csvDropdownOpen = false;
    }
  };

  toggleCsvDropdown(): void {
    this.csvDropdownOpen = !this.csvDropdownOpen;
    if (this.csvDropdownOpen) this.pdfDropdownOpen = false;
  }

  togglePdfDropdown(): void {
    this.pdfDropdownOpen = !this.pdfDropdownOpen;
    if (this.pdfDropdownOpen) this.csvDropdownOpen = false;
  }

  ngAfterViewInit(): void {
    this.refreshIcons();
  }

  private refreshIcons(): void {
    setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).lucide) {
        (window as any).lucide.createIcons();
      } else if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }, 0);
  }

  loadOrders() {
    this.orderService.getAllOrder().subscribe({
      next: async (data) => {
        this.orders = data;
        this.filteredOrders = [...this.orders];
        this.currentPage = 0;
        this.updatePaginatedOrders();
        await this.fetchDiscountInfoForOrders();
        this.refreshIcons();
      },
      error: () => {
        this.dialog.error('Error Loading Orders', 'There was an error loading your orders. Please try again later.');
      },
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

    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(
        (order) => order.status.toUpperCase() === this.selectedStatus.toUpperCase()
      );
    }

    if (this.selectedDateRange !== 'all') {
      const now = new Date();
      const orderDate = new Date();

      filtered = filtered.filter((order) => {
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
    this.currentPage = 0;
    this.updatePaginatedOrders();
  }

  onSearch(): void {
    const term = this.searchTerm.trim().toLowerCase();
    let filtered = this.orders.filter((order) => {
      const matchesCustomer = (order.user?.name ?? '').toLowerCase().includes(term);
      const matchesOrderCode = (order.orderCode ?? '').toLowerCase().includes(term);
      const matchesStatus = (order.status ?? '').toLowerCase().includes(term);
      return !term || matchesCustomer || matchesOrderCode || matchesStatus;
    });

    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(
        (order) => order.status.toUpperCase() === this.selectedStatus.toUpperCase()
      );
    }
    if (this.selectedDateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.orderDate);
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
    this.currentPage = 0;
    this.updatePaginatedOrders();
  }

  clearFilters(): void {
    this.selectedStatus = 'all';
    this.selectedDateRange = 'all';
    this.searchTerm = '';
    this.filteredOrders = [...this.orders];
    this.currentPage = 0;
    this.updatePaginatedOrders();
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
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
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  private isThisYear(date: Date, now: Date): boolean {
    return date.getFullYear() === now.getFullYear();
  }

  updatePaginatedOrders(): void {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedOrders = this.filteredOrders.slice(start, end);
    this.refreshIcons();
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.updatePaginatedOrders();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.pageSize) || 0;
  }

  get pageIds(): number[] {
    return this.paginatedOrders.map((o) => o.orderId);
  }

  get allPageSelected(): boolean {
    return this.selection.isPageAllSelected(this.pageIds);
  }

  get partialPageSelected(): boolean {
    return this.selection.isPagePartialSelected(this.pageIds);
  }

  isRowSelected = (row: unknown): boolean => {
    const order = row as UserOrderListDTO;
    return this.selection.isSelected(order.orderId);
  };

  trackByOrder = (_: number, row: unknown) => (row as UserOrderListDTO).orderId;

  onToggleAll(checked: boolean): void {
    this.selection.setPage(this.pageIds, checked);
  }

  onToggleRow(event: { row: unknown; checked: boolean }): void {
    const order = event.row as UserOrderListDTO;
    this.selection.toggle(order.orderId, event.checked);
  }

  get selectedOrders(): UserOrderListDTO[] {
    const ids = new Set(this.selection.ids());
    return this.filteredOrders.filter((order) => ids.has(order.orderId));
  }

  statusTone(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
    switch ((status || '').toUpperCase()) {
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
      case 'RETURNED':
        return 'danger';
      case 'PENDING':
        return 'warning';
      case 'PAID':
      case 'SHIPPED':
      case 'PROCESSING':
        return 'info';
      default:
        return 'default';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getTotalItems(order: UserOrderListDTO): number {
    return order.products.reduce((total, product) => total + product.quantity, 0);
  }

  getRefundedTotal(order: UserOrderListDTO): number {
    if (!order.products) return 0;
    const nonReturnedProducts = order.products.filter((p) => p.status !== 'RETURNED');
    const subtotal = nonReturnedProducts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
    let discountAmount = 0;
    if (order.discountAmount && order.subtotal) {
      if (order.discountType === 'PERCENTAGE') {
        discountAmount = subtotal * (order.discountValue || 0);
      } else {
        discountAmount = (order.discountAmount * subtotal) / order.subtotal;
      }
    }
    const deliveryFee = order.deliveryFee || 0;
    let total = subtotal - discountAmount + deliveryFee;
    if (order.returnRequests) {
      const approvedRefund = order.returnRequests.find(
        (r) => r.status === 'APPROVED' && r.refundType === 'MONEY_REFUND'
      );
      if (approvedRefund && approvedRefund.refundAmount) {
        total -= approvedRefund.refundAmount;
      }
    }
    return Math.max(0, Math.round(total));
  }

  getBeforeDiscountProductTotal(order: UserOrderListDTO): number {
    if (!order.products) return 0;
    return order.products
      .filter((p) => p.status !== 'RETURNED')
      .reduce((sum, p) => sum + (p.originalPrice || p.unitPrice) * p.quantity, 0);
  }

  getAfterDiscountProductTotal(order: UserOrderListDTO): number {
    if (!order.products) return 0;
    return order.products
      .filter((p) => p.status !== 'RETURNED')
      .reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);
  }

  getBeforeDiscountTotal(order: UserOrderListDTO): number {
    return (order.subtotal || 0) + (order.deliveryFee || 0);
  }

  getMoneyRefundStatus(order: UserOrderListDTO): { show: boolean; amount: number } {
    if (order.returnRequests) {
      const approvedRefund = order.returnRequests.find(
        (r) => r.status === 'APPROVED' && r.refundType === 'MONEY_REFUND'
      );
      if (approvedRefund && approvedRefund.refundAmount) {
        return { show: true, amount: approvedRefund.refundAmount };
      }
    }
    return { show: false, amount: 0 };
  }

  viewOrderDetails(order: UserOrderListDTO, content: any) {
    this.selectedOrder = { ...order };
    this.selectedStatusInModal = this.selectedOrder.status;
    if (this.shouldShowStatusUpdate(order)) {
      this.currentAvailableStatuses = this.getAvailableStatusesForOrder(order);
    } else {
      this.currentAvailableStatuses = [];
    }
    this.modalService.open(content, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      windowClass: 'invoice-modal lux-admin-modal',
    });
  }

  printInvoice() {
    window.print();
  }

  async changeOrderStatus() {
    if (!this.selectedOrder) return;
    const newStatus = this.selectedStatusInModal;
    const ok = await this.dialog.confirm({
      title: 'Change Order Status',
      text: `Change status of order ${this.selectedOrder.orderCode} to ${newStatus}?`,
      confirmText: 'Update status',
    });
    if (ok) {
      this.updateOrderStatus(this.selectedOrder.orderId, newStatus);
    }
  }

  private updateOrderStatus(orderId: number, newStatus: string) {
    this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
      next: () => {
        const order = this.orders.find((o) => o.orderId === orderId);
        if (order) order.status = newStatus;
        if (this.selectedOrder) this.selectedOrder.status = newStatus;
        this.modalService.dismissAll();
        this.loadOrders();
        this.dialog.success('Success', 'Order status updated successfully.');
      },
      error: (err) => {
        let errorMessage = 'Failed to update order status.';
        if (err.status === 500) {
          errorMessage = err.error?.message || 'Server error occurred. Please try again later.';
        } else if (err.status === 404) {
          errorMessage = 'Order not found.';
        } else if (err.status === 400) {
          errorMessage = err.error?.message || 'Invalid request. Please check the status value.';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }
        this.dialog.error('Error', errorMessage);
      },
    });
  }

  async cancelOrder(order: UserOrderListDTO) {
    const ok = await this.dialog.confirm({
      title: 'Cancel Order',
      text: `Cancel order ${order.orderCode}?`,
      confirmText: 'Yes, cancel',
      destructive: true,
    });
    if (ok) {
      this.updateOrderStatus(order.orderId, 'CANCELLED');
    }
  }

  async exportToCSV(type: 'all' | 'selected' = 'all'): Promise<void> {
    try {
      const ordersToExport = type === 'selected' ? this.selectedOrders : this.filteredOrders;
      if (ordersToExport.length === 0) {
        await this.dialog.warning('No Data to Export', 'There are no orders to export.');
        return;
      }
      const csvData = this.generateDetailedCSVData(ordersToExport);
      const csvContent = this.convertToCSV(csvData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Britium_Gallery_Detailed_Order_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      this.dialog.toast('Detailed order report exported');
    } catch {
      this.dialog.error('Export Failed', 'There was an error exporting to CSV. Please try again.');
    }
  }

  async exportToPDF(type: 'all' | 'selected' = 'all'): Promise<void> {
    try {
      const ordersToExport = type === 'selected' ? this.selectedOrders : this.filteredOrders;
      if (ordersToExport.length === 0) {
        await this.dialog.warning('No Data to Export', 'There are no orders to export.');
        return;
      }
      const pdfData = this.generateDetailedPDFData(ordersToExport);
      this.createDetailedPDF(pdfData);
      this.dialog.toast('Detailed order report exported');
    } catch {
      this.dialog.error('Export Failed', 'There was an error exporting to PDF. Please try again.');
    }
  }

  private generateDetailedCSVData(orders: UserOrderListDTO[]): any[] {
    const csvData: any[] = [];
    csvData.push([
      'Order Code', 'Order Date', 'Customer Name', 'Customer Phone', 'Delivery Address',
      'Delivery Service', 'Product Name', 'Product SKU', 'Variant Price', 'Quantity',
      'Unit Price', 'Product Total', 'Delivery Fee', 'Total Amount', 'Order Status',
    ]);
    orders.forEach((order) => {
      order.products.forEach((product) => {
        const variantInfo = this.getVariantInfo(product);
        const phoneNumber = order.user.phNo || (order.user as any).phoneNumber || 'N/A';
        csvData.push([
          order.orderCode,
          this.formatDate(order.orderDate),
          order.user.name,
          phoneNumber && phoneNumber.trim() !== '' ? phoneNumber : 'N/A',
          `${order.address.address}, ${order.address.city}, ${order.address.state} ${order.address.postalCode}, ${order.address.country}`,
          order.deliveryService && order.deliveryService.trim() !== '' ? order.deliveryService : 'N/A',
          product.productName,
          product.sku || 'N/A',
          variantInfo.price || this.formatPriceOnly(product.unitPrice),
          product.quantity,
          this.formatPriceOnly(product.unitPrice),
          this.formatPriceOnly(product.quantity * product.unitPrice),
          this.formatPriceOnly(order.deliveryFee || 0),
          this.formatPriceOnly(this.getRefundedTotal(order)),
          order.status,
        ]);
      });
    });
    return csvData;
  }

  private generateDetailedPDFData(orders: UserOrderListDTO[]): any[] {
    return this.generateDetailedCSVData(orders).map((row, i) => {
      if (i === 0) {
        const copy = [...row];
        copy[copy.length - 1] = 'Status';
        return copy;
      }
      return row;
    });
  }

  private convertToCSV(data: any[]): string {
    return data
      .map((row) =>
        row
          .map((cell: any) => {
            const cellStr = String(cell);
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(',')
      )
      .join('\n');
  }

  private createDetailedPDF(data: any[]): void {
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then(({ default: autoTable }) => {
        const doc = new jsPDF('landscape');
        const pageWidth = doc.internal.pageSize.width;
        doc.setFontSize(18);
        const title = 'Britium Gallery - Detailed Order Report';
        doc.text(title, (pageWidth - doc.getTextWidth(title)) / 2, 22);
        doc.setFontSize(12);
        const subtitle = `Generated on: ${new Date().toLocaleDateString()}`;
        doc.text(subtitle, (pageWidth - doc.getTextWidth(subtitle)) / 2, 32);
        autoTable(doc, {
          head: [data[0]],
          body: data.slice(1),
          startY: 40,
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [28, 27, 25], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [247, 243, 236] },
        });
        doc.save(
          `Britium_Gallery_Detailed_Order_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`
        );
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
      keyboard: false,
      windowClass: 'lux-admin-modal',
    });
    modalRef.componentInstance.order = order;
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

  private getVariantInfo(product: any): { price: string } {
    if (product.variant) {
      return { price: this.formatPriceOnly(product.variant.price || product.unitPrice) };
    }
    return { price: this.formatPriceOnly(product.unitPrice) };
  }
}
