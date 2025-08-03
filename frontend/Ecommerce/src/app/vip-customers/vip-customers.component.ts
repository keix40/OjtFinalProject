import { Component, OnInit, AfterViewInit, OnDestroy, AfterViewChecked, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ImageService } from '../services/image.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { UserService } from '../services/user.service';
import { VipTier, VipTierService } from '../services/vip-tier.service';
import { VipStatsService } from '../services/vip-stats.service';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
  // Backend calculated spending data
  spendingTrend?: 'up' | 'down';
  spendingChange?: number;
  currentPeriodSpent?: number;
  previousPeriodSpent?: number;
  // Calculated fields for UI display
  location?: string;
  avgOrderValue?: number;
  lastOrderDate?: string;
  lastOrderAmount?: number;

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
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
  vipTiersForOverview: VipTier[] = []; // Tiers excluding the lowest tier for overview display
  tierForm: FormGroup;
  editTierId: number | null = null;
  showTierDropdown: boolean = false;
  showLoyaltyTooltip: boolean = false;

  public activeCustomersCount = 0;
  public allCustomersCount = 0;
  public activeCustomerScore = 0;
  public maxActiveCustomerScore = 30;
  loyaltyScoreGrowth: number | null = null;
  loyaltyScoreBackend: number | null = null;

  // Dashboard stats
  customersGrowth: any = null;
  revenueGrowth: any = null;
  avgOrderValueComparison: any = null;



  // Performance optimization
  private destroy$ = new Subject<void>();
  searchControl = new FormControl('');
  private _loyaltyScore: number | null = null;

  constructor(
    private fb: FormBuilder,
    public imageService: ImageService,
    private userService: UserService,
    private vipTierService: VipTierService,
    private vipStatsService: VipStatsService
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
      order: [0],
      weight: [5]
    });
  }

  ngOnInit(): void {
    this.loadTiersAndThenCustomers();
    this.handleResponsiveView();
    window.addEventListener('resize', this.handleResponsiveView.bind(this));
    
    // Load dashboard stats with error handling
    this.vipStatsService.getCustomersGrowth()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => this.customersGrowth = data,
        error: error => console.error('Error loading customers growth:', error)
      });
    
    this.vipStatsService.getRevenueGrowth()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => this.revenueGrowth = data,
        error: error => console.error('Error loading revenue growth:', error)
      });
    
    this.vipStatsService.getAvgOrderValueComparison()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => this.avgOrderValueComparison = data,
        error: error => console.error('Error loading order value comparison:', error)
      });
    
    this.vipStatsService.getLoyaltyScoreGrowth()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.loyaltyScoreBackend = data.currentQuarterScore;
          this.loyaltyScoreGrowth = data.growthPercent;
        },
        error: error => console.error('Error loading loyalty score growth:', error)
      });

    // Debounced search
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.searchTerm = value || '';
      this.applyFilters();
    });
  }

  loadTiersAndThenCustomers(): void {
    // Load tiers and customers in parallel since backend handles filtering
    this.vipTierService.getAllVipTiers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: tiers => {
          this.tiers = tiers.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          
          // Filter out the lowest tier for VIP Tiers Overview display
          if (this.tiers.length > 0) {
            const minMinPoints = Math.min(...this.tiers.map(tier => tier.minPoints));
            this.vipTiersForOverview = this.tiers.filter(tier => tier.minPoints > minMinPoints);
          } else {
            this.vipTiersForOverview = [];
          }
          
          // Initialize icons immediately after tiers are loaded
          this.initializeIcons();
        },
        error: error => {
          console.error('Error loading tiers:', error);
        }
      });
    
    this.loadVipCustomers();
  }

  // calculateLoyaltyScoreGrowth() { // Removed frontend calculation
  //   // Current quarter
  //   const now = new Date();
  //   const currentQuarter = Math.floor((now.getMonth()) / 3) + 1;
  //   const currentYear = now.getFullYear();
  //   // Previous quarter
  //   let prevQuarter = currentQuarter - 1;
  //   let prevYear = currentYear;
  //   if (prevQuarter === 0) {
  //     prevQuarter = 4;
  //     prevYear--;
  //   }
  //   // Helper to get quarter from date
  //   function getQuarter(date: Date) {
  //     return Math.floor(date.getMonth() / 3) + 1;
  //   }
  //   // Customers from previous quarter
  //   const prevQuarterCustomers = this.allCustomers.filter(c => {
  //     if (!c.lastOrderDate) return false;
  //     const d = new Date(c.lastOrderDate);
  //     return d.getFullYear() === prevYear && getQuarter(d) === prevQuarter;
  //   });
  //   // Calculate loyalty score for previous quarter
  //   const prevScore = this.calculateLoyaltyScoreForCustomers(prevQuarterCustomers);
  //   const currScore = this.loyaltyScore;
  //   if (prevScore === 0) {
  //     this.loyaltyScoreGrowth = null;
  //   } else {
  //     this.loyaltyScoreGrowth = Math.round(((currScore - prevScore) / prevScore) * 100);
  //   }
  // }

  // calculateLoyaltyScoreForCustomers(customers: any[]): number { // Removed frontend calculation
  //   if (customers.length === 0) return 0;
  //   let totalScore = 0;
  //   let maxPossibleScore = 0;
  //   // Factor 1: Active customers (30% weight)
  //   const activeCustomersCount = customers.filter(c => c.status === 'active' && c.totalOrders > 0).length;
  //   const activeCustomerScore = (activeCustomersCount / customers.length) * 30;
  //   totalScore += activeCustomerScore;
  //   maxPossibleScore += 30;
  //   // Factor 2: VIP Tier distribution (25% weight)
  //   const tierScores: Record<string, number> = {};
  //   this.tiers.forEach(tier => {
  //     tierScores[tier.name] = tier.weight || 5;
  //   });
  //   const tierDistribution = customers.reduce((acc, customer) => {
  //     acc[customer.tier] = (acc[customer.tier] || 0) + 1;
  //     return acc;
  //   }, {} as Record<string, number>);
  //   let tierScore = 0;
  //   Object.entries(tierDistribution).forEach(([tier, count]) => {
  //     const tierWeight = tierScores[tier as keyof typeof tierScores] || 5;
  //     tierScore += (Number(count) / customers.length) * tierWeight;
  //   });
  //   totalScore += tierScore;
  //   maxPossibleScore += 25;
  //   // Factor 3: Average order value (20% weight)
  //   const avgOrderValue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0) / customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
  //   const orderValueScore = Math.min((avgOrderValue / 100000) * 20, 20);
  //   totalScore += orderValueScore;
  //   maxPossibleScore += 20;
  //   // Factor 4: Customer retention (15% weight)
  //   const customersWithMultipleOrders = customers.filter(c => c.totalOrders > 1).length;
  //   const retentionScore = (customersWithMultipleOrders / customers.length) * 15;
  //   totalScore += retentionScore;
  //   maxPossibleScore += 15;
  //   // Factor 5: Recent activity (10% weight)
  //   const recentCustomers = customers.filter(c => {
  //     const lastOrderDate = new Date(c.lastOrderDate || '2024-01-01');
  //     const thirtyDaysAgo = new Date();
  //     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  //     return lastOrderDate > thirtyDaysAgo;
  //   }).length;
  //   const recentActivityScore = (recentCustomers / customers.length) * 10;
  //   totalScore += recentActivityScore;
  //   maxPossibleScore += 10;
  //   return Math.round((totalScore / maxPossibleScore) * 100);
  // }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.handleResponsiveView.bind(this));
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleResponsiveView() {
    if (window.innerWidth < 900 && this.viewMode === 'table') {
      this.setViewMode('cards');
    }
  }

  ngAfterViewInit(): void {
    this.initializeIcons();
  }

  // Initialize Lucide icons
  initializeIcons(): void {
    // Use setTimeout to ensure DOM is ready, but with a shorter delay
    setTimeout(() => {
      if ((window as any)['lucide'] && (window as any)['lucide'].createIcons) {
        (window as any)['lucide'].createIcons();
      }
    }, 10);
  }

  ngAfterViewChecked(): void {}

  loadVipCustomers(): void {
    this.userService.getVipCustomers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customers: VipCustomer[]) => {
          // Backend now handles filtering out the lowest tier, so we just map the data
          this.allCustomers = customers.map(c => ({
            ...c,
            location: c.location ?? 'Yangon, MM',
            // Use backend calculated spending data
            spendingTrend: c.spendingTrend as 'up' | 'down' || this.calculateSpendingTrend(c),
            spendingChange: c.spendingChange ?? this.calculateSpendingChange(c),
            avgOrderValue: c.avgOrderValue ?? (c.totalOrders > 0 ? Math.round((c.totalSpent / c.totalOrders) * 100) / 100 : 0),
            lastOrderDate: c.lastOrderDate ?? '2024-06-01',
            lastOrderAmount: c.lastOrderAmount ?? 0,

            status: c.status && (c.status.toLowerCase() === 'active' || c.status.toLowerCase() === 'inactive') ? c.status.toLowerCase() : 'active'
          }));
          this.allCustomersCount = this.allCustomers.length;
          this.activeCustomersCount = this.allCustomers.filter(c => c.status === 'active' && c.totalOrders > 0).length;
          this.activeCustomerScore = Math.round((this.activeCustomersCount / (this.allCustomersCount || 1)) * this.maxActiveCustomerScore);
          
          // Clear loyalty score cache when data changes
          this._loyaltyScore = null;
          
          this.applyFilters();
          
          // Initialize icons after customers are loaded
          this.initializeIcons();
        },
        error: error => {
          console.error('Error loading VIP customers:', error);
        }
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
    // Use backend value if available
    if (this.loyaltyScoreBackend !== null) return this.loyaltyScoreBackend;
    
    // Use cached value if available
    if (this._loyaltyScore !== null) return this._loyaltyScore;
    
    // fallback to frontend calculation
    const activeCustomers = this.allCustomers.filter(c => c.status === 'active' && c.totalOrders > 0);
    if (this.allCustomers.length === 0) return 0;
    
    // Calculate loyalty score based on multiple factors
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    // Factor 1: Active customers (30% weight)
    const activeCustomersCount = this.allCustomers.filter(c => c.status === 'active' && c.totalOrders > 0).length;
    const activeCustomerScore = (activeCustomersCount / this.allCustomers.length) * 30;
    totalScore += activeCustomerScore;
    maxPossibleScore += 30;
    
    // Factor 2: VIP Tier distribution (25% weight)
    const tierScores: Record<string, number> = {};
    this.tiers.forEach(tier => {
      tierScores[tier.name] = tier.weight || 5;
    });
    
    const tierDistribution = this.allCustomers.reduce((acc, customer) => {
      acc[customer.tier] = (acc[customer.tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    let tierScore = 0;
    Object.entries(tierDistribution).forEach(([tier, count]) => {
      const tierWeight = tierScores[tier as keyof typeof tierScores] || 5;
      tierScore += (count / this.allCustomers.length) * tierWeight;
    });
    totalScore += tierScore;
    maxPossibleScore += 25;
    
    // Factor 3: Average order value (20% weight)
    const avgOrderValue = this.averageOrderValue;
    const orderValueScore = Math.min((avgOrderValue / 100000) * 20, 20); // Normalize to 100k MMK
    totalScore += orderValueScore;
    maxPossibleScore += 20;
    
    // Factor 4: Customer retention (15% weight)
    const customersWithMultipleOrders = this.allCustomers.filter(c => c.totalOrders > 1).length;
    const retentionScore = (customersWithMultipleOrders / this.allCustomers.length) * 15;
    totalScore += retentionScore;
    maxPossibleScore += 15;
    
    // Factor 5: Recent activity (10% weight)
    const recentCustomers = this.allCustomers.filter(c => {
      const lastOrderDate = new Date(c.lastOrderDate || '2024-01-01');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return lastOrderDate > thirtyDaysAgo;
    }).length;
    const recentActivityScore = (recentCustomers / this.allCustomers.length) * 10;
    totalScore += recentActivityScore;
    maxPossibleScore += 10;
    
    // Calculate final percentage and cache it
    this._loyaltyScore = Math.round((totalScore / maxPossibleScore) * 100);
    return this._loyaltyScore;
  }

  // Get detailed loyalty score breakdown
  get loyaltyScoreBreakdown(): any {
    if (this.allCustomers.length === 0) return null;
    
    const activeCustomers = this.allCustomers.filter(c => c.status === 'active').length;
    const activeCustomerScore = (activeCustomers / this.allCustomers.length) * 30;
    
    const tierScores: Record<string, number> = {};
    this.tiers.forEach(tier => {
      tierScores[tier.name] = tier.weight || 5;
    });
    
    const tierDistribution = this.allCustomers.reduce((acc, customer) => {
      acc[customer.tier] = (acc[customer.tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    let tierScore = 0;
    Object.entries(tierDistribution).forEach(([tier, count]) => {
      const tierWeight = tierScores[tier as keyof typeof tierScores] || 5;
      tierScore += (count / this.allCustomers.length) * tierWeight;
    });
    
    const avgOrderValue = this.averageOrderValue;
    const orderValueScore = Math.min((avgOrderValue / 100000) * 20, 20);
    
    const customersWithMultipleOrders = this.allCustomers.filter(c => c.totalOrders > 1).length;
    const retentionScore = (customersWithMultipleOrders / this.allCustomers.length) * 15;
    
    const recentCustomers = this.allCustomers.filter(c => {
      const lastOrderDate = new Date(c.lastOrderDate || '2024-01-01');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return lastOrderDate > thirtyDaysAgo;
    }).length;
    const recentActivityScore = (recentCustomers / this.allCustomers.length) * 10;
    
    return {
      activeCustomers: {
        score: Math.round(activeCustomerScore),
        weight: 30,
        details: `${activeCustomers}/${this.allCustomers.length} active customers`
      },
      tierDistribution: {
        score: Math.round(tierScore),
        weight: 25,
        details: Object.entries(tierDistribution).map(([tier, count]) => `${tier}: ${count}`).join(', ')
      },
      averageOrderValue: {
        score: Math.round(orderValueScore),
        weight: 20,
        details: `$${Math.round(avgOrderValue).toLocaleString()} average order value`
      },
      customerRetention: {
        score: Math.round(retentionScore),
        weight: 15,
        details: `${customersWithMultipleOrders}/${this.allCustomers.length} customers with multiple orders`
      },
      recentActivity: {
        score: Math.round(recentActivityScore),
        weight: 10,
        details: `${recentCustomers}/${this.allCustomers.length} customers active in last 30 days`
      }
    };
  }

  // Filter methods
  applyFilters(): void {
    // Get the lowest tier to exclude from VIP customers
    const lowestTier = this.tiers.length > 0 ? 
      this.tiers.reduce((lowest, tier) => tier.minPoints < lowest.minPoints ? tier : lowest).name : 
      'Regular';

    this.filteredCustomers = this.allCustomers.filter(customer => {
      // Exclude customers with the lowest tier (Regular customers)
      if (customer.tier.toLowerCase() === lowestTier.toLowerCase()) {
        return false;
      }

      const matchesSearch = !this.searchTerm || 
        customer.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesTier = !this.tierFilter || customer.tier.toLowerCase() === this.tierFilter.toLowerCase();
      const matchesStatus = !this.statusFilter || customer.status === this.statusFilter;
      
      return matchesSearch && matchesTier && matchesStatus;
    });

    this.currentPage = 1;
    this.updatePagination();
    
    // Initialize icons after filtering
    this.initializeIcons();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.tierFilter = '';
    this.statusFilter = '';
    this.applyFilters();
    // Icons will be initialized in applyFilters()
  }

  // Pagination methods
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCustomers.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedCustomers = this.filteredCustomers.slice(startIndex, endIndex);
    
    // Initialize icons after pagination update
    this.initializeIcons();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      // Icons will be initialized in updatePagination()
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
    // Initialize icons after view mode change
    this.initializeIcons();
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
    this.initializeIcons();
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
      // Icons will be initialized in applyFilters()
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
    this.initializeIcons();
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
    this.initializeIcons();
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



  refreshData(): void {
    this.loadVipCustomers();
    this.loadTiers();
    
    // Reload growth stats
    this.vipStatsService.getCustomersGrowth()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => this.customersGrowth = data,
        error: error => console.error('Error refreshing customers growth:', error)
      });
    
    console.log('Data refreshed - Loyalty score will update automatically');
    // Icons will be initialized in loadVipCustomers() and loadTiers()
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
    const tierLower = tier.toLowerCase();
    switch (tierLower) {
      case 'platinum':
        return 'text-purple-700';
      case 'gold':
        return 'text-yellow-700';
      case 'silver':
        return 'text-gray-700';
      case 'regular':
        return 'text-blue-700';
      default:
        return 'text-gray-700';
    }
  }

  getLucideIconName(tier: string): string {
    const tierLower = tier.toLowerCase();
    switch (tierLower) {
      case 'platinum':
        return 'crown';
      case 'gold':
        return 'award';
      case 'silver':
        return 'star';
      case 'regular':
        return 'user';
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
    this.initializeIcons();
  }
  closeAddTierModal() {
    this.showAddTierModal = false;
    this.resetTierForm();
  }
  openTierListModal() {
    this.showTierListModal = true;
    this.showAddTierModal = false;
    this.initializeIcons();
  }
  closeTierListModal() {
    this.showTierListModal = false;
  }
  loadTiers() {
    this.vipTierService.getAllVipTiers().subscribe(tiers => {
      this.tiers = tiers.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      
      // Filter out the lowest tier for VIP Tiers Overview display
      if (this.tiers.length > 0) {
        const minMinPoints = Math.min(...this.tiers.map(tier => tier.minPoints));
        this.vipTiersForOverview = this.tiers.filter(tier => tier.minPoints > minMinPoints);
      } else {
        this.vipTiersForOverview = [];
      }
      
      this.initializeIcons();
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

  toggleLoyaltyTooltip(): void {
    this.showLoyaltyTooltip = !this.showLoyaltyTooltip;
  }

  // Calculate real spending trend for individual customers (fallback method)
  private calculateSpendingTrend(customer: VipCustomer): 'up' | 'down' {
    // Use backend data if available, otherwise fallback to simple calculation
    if (customer.spendingTrend) return customer.spendingTrend;
    
    // Fallback: use a simple logic based on total spent
    const avgSpent = customer.totalSpent / Math.max(customer.totalOrders, 1);
    return avgSpent > 50000 ? 'up' : 'down';
  }

  // Calculate real spending change percentage for individual customers (fallback method)
  private calculateSpendingChange(customer: VipCustomer): number {
    // Use backend data if available, otherwise fallback to simple calculation
    if (customer.spendingChange !== undefined) return customer.spendingChange;
    
    // Fallback: calculate based on average order value
    if (customer.totalOrders <= 1) return 0;
    
    const avgOrderValue = customer.totalSpent / customer.totalOrders;
    // Simple calculation: higher avg order value = positive trend
    const baseValue = 50000; // Base comparison value
    const change = ((avgOrderValue - baseValue) / baseValue) * 100;
    return Math.round(Math.max(-50, Math.min(50, change))); // Limit between -50% and +50%
  }


}
