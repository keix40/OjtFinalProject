import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface CartItem {
  id: number;
  title: string;
  price: number;
  oldPrice?: number;
  originalPrice?: number;
  quantity: number;
  image: string;
  size: string;
  color: string;
  discount?: string;
  savings?: number;
}

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-sidebar.component.html',
  styleUrls: ['./cart-sidebar.component.css']
})
export class CartSidebarComponent {
  @Input() showCartSidebar = false;
  @Output() closeSidebar = new EventEmitter<void>();

  constructor(private router: Router) {}

  cartItems: CartItem[] = [
    {
      id: 1,
      title: 'VINGLI 56" Modern Sofa, Small Corduroy Couch Deep Seat',
      price: 259,
      oldPrice: 440,
      originalPrice: 440,
      quantity: 1,
      image: 'assets/images/test.jpg',
      size: 'S',
      color: 'Satin linen',
      discount: '40%',
      savings: 181
    },
    {
      id: 2,
      title: 'Fabric Recliner Chair Single Sofa',
      price: 109,
      oldPrice: 400,
      originalPrice: 400,
      quantity: 1,
      image: 'assets/images/test.jpg',
      size: 'S',
      color: 'Satin linen',
      discount: '73%',
      savings: 291
    },
    {
      id: 3,
      title: 'Stuffed Animal Storage Bean Bag Chair Cover (No Filler)',
      price: 79,
      oldPrice: 160,
      originalPrice: 160,
      quantity: 1,
      image: 'assets/images/test.jpg',
      size: 'S',
      color: 'Satin linen',
      discount: '51%',
      savings: 81
    }
  ];

  decrementQty(item: CartItem) {
    if (item.quantity > 1) item.quantity--;
  }

  incrementQty(item: CartItem) {
    item.quantity++;
  }

  removeItem(item: CartItem) {
    this.cartItems = this.cartItems.filter(i => i.id !== item.id);
  }

  getTotal(): number {
    return this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  goToCart() {
    this.router.navigate(['/cart']);
    this.closeSidebar.emit();
  }

  proceedToPayment() {
    this.router.navigate(['/checkout']);
    this.closeSidebar.emit();
  }

  onClose() {
    this.closeSidebar.emit();
  }
} 