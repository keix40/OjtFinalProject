import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../services/cart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-sidebar.component.html',
  styleUrls: ['./cart-sidebar.component.css']
})
export class CartSidebarComponent implements OnInit, OnDestroy {
  @Input() showCartSidebar = false;
  @Output() closeSidebar = new EventEmitter<void>();

  cartItems: CartItem[] = [];
  cartTotal: number = 0;
  private subscriptions: Subscription[] = [];

  constructor(private router: Router, private cartService: CartService) {}

  ngOnInit() {
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

  decrementQty(item: CartItem) {
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item.id, item.quantity - 1);
    }
  }

  incrementQty(item: CartItem) {
    this.cartService.updateQuantity(item.id, item.quantity + 1);
  }

  removeItem(item: CartItem) {
    this.cartService.removeFromCart(item.id);
  }

  getTotal(): number {
    return this.cartTotal;
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