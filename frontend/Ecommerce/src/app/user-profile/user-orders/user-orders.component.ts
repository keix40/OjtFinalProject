import { Component, OnInit } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { UserOrderListDTO } from '../../user-order';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-orders',
  standalone: false,
  templateUrl: './user-orders.component.html',
  styleUrl: './user-orders.component.css',
  providers: [DatePipe, CurrencyPipe]
})
export class UserOrdersComponent implements OnInit {
  userOrders: UserOrderListDTO[] = [];
  expandedOrderId: number | null = null;
  isLoading: boolean = false;
  error: string | null = null;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;

  // Filter
  selectedStatus: string = '';
  
  statusOptions: string[] = [
    'PENDING',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'RETURNED'
  ];
  
  
  constructor(private orderService: OrderService, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loadUserOrders();
  }

  loadUserOrders(): void {
    this.isLoading = true;
    const user = this.authService.getDecodedToken();
    const userId = user ? user.id : null;

    if (!userId) {
      this.error = 'User not authenticated. Please login again.';
      this.isLoading = false;
      return;
    }

    this.orderService.getOrderByUserId(userId).subscribe({
      next: (orders) => {
        this.userOrders = orders;
        this.updatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching orders:', err);
        this.error = 'Failed to load orders. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  updatePagination(): void {
    const filtered = this.filteredOrders();
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
  }

  filteredOrders(): UserOrderListDTO[] {
    return this.selectedStatus
      ? this.userOrders.filter(order => order.status.toUpperCase() === this.selectedStatus.toUpperCase())
      : this.userOrders;
  }
  

  paginatedOrders(): UserOrderListDTO[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredOrders().slice(start, start + this.itemsPerPage);
  }

  onStatusFilterChange(event: any): void {
    this.selectedStatus = event.target.value;
    this.updatePagination();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end === this.totalPages) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  toggleOrderDetails(orderId: number): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  isOrderExpanded(order: UserOrderListDTO): boolean {
    return this.expandedOrderId === order.orderId;
  }

  getTotalItems(order: UserOrderListDTO): number {
    return order.products.reduce((total, p) => total + p.quantity, 0);
  }

  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-warning text-dark';
      case 'processing': return 'bg-info text-dark';
      case 'delivered': return 'bg-success';
      case 'cancelled': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  formatOrderDate(dateString: string): Date {
    return new Date(dateString);
  }

  formatStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  goToTracking(orderId: number): void {
    this.router.navigate(['/ordertracking', orderId ]);
  }
}
