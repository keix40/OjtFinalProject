import { Component, OnInit } from '@angular/core';
import { OrderService } from '../services/order.service';
import { UserOrderListDTO } from '../user-order';
import { AuthService } from '../auth/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
declare var $: any;

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
export class OrderManagementComponent implements OnInit {
  orders: OrderWithSelection[] = [];
  filteredOrders: OrderWithSelection[] = [];
  selectedOrder: UserOrderListDTO | null = null;
  selectedStatusInModal: string = '';
  
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

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders() {
    this.orderService.getAllOrder().subscribe({
      next: (data) => {
        this.orders = data.map(order => ({ ...order, checked: false }));
        this.filteredOrders = [...this.orders];
        
        setTimeout(() => {
          $('#orderTable').DataTable({
            destroy: true,
            columnDefs: [
              { orderable: false, targets: 0 }
            ],
            order: [[2, 'desc']] // Sort by order date descending
          });
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
    this.updateSelection();
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

  get selectedOrders(): OrderWithSelection[] {
    return this.filteredOrders.filter(order => order.checked);
  }
  
  toggleAllCheckboxes(): void {
    this.filteredOrders.forEach(order => order.checked = this.selectAll);
  }
  
  updateSelection(): void {
    const total = this.filteredOrders.length;
    const selected = this.filteredOrders.filter(order => order.checked).length;
    this.selectAll = total === selected && total > 0;
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

  viewOrderDetails(order: UserOrderListDTO, content: any) {
    this.selectedOrder = { ...order }; // Create a copy to avoid unintended changes
    this.selectedStatusInModal = this.selectedOrder.status;
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
        Swal.fire('Error!', 'Failed to update order status.', 'error');
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

  // Export functionality
  async exportToExcel() {
    try {
      // Dynamic import for xlsx
      const XLSX = await import('xlsx');
      
      const ordersToExport = this.selectedOrders.length > 0 ? this.selectedOrders : this.filteredOrders;
      
      if (ordersToExport.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'No Data to Export',
          text: 'There are no orders to export.',
          confirmButtonColor: '#3085d6'
        });
        return;
      }

      const exportData = ordersToExport.map(order => ({
        'Order Code': order.orderCode,
        'Order Date': this.formatDate(order.orderDate),
        'Status': order.status,
        'Customer': order.user.name,
        'Email': order.user.email,
        'Phone': order.user.phNo,
        'Delivery Method': order.deliveryMethod,
        'Delivery Fee': order.deliveryFee,
        'Subtotal': order.subtotal,
        'Discount Amount': order.discountAmount || 0,
        'Total': order.total,
        'Total Items': this.getTotalItems(order),
        'Products Count': order.products.length,
        'Address': `${order.address.address}, ${order.address.city}, ${order.address.state} ${order.address.postalCode}`,
        'Discount Code': order.discountCode || 'N/A',
        'Discount Type': order.discountType || 'N/A'
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

      // Auto-size columns
      const columnWidths = [
        { wch: 15 }, // Order Code
        { wch: 20 }, // Order Date
        { wch: 12 }, // Status
        { wch: 20 }, // Customer
        { wch: 25 }, // Email
        { wch: 15 }, // Phone
        { wch: 15 }, // Delivery Method
        { wch: 12 }, // Delivery Fee
        { wch: 12 }, // Subtotal
        { wch: 15 }, // Discount Amount
        { wch: 12 }, // Total
        { wch: 12 }, // Total Items
        { wch: 12 }, // Products Count
        { wch: 40 }, // Address
        { wch: 15 }, // Discount Code
        { wch: 15 }  // Discount Type
      ];
      worksheet['!cols'] = columnWidths;

      const fileName = `orders_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      Swal.fire({
        icon: 'success',
        title: 'Export Successful',
        text: `Orders exported to ${fileName}`,
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

  async exportToPDF() {
    try {
      // Dynamic import for jsPDF and autoTable
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;

      const ordersToExport = this.selectedOrders.length > 0 ? this.selectedOrders : this.filteredOrders;
      
      if (ordersToExport.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'No Data to Export',
          text: 'There are no orders to export.',
          confirmButtonColor: '#3085d6'
        });
        return;
      }

      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      // Add title
      doc.setFontSize(18);
      doc.text('Order Management Report', 14, 20);
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.text(`Total Orders: ${ordersToExport.length}`, 14, 40);

      // Prepare table data
      const tableData = ordersToExport.map(order => [
        order.orderCode,
        this.formatDate(order.orderDate),
        order.status,
        order.user.name,
        order.total + ' ks',
        this.getTotalItems(order) + ' items',
        order.deliveryMethod
      ]);

      // Add table
      autoTable(doc, {
        head: [['Order Code', 'Date', 'Status', 'Customer', 'Total', 'Items', 'Delivery']],
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

      const fileName = `orders_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      Swal.fire({
        icon: 'success',
        title: 'Export Successful',
        text: `Orders exported to ${fileName}`,
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

  exportSelected() {
    if (this.selectedOrders.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Selection',
        text: 'Please select at least one order to export.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }
    
    Swal.fire({
      title: 'Export Selected Orders',
      text: `Export ${this.selectedOrders.length} selected order(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Export'
    }).then((result) => {
      if (result.isConfirmed) {
        // This will use the selected orders in the export methods
        this.exportToExcel();
      }
    });
  }
}
