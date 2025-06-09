import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../services/cart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cart-page',
  standalone: false,
  templateUrl: './cart-page.component.html',
  styleUrls: ['./cart-page.component.css']
})
export class CartPageComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  cartTotal: number = 0;
  selectedItems: number = 0;
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private cartService: CartService
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.cartService.getCartItems().subscribe(items => {
        this.cartItems = items;
        this.selectedItems = items.length;
      }),
      this.cartService.getCartTotal().subscribe(total => {
        this.cartTotal = total;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  goToCheckout() {
    this.router.navigate(['/checkout']);
  }

  removeItem(itemId: number) {
    this.cartService.removeFromCart(itemId);
  }

  updateQuantity(itemId: number, newQuantity: number) {
    if (newQuantity > 0) {
      this.cartService.updateQuantity(itemId, newQuantity);
    }
  }

  continueShopping() {
    this.router.navigate(['/home']);
  }

  moveToWishlist(itemId: number) {
    // TODO: Implement wishlist functionality
    console.log('Move to wishlist:', itemId);
  }
} 