import { Component, OnInit } from '@angular/core';

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

  ngOnInit(): void {
    this.loadCustomers();
    this.calculateStats();
  }

  loadCustomers(): void {
    // Mock data - replace with actual API call
    this.customers = [
      {
        id: 'CUST001',
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '+1 (555) 123-4567',
        avatar: '/placeholder.svg?height=40&width=40',
        status: 'active',
        joinDate: new Date('2023-01-15'),
        totalOrders: 24,
        totalSpent: 2450.75,
        addresses: [
          {
            type: 'billing',
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001'
          }
        ]
      },
      {
        id: 'CUST002',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+1 (555) 234-5678',
        avatar: '/placeholder.svg?height=40&width=40',
        status: 'active',
        joinDate: new Date('2023-03-22'),
        totalOrders: 18,
        totalSpent: 1875.50,
        addresses: [
          {
            type: 'shipping',
            street: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            zip: '90210'
          }
        ]
      },
      {
        id: 'CUST003',
        name: 'Michael Brown',
        email: 'michael.brown@email.com',
        phone: '+1 (555) 345-6789',
        avatar: '/placeholder.svg?height=40&width=40',
        status: 'inactive',
        joinDate: new Date('2022-11-08'),
        totalOrders: 12,
        totalSpent: 980.25,
        addresses: [
          {
            type: 'billing',
            street: '789 Pine St',
            city: 'Chicago',
            state: 'IL',
            zip: '60601'
          }
        ]
      },
      {
        id: 'CUST004',
        name: 'Emily Davis',
        email: 'emily.davis@email.com',
        phone: '+1 (555) 456-7890',
        avatar: '/placeholder.svg?height=40&width=40',
        status: 'active',
        joinDate: new Date('2024-01-10'),
        totalOrders: 8,
        totalSpent: 650.00,
        addresses: [
          {
            type: 'shipping',
            street: '321 Elm St',
            city: 'Houston',
            state: 'TX',
            zip: '77001'
          }
        ]
      },
      {
        id: 'CUST005',
        name: 'David Wilson',
        email: 'david.wilson@email.com',
        phone: '+1 (555) 567-8901',
        avatar: '/placeholder.svg?height=40&width=40',
        status: 'suspended',
        joinDate: new Date('2023-07-14'),
        totalOrders: 5,
        totalSpent: 325.75,
        addresses: [
          {
            type: 'billing',
            street: '654 Maple Ave',
            city: 'Phoenix',
            state: 'AZ',
            zip: '85001'
          }
        ]
      }
    ];

    this.applyFilters();
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

  // Customer actions
  viewCustomerDetails(customer: Customer): void {
    this.selectedCustomerDetails = customer;
    // You would typically use a modal service here
    // For now, we'll assume Bootstrap modal is triggered via data attributes
  }

  editCustomer(customer: Customer): void {
    console.log('Edit customer:', customer);
    // Implement edit functionality
  }

  toggleCustomerStatus(customer: Customer): void {
    const newStatus = customer.status === 'active' ? 'inactive' : 'active';
    customer.status = newStatus;
    console.log(`Customer ${customer.name} status changed to ${newStatus}`);
    this.calculateStats();
  }

  deleteCustomer(customer: Customer): void {
    if (confirm(`Are you sure you want to delete ${customer.name}?`)) {
      this.customers = this.customers.filter(c => c.id !== customer.id);
      this.applyFilters();
      this.calculateStats();
      console.log('Customer deleted:', customer);
    }
  }

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
}