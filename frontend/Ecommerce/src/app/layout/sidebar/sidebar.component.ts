import { Component, OnInit, AfterViewInit, OnDestroy, DoCheck, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { PermissionService } from '../../services/permission.service';
import { ImageService } from '../../services/image.service';
import { AdminUserService } from '../../services/admin-user.service';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  // Remove the animations array entirely or only keep menuAnimation if used for submenu transitions
})
export class SidebarComponent implements OnInit, AfterViewInit, OnDestroy, DoCheck {
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
  sidebarVisible: boolean = window.innerWidth >= 640; // Show sidebar by default on desktop
  sidebarExpanded = false;
  sidebarWidth: string = '5rem'; // Default collapsed width

  // Profile dropdown properties
  userName: string | null = null;
  userRoles: string[] = [];
  isLoggedIn: boolean = false;
  profileDropdownOpen: boolean = false;
  userProfileImage: string | null = null;
  userEmail: string | null = null;
  userStatus: string = 'Online';
  userData: any = null; // Store complete user data

  displayedBritium = '';
  displayedGallery = '';
  showCursorBritium = true;
  showCursorGallery = false;
  private britiumText = 'Britium';
  private galleryText = 'Gallery';
  private britiumIndex = 0;
  private galleryIndex = 0;
  private typingInterval: any;
  private typingState: 'britium' | 'gallery' | 'done' = 'britium';

  currentMenu: 'main' | 'products' | 'users' | 'orders' | 'discounts' | 'delivery' = 'main';

  showSubmenu(menu: 'products' | 'users' | 'orders' | 'discounts' | 'delivery') {
    this.currentMenu = menu;
    setTimeout(() => this.initializeIcons(), 0);
  }

  showMainMenu() {
    this.currentMenu = 'main';
    setTimeout(() => this.initializeIcons(), 0);
  }

  // Fetch these values from your backend

  constructor(
    public router: Router,
    private authService: AuthService,
    public permissionService: PermissionService,
    private imageService: ImageService,
    private adminUserService: AdminUserService
  ) { }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  isMobile(): boolean {
    return window.innerWidth < 640;
  }

  ngOnInit(): void {
    // Debug: log current permissions
    // console.log('[Sidebar] Permissions:', this.permissionService.getPermissions());
    window.addEventListener('resize', this.handleResize.bind(this));
    this.handleResize();
    this.loadUserInfo();
    document.addEventListener('click', this.handleDocumentClick.bind(this));
    this.adminUserService.getAdminUsers().subscribe(users => {
      this.adminCount = users.length;
    });
    // Log admin activity on sidebar load
    this.logAdminActivity('page_view');
    this.startTypewriter();
    // Debug: log sidebarExpanded initial state
    // console.log('[Sidebar] ngOnInit, sidebarExpanded:', this.sidebarExpanded);
    // Set initial width based on expanded state
    this.sidebarWidth = this.sidebarExpanded ? '16rem' : '5rem';
  }

  ngAfterViewInit(): void {
    // Initialize Lucide icons after view is ready
    this.initializeIcons();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.handleResize.bind(this));
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
    if (this.typingInterval) clearInterval(this.typingInterval);
  }

  private prevSidebarExpanded: boolean = this.sidebarExpanded;
  private prevCurrentMenu: 'main' | 'products' | 'users' | 'orders' | 'discounts' | 'delivery' = this.currentMenu;

  ngDoCheck(): void {
    // Auto-close profile dropdown when sidebar is collapsed
    if (!this.sidebarExpanded && this.profileDropdownOpen) {
      this.profileDropdownOpen = false;
    }
    // Re-initialize Lucide icons if sidebarExpanded changes
    if (this.prevSidebarExpanded !== this.sidebarExpanded) {
      setTimeout(() => this.initializeIcons(), 0);
      this.prevSidebarExpanded = this.sidebarExpanded;
    }
    // Re-initialize Lucide icons if currentMenu changes (for submenus)
    if (this.prevCurrentMenu !== this.currentMenu) {
      setTimeout(() => this.initializeIcons(), 0);
      this.prevCurrentMenu = this.currentMenu;
    }
  }

  private initializeIcons(): void {
    // Initialize Lucide icons
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }

  handleResize() {
    if (window.innerWidth >= 640) {
      this.sidebarVisible = true;
    }
  }

  private handleDocumentClick(event: MouseEvent) {
    const dropdown = document.querySelector('.sidebar .bg-white.border.border-slate-200.rounded-xl');
    const button = document.querySelector('.sidebar button[data-lucide="chevron-down"]');
    if (dropdown && button && !dropdown.contains(event.target as Node) && !button.contains(event.target as Node)) {
      this.profileDropdownOpen = false;
    }
  }

  toggleProfileDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.profileDropdownOpen = !this.profileDropdownOpen;
    // Reinitialize icons after dropdown toggle
    setTimeout(() => this.initializeIcons(), 100);
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
    // Handle image loading errors using image service
    this.imageService.handleImageError(event, 'avatar', this.getUserDisplayName());
  }

  navigateToProfile() {
    const userId = this.authService.getUserId();
    if (userId) {
      this.router.navigate(['/profile', userId], { queryParams: { section: 'personal-info' } });
    }
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

  // Update the sidebarExpanded logic to use proper width classes
@HostListener('mouseenter') 
onMouseEnter() {
  this.sidebarExpanded = true;
  this.sidebarWidth = '16rem'; // Expanded width
}

@HostListener('mouseleave') 
onMouseLeave() {
  this.sidebarExpanded = false;
  this.sidebarWidth = '5rem'; // Collapsed width
}

  startTypewriter() {
    if (this.typingInterval) clearInterval(this.typingInterval);
    this.displayedBritium = '';
    this.displayedGallery = '';
    this.britiumIndex = 0;
    this.galleryIndex = 0;
    this.typingState = 'britium';
    this.showCursorBritium = true;
    this.showCursorGallery = false;
    this.typingInterval = setInterval(() => this.typewriterStep(), 90);
  }

  private typewriterStep() {
    if (this.typingState === 'britium') {
      if (this.britiumIndex < this.britiumText.length) {
        this.displayedBritium += this.britiumText[this.britiumIndex++];
      } else {
        this.typingState = 'gallery';
        this.showCursorBritium = false;
        this.showCursorGallery = true;
      }
    } else if (this.typingState === 'gallery') {
      if (this.galleryIndex < this.galleryText.length) {
        this.displayedGallery += this.galleryText[this.galleryIndex++];
      } else {
        this.typingState = 'done';
        this.showCursorGallery = false;
        clearInterval(this.typingInterval);
      }
    }
  }

  ngAfterViewChecked(): void {
    this.initializeIcons();
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
}
