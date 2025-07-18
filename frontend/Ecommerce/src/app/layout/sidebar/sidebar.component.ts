import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { PermissionService } from '../../services/permission.service';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, AfterViewInit {
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
  sidebarVisible: boolean = window.innerWidth >= 640; // Show sidebar by default on desktop

  // Profile dropdown properties
  userName: string | null = null;
  userRoles: string[] = [];
  isLoggedIn: boolean = false;
  profileDropdownOpen: boolean = false;
  userProfileImage: string | null = null;
  userEmail: string | null = null;
  userStatus: string = 'Online';
  userData: any = null; // Store complete user data

  // Fetch these values from your backend

  constructor(
    private router: Router,
    private authService: AuthService,
    public permissionService: PermissionService,
    private imageService: ImageService
  ) { }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
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
    document.addEventListener('click', this.handleDocumentClick.bind(this));
  }

  ngAfterViewInit(): void {
    // Initialize Lucide icons after view is ready
    this.initializeIcons();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.handleResize.bind(this));
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
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
}
