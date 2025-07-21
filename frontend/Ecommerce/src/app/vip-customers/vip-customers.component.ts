import { Component, OnInit, AfterViewInit, OnDestroy, AfterViewChecked } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ImageService } from '../services/image.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { UserService } from '../services/user.service';
import { VipTier, VipTierService } from '../services/vip-tier.service';

interface VipCustomer {
  userId: number;
  name: string;
  email: string;
  phoneNumber?: string;
  status: string;
  roleName: string;
  joinDate: string;
  totalOrders: number;
  totalSpent: number;
  profileImage?: string;
  tier: 'Regular' | 'Silver' | 'Gold' | 'Platinum';
  // Static/mock fields for UI completeness
  location?: string;
  spendingTrend?: 'up' | 'down';
  spendingChange?: number;
  avgOrderValue?: number;
  lastOrderDate?: string;
  lastOrderAmount?: number;
  segments?: string[];
}

interface Order {
  id: string;
  date: Date;
  amount: number;
  status: 'completed' | 'pending' | 'cancelled';
}

interface SearchResult {
  id: string;
  name: string;
  email: string;
  avatar: string;
  totalOrders: number;
  totalSpent: number;
}

declare var lucide: any;

@Component({
  selector: 'app-vip-customers',
  templateUrl: './vip-customers.component.html',
  standalone: true,
  styleUrls: ['./vip-customers.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule
  ]
})
export class VipCustomersComponent implements OnInit, AfterViewInit, OnDestroy, AfterViewChecked {
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

  showCustomerModal = false;
  customerTab: 'overview' | 'orders' | 'benefits' = 'overview';

  // VIP Tiers configuration
  // Remove the hardcoded vipTiers array
  // VIP Tier management state
  showAddTierModal = false;
  showTierListModal = false;
  tiers: VipTier[] = [];
  tierForm: FormGroup;
  editTierId: number | null = null;
  showTierDropdown: boolean = false;

  constructor(
    private fb: FormBuilder,
    public imageService: ImageService,
    private userService: UserService,
    private vipTierService: VipTierService
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
    this.tierForm = this.fb.group({
      name: [''],
      description: [''],
      minPoints: [0],
      icon: [''],
      color: [''],
      benefits: [''],
      order: [0]
    });
  }

