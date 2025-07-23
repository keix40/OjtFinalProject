import { Component, OnInit, HostListener, ElementRef, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { CartService, CartItem } from '../services/cart.service';
import { Subscription } from 'rxjs';
import { WishlistService } from '../services/wishlist.service';
import { BreadcrumbService } from '../breadcrumb.service';
import { CartSidebarComponent } from '../cart-sidebar/cart-sidebar.component';
import { HttpClient } from '@angular/common/http';
import { CategoryService } from '../services/category.service';
import { BrandService } from '../services/brand.service';
import { Category } from '../category';
import { BrandListDTO } from '../brand';
import { UserActivityService } from '../services/user-activity.service';
import { NavigationEnd } from '@angular/router';
import { ProductDTO } from '../product';
import { ProductService } from '../services/product.service';
import { FormsModule } from '@angular/forms';
import { NotificationSidebarComponent } from '../notification-sidebar/notification-sidebar.component';
import { NotificationSidebarService } from '../notifcation-sidebar.service';
import { NotifcationService } from '../notifcation.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ImageService } from '../services/image.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, CartSidebarComponent, RouterModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {

  name: string | null = null;
  userId: number | null = null;
  cartItems: CartItem[] = [];
  cartTotal = 0;
  isMobileSearchVisible = false;
  isAuthenticated = false;
  openDropdown: string | null = null;
  showCartSidebar = false;
  public wishlistCount = 0;
  private subscriptions: Subscription[] = [];
  isFirstTimeBuyerDiscount = false;
  userProfileImage: string | null = null;
  categories: Category[] = [];
  brands: BrandListDTO[] = [];
  searchQuery: string = '';
  products: ProductDTO[] = [];
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
  @Output() notificationSidebarOpen = new EventEmitter<void>();
  newNotificationCount = 0;
  sidebarOpen = false;
  isMobileMenuOpen = false;
  isCategoriesExpanded = false;
  isBrandsExpanded = false;
  topCategories: any[] = [];
  topBrands: any[] = [];
  brandImagesLoaded: { [key: number]: boolean } = {};

  constructor(
    private router: Router,
    private authService: AuthService,
    private elementRef: ElementRef,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private http: HttpClient, // Add HttpClient for preview API
    public breadcrumbService: BreadcrumbService,
    private categoryService: CategoryService,
    private brandService: BrandService,
    private userActivityService: UserActivityService,
    private productServce: ProductService,
    private notificationSidebarService: NotificationSidebarService,
    private notifcationService: NotifcationService,
    private sanitizer: DomSanitizer,
    private imageService: ImageService // Inject ImageService
  ) {}

  ngOnInit() {
    const storedCount = localStorage.getItem('newNotificationCount');
  this.newNotificationCount = storedCount ? parseInt(storedCount, 10) : 0;
    this.checkAuthStatus();
    this.name = this.authService.getUsername();
    this.userId = this.authService.getUserId();

    // Get user profile image from JWT
    const decoded = this.authService.getDecodedToken();
    if (decoded && (decoded.profileImage || decoded.avatar)) {
      this.userProfileImage = this.imageService.getAvatarImageUrl(decoded);
    } else {
      this.userProfileImage = this.imageService.getAvatarImageUrl({});
    }

    this.subscriptions.push(
      this.cartService.getCartItems().subscribe(items => {
        this.cartItems = items;
        this.checkFirstTimeBuyerDiscount(); // Check discount when cart changes
      }),
      this.cartService.getCartTotal().subscribe(total => {
        this.cartTotal = total;
      }),
      this.wishlistService.wishlistUpdated$.subscribe(() => {
        if (this.isAuthenticated && this.userId) {
          this.loadWishlistCount();
        }
      }),
      this.notifcationService.notifications$.subscribe(() => {
        if (!this.sidebarOpen) {
          this.newNotificationCount++;
          localStorage.setItem('newNotificationCount', this.newNotificationCount.toString());
        }
      })
    );

    if (this.isAuthenticated && this.userId) {
      this.loadWishlistCount();
      this.checkFirstTimeBuyerDiscount(); // Check on init

    }

    this.categoryService.getAllCategory().subscribe({
      next: (data) => this.categories = data,
      error: () => this.categories = []
    });

    this.brandService.getAllBrand().subscribe({
      next: (data) => {
        this.brands = data.map(brand => ({
          ...brand,
          imageLoaded: true
        }));
        // Initialize brandImagesLoaded for all brands
        this.brands.forEach(brand => {
          this.brandImagesLoaded[brand.id] = true;
        });
      },
      error: () => this.brands = []
    });

    // Log page view on every navigation
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isAuthenticated = this.authService.isLoggedIn();
        this.userId = this.authService.getUserId();
        if (this.isAuthenticated && this.userId) {
          this.userActivityService.logPageView(this.userId);
        }
      }
    });
    this.startTypewriter();
    this.loadTopCategories();
    this.loadTopBrands();
  }

  private loadWishlistCount() {
    this.wishlistService.getWishlist(this.userId!).subscribe({
      next: (productIds: any) => {
        this.wishlistCount = productIds.length;
      },
      error: () => {
        console.error("Failed to load wishlist count");
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.typingInterval) clearInterval(this.typingInterval);
  }

  private checkAuthStatus() {
    this.isAuthenticated = this.authService.isLoggedIn();
  }

  toggleDropdown(event: Event, dropdownName: string) {
    event.stopPropagation();
    this.openDropdown = this.openDropdown === dropdownName ? null : dropdownName;
  }

  toggleMobileSearch() {
    this.isMobileSearchVisible = !this.isMobileSearchVisible;
  }

  removeCartItem(itemId: number) {
    this.cartService.removeFromCart(itemId);
  }

  navigateTo(route: string) {
    if (this.isAuthenticated && (route === '/login' || route === '/register')) {
      this.router.navigate(['/home']);
      return;
    }
    this.router.navigate([route]);
  }

  logout() {
    this.authService.logout();
    this.cartService.refreshCart();
    this.isAuthenticated = false;
    this.router.navigate(['/login']);
  }

  onAccountClick(event: Event) {
    console.log('Account button clicked');
    this.toggleDropdown(event, 'account');
    console.log('openDropdown value:', this.openDropdown);
  }

  navigateToOrders() {
    this.openDropdown = null;
    this.router.navigate(['/profile', this.userId], { queryParams: { section: 'orders' } });
  }

  navigateToProfile() {
    this.openDropdown = null;
    this.router.navigate(['/profile', this.userId], { queryParams: { section: 'personal-info' } });
  }

  navigateToWishlist() {
    this.openDropdown = null;
    this.router.navigate(['/profile', this.userId], { queryParams: { section: 'wishlist' } });
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.openDropdown = null;
    }
  }

  openSidebar() {
    this.showCartSidebar = true;
  }

  closeSidebar() {
    this.showCartSidebar = false;
  }

  navigateToCart() {
    this.router.navigate(['/cart']);
  }
 
  openNotificationSidebar() {
    this.sidebarOpen = true;
    this.newNotificationCount = 0;
    localStorage.setItem('newNotificationCount', '0');
    this.notificationSidebarService.open();
  }
  closeNotificationSidebar() {
    this.sidebarOpen = false;
  }

  get displayNotificationCount(): string {
    return this.newNotificationCount > 9 ? '9+' : this.newNotificationCount > 0 ? this.newNotificationCount.toString() : '';
  }

  //for first time buyer discount by pmk july 9
  checkFirstTimeBuyerDiscount() {
    if (!this.isAuthenticated || !this.userId || this.cartItems.length === 0) {
      this.isFirstTimeBuyerDiscount = false;
      return;
    }
    const userOrderDto = {
      userId: this.userId,
      cartItem: this.cartItems.map(item => ({
        productId: item.productId || item.id,
        quantity: item.quantity,
        price: item.price
      }))
    };
    this.http.post<any>('http://localhost:8080/order/preview', userOrderDto).subscribe({
      next: (preview) => {
        this.isFirstTimeBuyerDiscount = preview.discountReason && preview.discountReason.toLowerCase().includes('first time buyer');
      },
      error: () => {
        this.isFirstTimeBuyerDiscount = false;
      }
    });
  }

  goToCategory(category: Category) {
    this.openDropdown = null;
    this.router.navigate(['/userproductlist'], { queryParams: { category: category.name } });
  }

  goToBrand(brand: BrandListDTO) {
    this.openDropdown = null;
    this.router.navigate(['/userproductlist'], { queryParams: { brand: brand.name } });
  }

  getAllCategoriesUrl() {
    return '/usercategorylist';
  }

  getAllBrandsUrl() {
    return '/userbrandlist';
  }

  onSearch() {
    const value = this.searchQuery?.trim();
    if (value) {
      this.router.navigate(['/userproductlist'], { queryParams: { search: value } });
    }
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

  resetTypewriter() {
    this.startTypewriter();
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

  getSafeIconUrl(cat: Category): SafeUrl | string | undefined {
    if (cat.iconUrl) {
      if (cat.iconUrl.startsWith('data:image')) {
        return this.sanitizer.bypassSecurityTrustUrl(cat.iconUrl);
      }
      if (cat.iconUrl.startsWith('http://') || cat.iconUrl.startsWith('https://')) {
        return cat.iconUrl;
      }
      // If it's a relative path (uploaded file)
      return `http://localhost:8080${cat.iconUrl.startsWith('/') ? cat.iconUrl : '/' + cat.iconUrl}`;
    }
    return undefined;
  }

  loadTopCategories() {
    this.categoryService.getAllCategory().subscribe(
      (categories: Category[]) => {
        this.topCategories = categories.slice(0, 4).map(cat => ({
          id: cat.id,
          categoryName: cat.name,
          iconUrl: this.getCategoryIconUrl(cat.iconUrl || null),
          initial: cat.name ? cat.name.charAt(0).toUpperCase() : '',
          iconClass: cat.iconClass || ''
        }));
      },
      error => {
        console.error('Error loading categories:', error);
        this.topCategories = [];
      }
    );
  }

  getCategoryIconUrl(iconUrl: string | null): string | null {
    if (!iconUrl) return null;
    if (iconUrl.startsWith('data:')) return iconUrl;
    if (iconUrl.startsWith('http://') || iconUrl.startsWith('https://')) return iconUrl;
    return `http://localhost:8080${iconUrl.startsWith('/') ? '' : '/'}${iconUrl}`;
  }

  getInitialColor(initial: string): string {
    const colors = [
      'bg-emerald-500',
      'bg-blue-500',
      'bg-violet-500',
      'bg-amber-500',
      'bg-rose-500',
      'bg-cyan-500',
      'bg-fuchsia-500'
    ];
    const index = initial.charCodeAt(0) % colors.length;
    return colors[index];
  }

  handleBrandImageError(brandId: number) {
    this.brandImagesLoaded[brandId] = false;
  }

  isBrandImageLoaded(brandId: number): boolean {
    return this.brandImagesLoaded[brandId] !== false;
  }

  getBrandImageUrl(image: string): string {
    if (!image) return '';
    if (image.startsWith('data:')) return image;
    if (image.startsWith('http://') || image.startsWith('https://')) return image;
    // Make sure the image path is properly formatted
    return `http://localhost:8080/uploads/${image}`;
  }

  loadTopBrands() {
    this.brandService.getAllBrand().subscribe(
      (brands: BrandListDTO[]) => {
        this.topBrands = brands.slice(0, 4).map(brand => {
          this.brandImagesLoaded[brand.id] = true;
          return {
            id: brand.id,
            brandName: brand.name,
            imageUrl: brand.image ? this.getBrandImageUrl(brand.image) : '',
            initial: brand.name.charAt(0).toUpperCase()
          };
        });
      },
      error => {
        console.error('Error loading brands:', error);
        this.topBrands = [];
      }
    );
  }

  getRandomColor(initial: string): string {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500'
    ];
    const index = initial.charCodeAt(0) % colors.length;
    return colors[index];
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (!this.isMobileMenuOpen) {
      this.isCategoriesExpanded = false;
      this.isBrandsExpanded = false;
    }
  }

  toggleCategories() {
    this.isCategoriesExpanded = !this.isCategoriesExpanded;
  }

  toggleBrands() {
    this.isBrandsExpanded = !this.isBrandsExpanded;
  }

}
