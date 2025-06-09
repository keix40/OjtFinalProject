import { Component, OnInit, HostListener, ElementRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { CartService, CartItem } from '../services/cart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: false,
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
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private elementRef: ElementRef,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.checkAuthStatus();
    this.name = this.authService.getUsername();
    this.userId = this.authService.getUserId();

    this.subscriptions.push(
      this.cartService.getCartItems().subscribe(items => {
        this.cartItems = items;
      }),
      this.cartService.getCartTotal().subscribe(total => {
        this.cartTotal = total;
      })
    );
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
    console.log('toggleDropdown called:', dropdownName, 'openDropdown:', this.openDropdown);
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
    this.isAuthenticated = false;
    this.router.navigate(['/login']);
  }

  onAccountClick(event: Event) {
    console.log('Account button clicked');
    this.toggleDropdown(event, 'account-dropdown');
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
    // Only close dropdown if click is outside any .dropdown in this component
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
}