  ngOnInit(): void {
    this.loadVipCustomers();
    this.loadTiers();
    this.handleResponsiveView();
    window.addEventListener('resize', this.handleResponsiveView.bind(this));
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.handleResponsiveView.bind(this));
  }

  handleResponsiveView() {
    if (window.innerWidth < 900 && this.viewMode === 'table') {
      this.setViewMode('cards');
    }
  }

  ngAfterViewInit(): void {
    if ((window as any)['lucide']) {
      (window as any)['lucide'].createIcons();
    }
  }

  ngAfterViewChecked(): void {}

  loadVipCustomers(): void {
    this.userService.getVipCustomers().subscribe((customers: VipCustomer[]) => {
      this.allCustomers = customers.map(c => ({
        ...c,
        location: c.location ?? 'Yangon, MM',
        spendingTrend: c.spendingTrend ?? (Math.random() > 0.5 ? 'up' : 'down'),
        spendingChange: c.spendingChange ?? Math.floor(Math.random() * 30) + 1,
        avgOrderValue: c.avgOrderValue ?? (c.totalOrders > 0 ? Math.round((c.totalSpent / c.totalOrders) * 100) / 100 : 0),
        lastOrderDate: c.lastOrderDate ?? '2024-06-01',
        lastOrderAmount: c.lastOrderAmount ?? Math.floor(Math.random() * 500) + 50,
        segments: c.segments ?? ['high_spender', 'frequent_buyer', 'influencer', 'wholesale'].filter(() => Math.random() > 0.5),
        status: c.status && (c.status.toLowerCase() === 'active' || c.status.toLowerCase() === 'inactive') ? c.status.toLowerCase() : 'active'
      }));
      this.applyFilters();
      setTimeout(() => {
        if ((window as any)['lucide']) {
          (window as any)['lucide'].createIcons();
        }
      });
    });
  }

  // Statistics getters
  get totalVipCustomers(): number {
    return this.allCustomers.length;
  }

  get totalVipRevenue(): number {
    return this.allCustomers.reduce((total, customer) => total + customer.totalSpent, 0);
  }

  get averageOrderValue(): number {
    const totalValue = this.allCustomers.reduce((total, customer) => total + customer.totalSpent, 0);
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

      const matchesTier = !this.tierFilter || customer.tier === this.tierFilter;
      const matchesStatus = !this.statusFilter || customer.status === this.statusFilter;
      // Remove matchesSegment
      return matchesSearch && matchesTier && matchesStatus;
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
      this.selectedCustomers = this.paginatedCustomers.map(customer => customer.userId.toString());
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
    this.showCustomerModal = true;
    setTimeout(() => {
      if ((window as any)['lucide']) {
        (window as any)['lucide'].createIcons();
      }
    });
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
      this.allCustomers = this.allCustomers.filter(c => c.userId !== customer.userId);
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

  bulkDelete(): void {
    if (!this.selectedCustomers.length) return;
    if (!confirm(`Are you sure you want to delete ${this.selectedCustomers.length} selected VIP customers? This action cannot be undone.`)) return;
    this.allCustomers = this.allCustomers.filter(c => !this.selectedCustomers.includes(c.userId.toString()));
    this.applyFilters();
    this.selectedCustomers = [];
    setTimeout(() => {
      if ((window as any)['lucide']) (window as any)['lucide'].createIcons();
    });
  }

  bulkChangeStatus(): void {
    if (!this.selectedCustomers.length) return;
    if (!confirm(`Toggle status for ${this.selectedCustomers.length} selected VIP customers?`)) return;
    this.allCustomers = this.allCustomers.map(c =>
      this.selectedCustomers.includes(c.userId.toString())
        ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' }
        : c
    );
    this.applyFilters();
    this.selectedCustomers = [];
    setTimeout(() => {
      if ((window as any)['lucide']) (window as any)['lucide'].createIcons();
    });
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

  // Update getVipBenefits to use tiers
  getVipBenefits(tier: string): string[] {
    const tierConfig = this.tiers.find(t => t.name === tier);
    return tierConfig ? tierConfig.benefits.split(',').map(b => b.trim()) : [];
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
    const headers = ['Name', 'Email', 'VIP Tier', 'Total Spent', 'Total Orders', 'Status'];
    const rows = this.filteredCustomers.map(customer => [
      customer.name,
      customer.email,
      customer.tier,
      customer.totalSpent.toString(),
      customer.totalOrders.toString(),
      customer.status
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  trackByCustomerId(index: number, customer: VipCustomer): number {
    return customer.userId;
  }

  getVipIconColor(tier: string): string {
    switch (tier) {
      case 'Platinum':
        return 'text-purple-700';
      case 'Gold':
        return 'text-yellow-700';
      case 'Silver':
        return 'text-gray-700';
      default:
        return 'text-gray-700';
    }
  }

  getLucideIconName(tier: string): string {
    switch (tier) {
      case 'Platinum':
        return 'crown';
      case 'Gold':
        return 'award';
      case 'Silver':
        return 'star';
      default:
        return 'user';
    }
  }

  closeCustomerModal(): void {
    this.showCustomerModal = false;
    this.selectedCustomerDetails = null;
  }

  setCustomerTab(tab: 'overview' | 'orders' | 'benefits'): void {
    this.customerTab = tab;
  }

  // VIP Tier management methods
  openAddTierModal() {
    this.showAddTierModal = true;
    this.showTierListModal = false;
    setTimeout(() => { if ((window as any)['lucide']) (window as any)['lucide'].createIcons(); });
  }
  closeAddTierModal() {
    this.showAddTierModal = false;
    this.resetTierForm();
  }
  openTierListModal() {
    this.showTierListModal = true;
    this.showAddTierModal = false;
    setTimeout(() => { if ((window as any)['lucide']) (window as any)['lucide'].createIcons(); });
  }
  closeTierListModal() {
    this.showTierListModal = false;
  }
  loadTiers() {
    this.vipTierService.getAll().subscribe(tiers => {
      this.tiers = tiers.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setTimeout(() => {
        if ((window as any)['lucide']) {
          (window as any)['lucide'].createIcons();
        }
      });
    });
  }
  onTierSubmit() {
    const tier: VipTier = this.tierForm.value;
    if (this.editTierId) {
      this.vipTierService.update(this.editTierId, tier).subscribe(() => { this.loadTiers(); this.resetTierForm(); this.closeAddTierModal(); });
    } else {
      this.vipTierService.create(tier).subscribe(() => { this.loadTiers(); this.resetTierForm(); this.closeAddTierModal(); });
    }
  }
  editTier(tier: VipTier) {
    this.tierForm.patchValue(tier);
    this.editTierId = tier.id ?? null;
    this.openAddTierModal();
  }
  deleteTier(id?: number) {
    if (id && confirm('Delete this tier?')) {
      this.vipTierService.delete(id).subscribe(() => this.loadTiers());
    }
  }
  resetTierForm() {
    this.editTierId = null;
    this.tierForm.reset({ minPoints: 0, order: 0 });
  }

  // Add trackByTierId for tiers
  trackByTierId(index: number, tier: VipTier): number | undefined {
    return tier.id;
  }
}
