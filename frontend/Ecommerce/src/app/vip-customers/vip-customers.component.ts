import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ImageService } from '../services/image.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

interface VipCustomer {
  id: string;
  name: string;
  email: string;
  avatar: string;
  vipTier: 'silver' | 'gold' | 'platinum';
  totalSpent: number;
  totalOrders: number;
  avgOrderValue: number;
  lastOrderDate: Date;
  lastOrderAmount: number;
  status: 'active' | 'inactive';
  segments: string[];
  location?: string;
  spendingTrend: 'up' | 'down';
  spendingChange: number;
  loyaltyPoints: number;
  joinedDate: Date;
  specialNotes?: string;
  recentOrders: Order[];
}

interface Order {
  id: string;
  date: Date;
  amount: number;
  status: 'completed' | 'pending' | 'cancelled';
}

interface VipTier {
  level: string;
  name: string;
  description: string;
  icon: string;
  customerCount: number;
  revenue: number;
  benefits: string[];
  minSpending: number;
}

interface SearchResult {
  id: string;
  name: string;
  email: string;
  avatar: string;
  totalOrders: number;
  totalSpent: number;
}

@Component({
  selector: 'app-vip-customers',
  templateUrl: './vip-customers.component.html',
  standalone: true,
  styleUrls: ['./vip-customers.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class VipCustomersComponent implements OnInit {
  // Data properties
  allCustomers: VipCustomer[] = [];
  filteredCustomers: VipCustomer[] = [];
  paginatedCustomers: VipCustomer[] = [];
  selectedCustomers: string[] = [];
  selectedCustomerDetails: VipCustomer | null = null;
  searchResults: SearchResult[] = [];

  // Filter properties
  searchTerm = '';
  tierFilter = '';
  statusFilter = '';
  segmentFilter = '';

  // UI state
  viewMode: 'table' | 'cards' = 'table';
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // Form
  vipForm: FormGroup;

  // Utility property
  Math = Math;

  // VIP Tiers configuration
  vipTiers: VipTier[] = [
    {
      level: 'silver',
      name: 'Silver VIP',
      description: 'Entry-level VIP with basic perks',
      icon: 'fas fa-medal',
      customerCount: 45,
      revenue: 125000,
      benefits: [
        '5% discount on all orders',
        'Free shipping on orders over $50',
        'Early access to sales',
        'Birthday discount'
      ],
      minSpending: 500
    },
    {
      level: 'gold',
      name: 'Gold VIP',
      description: 'Premium VIP with enhanced benefits',
      icon: 'fas fa-trophy',
      customerCount: 28,
      revenue: 280000,
      benefits: [
        '10% discount on all orders',
        'Free shipping on all orders',
        'Exclusive product previews',
        'Priority customer support',
        'Quarterly gift box',
        'VIP-only events'
      ],
      minSpending: 1500
    },
    {
      level: 'platinum',
      name: 'Platinum VIP',
      description: 'Ultimate VIP experience with maximum benefits',
      icon: 'fas fa-crown',
      customerCount: 12,
      revenue: 360000,
      benefits: [
        '15% discount on all orders',
        'Free express shipping worldwide',
        'Personal shopping assistant',
        'Exclusive limited editions',
        'Monthly luxury gift box',
        'Private VIP events',
        'Custom product requests',
        'Dedicated account manager'
      ],
      minSpending: 5000
    }
  ];

  constructor(
    private fb: FormBuilder,
    public imageService: ImageService
  ) {
    this.vipForm = this.fb.group({
      customerSearch: ['', Validators.required],
      vipTier: ['', Validators.required],
      highSpender: [false],
      frequentBuyer: [false],
      influencer: [false],
      wholesale: [false],
      specialNotes: ['']
    });
  }

  ngOnInit(): void {
    this.loadVipCustomers();
  }

  loadVipCustomers(): void {
    // Mock data - replace with actual API call
    this.allCustomers = this.generateMockVipCustomers();
    this.applyFilters();
  }

  generateMockVipCustomers(): VipCustomer[] {
    const customers: VipCustomer[] = [];
    const names = [
      'Alexandra Thompson', 'Marcus Johnson', 'Isabella Rodriguez', 'James Wilson',
      'Sophia Chen', 'David Martinez', 'Emma Davis', 'Michael Brown',
      'Olivia Taylor', 'Christopher Lee', 'Ava Anderson', 'Daniel Garcia',
      'Mia Jackson', 'Matthew White', 'Charlotte Harris', 'Anthony Clark',
      'Amelia Lewis', 'Joshua Robinson', 'Harper Walker', 'Andrew Hall'
    ];
    
    const locations = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ'];
    const tiers: VipCustomer['vipTier'][] = ['silver', 'gold', 'platinum'];
    const segments = ['high_spender', 'frequent_buyer', 'influencer', 'wholesale'];

    for (let i = 0; i < 85; i++) {
      const tier = tiers[Math.floor(Math.random() * tiers.length)];
      const baseSpending = tier === 'platinum' ? 5000 : tier === 'gold' ? 1500 : 500;
      const totalSpent = baseSpending + Math.random() * baseSpending * 3;
      const totalOrders = Math.floor(totalSpent / (100 + Math.random() * 300));
      const avgOrderValue = totalSpent / totalOrders;

      const recentOrders: Order[] = [];
      for (let j = 0; j < 5; j++) {
        recentOrders.push({
          id: `ORD${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
          amount: 50 + Math.random() * 500,
          status: ['completed', 'pending', 'cancelled'][Math.floor(Math.random() * 3)] as Order['status']
        });
      }

      customers.push({
        id: `VIP${String(i + 1).padStart(3, '0')}`,
        name: names[i % names.length] || `VIP Customer ${i + 1}`,
        email: `vip${i + 1}@example.com`,
        avatar: `https://ui-avatars.com/api/?name=${names[i % names.length]}`,
        vipTier: tier,
        totalSpent,
        totalOrders,
        avgOrderValue,
        lastOrderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        lastOrderAmount: 50 + Math.random() * 300,
        status: Math.random() > 0.1 ? 'active' : 'inactive',
        segments: segments.filter(() => Math.random() > 0.6),
        location: locations[Math.floor(Math.random() * locations.length)],
        spendingTrend: Math.random() > 0.3 ? 'up' : 'down',
        spendingChange: Math.floor(Math.random() * 30) + 5,
        loyaltyPoints: Math.floor(totalSpent * 0.1),
        joinedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        specialNotes: Math.random() > 0.7 ? 'Prefers premium products' : undefined,
        recentOrders: recentOrders.sort((a, b) => b.date.getTime() - a.date.getTime())
      });
    }

    return customers.sort((a, b) => b.totalSpent - a.totalSpent);
  }

  // Statistics getters
  get totalVipCustomers(): number {
    return this.allCustomers.length;
  }

  get totalVipRevenue(): number {
    return this.allCustomers.reduce((total, customer) => total + customer.totalSpent, 0);
  }

  get averageOrderValue(): number {
    const totalValue = this.allCustomers.reduce((total, customer) => total + customer.avgOrderValue, 0);
    return totalValue / this.allCustomers.length;
  }

  get loyaltyScore(): number {
    const activeCustomers = this.allCustomers.filter(c => c.status === 'active').length;
    return Math.round((activeCustomers / this.allCustomers.length) * 100);
  }

  // Filter methods
  applyFilters(): void {
    this.filteredCustomers = this.allCustomers.filter(customer => {
      const matchesSearch = !this.searchTerm || 
        customer.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesTier = !this.tierFilter || customer.vipTier === this.tierFilter;
      const matchesStatus = !this.statusFilter || customer.status === this.statusFilter;
      const matchesSegment = !this.segmentFilter || customer.segments.includes(this.segmentFilter);

      return matchesSearch && matchesTier && matchesStatus && matchesSegment;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.tierFilter = '';
    this.statusFilter = '';
    this.segmentFilter = '';
    this.applyFilters();
  }

  // Pagination methods
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCustomers.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedCustomers = this.filteredCustomers.slice(startIndex, endIndex);
  }

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
      this.selectedCustomers = this.paginatedCustomers.map(customer => customer.id);
    } else {
      this.selectedCustomers = [];
    }
  }

  toggleCustomerSelection(customerId: string, event: any): void {
    if (event.target && event.target.type === 'checkbox') {
      if (event.target.checked) {
        this.selectedCustomers.push(customerId);
      } else {
        this.selectedCustomers = this.selectedCustomers.filter(id => id !== customerId);
      }
    } else {
      // Handle card click
      if (this.selectedCustomers.includes(customerId)) {
        this.selectedCustomers = this.selectedCustomers.filter(id => id !== customerId);
      } else {
        this.selectedCustomers.push(customerId);
      }
    }
  }

  // View methods
  setViewMode(mode: 'table' | 'cards'): void {
    this.viewMode = mode;
  }

  // Customer management methods
  openAddVipModal(): void {
    this.vipForm.reset();
    this.searchResults = [];
    // Modal would be triggered via Bootstrap JS or Angular CDK
  }

  selectCustomerFromSearch(customer: SearchResult): void {
    this.vipForm.patchValue({
      customerSearch: `${customer.name} (${customer.email})`
    });
    this.searchResults = [];
  }

  saveVipCustomer(): void {
    if (this.vipForm.valid) {
      const formValue = this.vipForm.value;
      console.log('Adding VIP customer:', formValue);
      // Implement save logic
      alert('VIP customer added successfully!');
      // Close modal and refresh data
    }
  }

  viewCustomerDetails(customer: VipCustomer): void {
    this.selectedCustomerDetails = customer;
    // Modal would be triggered via Bootstrap JS or Angular CDK
  }

  editCustomer(customer: VipCustomer): void {
    console.log('Edit customer:', customer);
    // Implement edit functionality
  }

  sendPersonalOffer(customer: VipCustomer): void {
    console.log('Send personal offer to:', customer);
    alert(`Personal offer sent to ${customer.name}!`);
  }

  viewOrderHistory(customer: VipCustomer): void {
    console.log('View order history for:', customer);
    // Navigate to order history or open modal
  }

  changeVipTier(customer: VipCustomer): void {
    console.log('Change VIP tier for:', customer);
    // Implement tier change functionality
  }

  removeVipStatus(customer: VipCustomer): void {
    if (confirm(`Remove VIP status for ${customer.name}?`)) {
      this.allCustomers = this.allCustomers.filter(c => c.id !== customer.id);
      this.applyFilters();
      console.log('VIP status removed for:', customer);
    }
  }

  // Bulk actions
  sendTargetedPromotion(): void {
    if (this.selectedCustomers.length === 0) {
      alert('Please select customers first');
      return;
    }
    console.log('Send targeted promotion to:', this.selectedCustomers);
    alert(`Promotion sent to ${this.selectedCustomers.length} customers!`);
  }

  sendExclusiveOffer(): void {
    if (this.selectedCustomers.length === 0) {
      alert('Please select customers first');
      return;
    }
    console.log('Send exclusive offer to:', this.selectedCustomers);
    alert(`Exclusive offer sent to ${this.selectedCustomers.length} customers!`);
  }

  inviteToEvent(): void {
    if (this.selectedCustomers.length === 0) {
      alert('Please select customers first');
      return;
    }
    console.log('Invite to event:', this.selectedCustomers);
    alert(`Event invitation sent to ${this.selectedCustomers.length} customers!`);
  }

  updateVipTier(): void {
    if (this.selectedCustomers.length === 0) {
      alert('Please select customers first');
      return;
    }
    console.log('Update VIP tier for:', this.selectedCustomers);
    // Implement bulk tier update
  }

  // Utility methods
  getVipIcon(tier: string): string {
    const icons = {
      silver: 'fas fa-medal',
      gold: 'fas fa-trophy',
      platinum: 'fas fa-crown'
    };
    return icons[tier as keyof typeof icons] || 'fas fa-star';
  }

  getStatusIcon(status: string): string {
    const icons = {
      active: 'fas fa-check-circle',
      inactive: 'fas fa-pause-circle'
    };
    return icons[status as keyof typeof icons] || 'fas fa-question-circle';
  }

  getSegmentLabel(segment: string): string {
    const labels = {
      high_spender: 'High Spender',
      frequent_buyer: 'Frequent Buyer',
      influencer: 'Influencer',
      wholesale: 'Wholesale'
    };
    return labels[segment as keyof typeof labels] || segment;
  }

  getVipBenefits(tier: string): string[] {
    const tierConfig = this.vipTiers.find(t => t.level === tier);
    return tierConfig ? tierConfig.benefits : [];
  }

  refreshData(): void {
    this.loadVipCustomers();
    console.log('Data refreshed');
  }

  exportVipCustomers(): void {
    const csvContent = this.generateVipCustomersCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vip-customers-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  generateVipCustomersCSV(): string {
    const headers = ['Name', 'Email', 'VIP Tier', 'Total Spent', 'Total Orders', 'Avg Order Value', 'Status', 'Segments'];
    const rows = this.filteredCustomers.map(customer => [
      customer.name,
      customer.email,
      customer.vipTier,
      customer.totalSpent.toString(),
      customer.totalOrders.toString(),
      customer.avgOrderValue.toFixed(2),
      customer.status,
      customer.segments.join('; ')
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  trackByCustomerId(index: number, customer: VipCustomer): string {
    return customer.id;
  }
}
