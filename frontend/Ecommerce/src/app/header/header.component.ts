import { Component, OnInit, HostListener, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { CartService, CartItem } from '../services/cart.service';
import { Subscription } from 'rxjs';
import { WishlistService } from '../services/wishlist.service';
import { BreadcrumbService } from '../breadcrumb.service';
import { CartSidebarComponent } from '../cart-sidebar/cart-sidebar.component';
import { CategoryService } from '../services/category.service';
import { BrandService } from '../services/brand.service';
import { Category } from '../category';
import { BrandListDTO } from '../brand';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, CartSidebarComponent, RouterModule],
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
  userProfileImage: string | null = null;
  categories: Category[] = [];
  brands: BrandListDTO[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private elementRef: ElementRef,
    private cartService: CartService,
    private wishlistService: WishlistService,
    public breadcrumbService: BreadcrumbService,
    private categoryService: CategoryService,
    private brandService: BrandService
  ) {}

  ngOnInit() {
    this.checkAuthStatus();
    this.name = this.authService.getUsername();
    this.userId = this.authService.getUserId();

    // Get user profile image from JWT
    const decoded = this.authService.getDecodedToken();
    if (decoded && decoded.profileImage && decoded.profileImage !== '/upload/defaultProfile.png') {
      this.userProfileImage = decoded.profileImage;
    } else {
      this.userProfileImage = null;
    }

    this.subscriptions.push(
      this.cartService.getCartItems().subscribe(items => {
        this.cartItems = items;
      }),
      this.cartService.getCartTotal().subscribe(total => {
        this.cartTotal = total;
      }),
      this.wishlistService.wishlistUpdated$.subscribe(() => {
        if (this.isAuthenticated && this.userId) {
          this.loadWishlistCount();
        }
      })
    );

    if (this.isAuthenticated && this.userId) {
      this.loadWishlistCount();
    }

    this.categoryService.getAllCategory().subscribe({
      next: (data) => this.categories = data,
      error: () => this.categories = []
    });
    this.brandService.getAllBrand().subscribe({
      next: (data) => this.brands = data,
      error: () => this.brands = []
    });
  }

  isMobileMenuOpen = false;

toggleMobileMenu(): void {
  this.isMobileMenuOpen = !this.isMobileMenuOpen;
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

  goToCategory(category: Category) {
    this.openDropdown = null;
    this.router.navigate(['/uProductlist'], { queryParams: { category: category.name } });
  }

  goToBrand(brand: BrandListDTO) {
    this.openDropdown = null;
    this.router.navigate(['/uProductlist'], { queryParams: { brand: brand.name } });
  }

    getAllCategoriesUrl(): string {
    return '/usercategorylist';
  }

  getAllBrandsUrl(): string {
    return '/userbrandlist';
  }
}
