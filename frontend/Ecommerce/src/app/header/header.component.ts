import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {

  name: string | null = null;
  userId: number | null = null;
  cartItems = [
    {
      id: 1,
      title: 'Wireless Headphones',
      price: 89.99,
      quantity: 1,
      image: 'assets/images/test.jpg'
    },
    {
      id: 2,
      title: 'Smart Watch',
      price: 129.99,
      quantity: 1,
      image: 'assets/images/test.jpg'
    },
    {
      id: 3,
      title: 'Bluetooth Speaker',
      price: 59.99,
      quantity: 1,
      image: 'assets/images/test.jpg'
    }
  ];

  cartTotal = 0;
  isMobileSearchVisible = false;
  isAuthenticated = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.updateCartTotal();
    this.checkAuthStatus();
    this.name = this.authService.getUsername();
    this.userId = this.authService.getUserId();
  }

  private checkAuthStatus() {
    this.isAuthenticated = this.authService.isLoggedIn();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
      if (!dropdown.contains(event.target as Node)) {
        dropdown.classList.remove('show');
      }
    });
  }

  toggleDropdown(event: Event, dropdownClass: string) {
    event.preventDefault();
    const dropdown = document.querySelector(`.${dropdownClass}`);
    if (dropdown) {
      const isOpen = dropdown.classList.contains('show');
      
      // Close all other dropdowns
      document.querySelectorAll('.dropdown').forEach(d => {
        if (d !== dropdown) {
          d.classList.remove('show');
        }
      });
      
      // Toggle current dropdown
      if (!isOpen) {
        dropdown.classList.add('show');
      } else {
        dropdown.classList.remove('show');
      }
    }
  }

  toggleMobileSearch() {
    this.isMobileSearchVisible = !this.isMobileSearchVisible;
  }

  removeCartItem(itemId: number) {
    this.cartItems = this.cartItems.filter(item => item.id !== itemId);
    this.updateCartTotal();
  }

  private updateCartTotal() {
    this.cartTotal = this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
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
}
