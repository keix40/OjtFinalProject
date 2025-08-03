import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { PermissionService } from '../../services/permission.service';
import { ImageService } from '../../services/image.service';
import { AdminUserService } from '../../services/admin-user.service';
import { PermissionConstants } from '../../constants/permission.constants';
import { DashboardService } from '../../services/dashboard.service';
import { UserService } from '../../services/user.service';
import { AdminInboxService } from '../../services/admin-inbox.service';
import { VipTierService } from '../../services/vip-tier.service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, AfterViewInit {
  // Add PermissionConstants to component for template access
  protected PermissionConstants = PermissionConstants;
  isProductsOpen = false;
  isUsersOpen: boolean = false;
  isOrdersOpen: boolean = false;
  isContentOpen: boolean = false;
  isSettingsOpen: boolean = false;
   isDiscountsOpen:boolean = false; // add for discount adding and showing list by pmk june 28
  isDeliveryOpen: boolean = false; // independent delivery dropdown
  // Add to your component
  totalCustomers: number = 0;
  vipCount: number = 0;
  blacklistCount: number = 0;
  adminCount: number = 0;
  suspiciousLogins: number = 0;
  recentSecurityEvents: number = 0;
  tiers: any[] = []; // Store VIP tiers for filtering
  sidebarVisible: boolean = window.innerWidth >= 640; // Show sidebar by default on desktop
  sidebarCollapsed: boolean = true; // Start with collapsed sidebar
  currentMenu: string | null = null;
  currentSubmenu: string | null = null; // Track which submenu is active

  // Profile dropdown properties
  userName: string | null = null;
  userRoles: string[] = [];
  isLoggedIn: boolean = false;
  profileDropdownOpen: boolean = false;
  userProfileImage: string | null = null;
  userEmail: string | null = null;
  userStatus: string = 'Online';
  userData: any = null; // Store complete user data
  unreadMessages: number = 0; // For inbox notification count

  // Fetch these values from your backend

  private collapseTimeout: any;
  private refreshInterval: any;

  // Sidebar hover handlers for smooth animation and icon reinit
  onSidebarMouseEnter() {
    if (this.collapseTimeout) {
      clearTimeout(this.collapseTimeout);
    }
    this.sidebarCollapsed = false;
    // Reduced delay for smoother transition
    setTimeout(() => this.initializeIcons(), 50);
  }

  onSidebarMouseLeave() {
    this.collapseTimeout = setTimeout(() => {
      this.sidebarCollapsed = true;
      // Reduced delay for smoother transition
      setTimeout(() => this.initializeIcons(), 50);
    }, 120); // 120ms delay for smoothness
  }

  onProfileMouseEnter() {
    this.profileDropdownOpen = true;
  }

  onProfileMouseLeave() {
    this.profileDropdownOpen = false;
  }

  constructor(
    private router: Router,
    private authService: AuthService,
    public permissionService: PermissionService,
    private imageService: ImageService,
    private adminUserService: AdminUserService,
    private dashboardService: DashboardService,
    private userService: UserService,
    private adminInboxService: AdminInboxService,
    private vipTierService: VipTierService
  ) { }

  toggleSidebar() {
    // Only for mobile overlay
    this.sidebarVisible = !this.sidebarVisible;
  }

  toggleCollapsedSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    // Reinitialize icons after state change with reduced delay
    setTimeout(() => {
      this.initializeIcons();
    }, 30);
  }

  isMobile(): boolean {
    return window.innerWidth < 640;
  }

  ngOnInit(): void {
    // Debug: log current permissions
    console.log('[Sidebar] Permissions:', this.permissionService.getPermissions());
    window.addEventListener('resize', this.handleResize.bind(this));
    this.handleResize();
    this.loadUserInfo();
    this.loadCustomerCount();
    this.loadTiersAndVipCount();
    document.addEventListener('click', this.handleDocumentClick.bind(this));
    
    // Set up periodic refresh of counts (every 5 minutes)
    this.refreshInterval = setInterval(() => {
      this.refreshCounts();
    }, 5 * 60 * 1000); // 5 minutes
    this.adminUserService.getAdminUsers().subscribe(users => {
      this.adminCount = users.length;
    });
    // Log admin activity on sidebar load
    this.logAdminActivity('page_view');
  }

  ngAfterViewInit(): void {
    // Initialize Lucide icons after view is ready
    this.initializeIcons();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.handleResize.bind(this));
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private initializeIcons(): void {
    // Initialize Lucide icons
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }

  // Force reinitialize icons when needed
  forceReinitializeIcons(): void {
    setTimeout(() => {
      this.initializeIcons();
    }, 20);
  }

  handleResize() {
    if (window.innerWidth >= 640) {
      this.sidebarVisible = true;
    }
  }

  private handleDocumentClick(event: MouseEvent) {
    const dropdown = document.getElementById('profile-dropdown-menu');
    const button = document.getElementById('profile-dropdown-btn');
    if (dropdown && button && !dropdown.contains(event.target as Node) && !button.contains(event.target as Node)) {
      this.profileDropdownOpen = false;
    }
  }

  toggleProfileDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.profileDropdownOpen = !this.profileDropdownOpen;
    // Reinitialize icons immediately after dropdown toggle for real-time icon update
    this.forceReinitializeIcons();
  }

  private loadUserInfo() {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.userName = this.authService.getUsername();
      this.userRoles = this.authService.getRoles();
      
      // Get user data from token or localStorage
      const decoded = this.authService.getDecodedToken();
      console.log('[Sidebar] Decoded token data:', decoded);
      
      if (decoded) {
        this.userData = {
          id: decoded.id,
          name: decoded.name,
          email: decoded.email,
          avatar: decoded.avatar || decoded.profileImage || decoded.image,
          profileImage: decoded.profileImage || decoded.avatar || decoded.image,
          image: decoded.image || decoded.avatar || decoded.profileImage
        };
        console.log('[Sidebar] Processed user data:', this.userData);
      }
      
      // Use default values since these methods don't exist in AuthService
      this.userEmail = this.userData?.email || null;
      this.userStatus = 'Online'; // Default status
    }
  }

  private loadCustomerCount() {
    // Use the same method as the customer management page for consistency
    this.userService.getCustomers().subscribe({
      next: (customers) => {
        this.totalCustomers = customers.length;
      },
      error: (error) => {
        console.error('Failed to load customer count:', error);
        this.totalCustomers = 0;
      }
    });
  }

  private loadTiersAndVipCount() {
    // First load tiers, then load VIP count with filtering
    this.vipTierService.getAllVipTiers().subscribe({
      next: (tiers) => {
        this.tiers = tiers.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
        this.loadVipCount();
      },
      error: (error) => {
        console.error('Failed to load tiers:', error);
        this.tiers = [];
        this.loadVipCount();
      }
    });
  }

  private loadVipCount() {
    this.userService.getVipCustomers().subscribe({
      next: (customers) => {
        // Get the lowest tier to exclude from VIP customers
        const lowestTier = this.tiers.length > 0 ? 
          this.tiers.reduce((lowest: any, tier: any) => tier.minPoints < lowest.minPoints ? tier : lowest).name : 
          'Regular';

        // Filter out customers with the lowest tier (Regular customers)
        this.vipCount = customers.filter((customer: any) => 
          customer.tier.toLowerCase() !== lowestTier.toLowerCase()
        ).length;
      },
      error: (error) => {
        console.error('Failed to load VIP count:', error);
        this.vipCount = 0;
      }
    });
  }

  // Method to refresh all counts
  refreshCounts() {
    this.loadCustomerCount();
    this.loadTiersAndVipCount();
  }

  getProfileImageUrl(): string {
    // Use image service to get proper avatar URL
    if (this.userData) {
      return this.imageService.getAvatarImageUrl(this.userData);
    }
    
    // Fallback to default avatar
    return this.imageService.getAvatarImageUrl({});
  }

  getUserDisplayName(): string {
    return this.userName || 'Guest User';
  }

  getUserRolesDisplay(): string {
    if (!this.userRoles || this.userRoles.length === 0) {
      return 'No roles assigned';
    }
    return this.userRoles.join(', ');
  }

  getUserStatusColor(): string {
    switch (this.userStatus.toLowerCase()) {
      case 'online':
        return 'text-green-500';
      case 'away':
        return 'text-yellow-500';
      case 'busy':
        return 'text-red-500';
      default:
        return 'text-slate-500';
    }
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/default-avatar.png';
  }



  





  navigateToAdminProfile() {
    const userId = this.authService.getUserId();
    if (userId) {
      this.router.navigate([`/admin/profile/${userId}`]);
      this.profileDropdownOpen = false;
    }
  }

  navigateToProfile() {
    const userId = this.authService.getUserId();
    if (userId) {
      this.router.navigate([`/admin/profile/${userId}`]);
      this.profileDropdownOpen = false;
    }
  }

  navigateToSettings() {
    // Placeholder for settings navigation
    console.log('Navigate to settings');
    // this.router.navigate(['/settings']);
  }

  openAdminInbox() {
    this.profileDropdownOpen = false;
    this.adminInboxService.openModal();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Log admin activity (placeholder, implement backend call as needed)
  logAdminActivity(type: string) {
    // Get current admin user ID from AuthService
    const userId = this.authService.getUserId();
    if (userId) {
      this.adminUserService.logAdminActivity(userId, type).subscribe({
        next: () => {},
        error: err => { console.error('Failed to log admin activity', err); }
      });
    } else {
      console.warn('No admin user ID found for activity logging');
    }
  }

  get collapsedSubmenuItems() {
    switch (this.currentMenu) {
      case 'products':
        return [
          { icon: 'chevron-left', link: null },
          { icon: 'plus-square', link: '/product' },
          { icon: 'list', link: '/productlist' },
          { icon: 'tag', link: '/brandlist' },
          { icon: 'tag', link: '/categorylist' },
        ];
      case 'orders':
        return [
          { icon: 'chevron-left', link: null },
          { icon: 'clipboard-list', link: '/orders' },
          { icon: 'rotate-ccw', link: '/return' },
        ];
      case 'discounts':
        return [
          { icon: 'chevron-left', link: null },
          { icon: 'list', link: '/discount-list' },
          { icon: 'plus', link: 'discount-add' },
          { icon: 'ticket', link: '/discount-coupon' },
        ];
      case 'event':
        return [
          { icon: 'chevron-left', link: null },
          { icon: 'circle-check', link: '/admin/event' },
          { icon: 'list-check', link: '/admin/eventlist' },
        ];
      case 'delivery':
        return [
          { icon: 'chevron-left', link: null },
          { icon: 'plus-square', link: '/createdeliveryservice' },
          { icon: 'list', link: '/deliveryservicelist' },
        ];
      case 'users':
        return [
          { icon: 'chevron-left', link: null },
          { icon: 'user', link: '/users/customers' },
          { icon: 'crown', link: '/users/vip' },
          { icon: 'ban', link: '/users/blacklist' },
          { icon: 'user-plus', link: '/users/create' },
          { icon: 'shield', link: '/users/admins' },
          { icon: 'key-round', link: '/users/roles' },
          { icon: 'alert-triangle', link: '/users/login-attempts' },
          { icon: 'activity', link: '/users/activity' },
        ];
      default:
        return [];
    }
  }

  // Navigate to submenu
  navigateToSubmenu(menuName: string) {
    this.currentSubmenu = menuName;
    this.currentMenu = menuName;
    // Reinitialize icons after navigation with reduced delay
    setTimeout(() => this.initializeIcons(), 30);
  }

  // Go back to main menu
  goBackToMainMenu() {
    this.currentSubmenu = null;
    this.currentMenu = null;
    // Reinitialize icons after navigation with reduced delay
    setTimeout(() => this.initializeIcons(), 30);
  }

  // Handle submenu item click
  onSubmenuItemClick(item: any) {
    if (item.link) {
      this.router.navigate([item.link]);
    }
  }
}