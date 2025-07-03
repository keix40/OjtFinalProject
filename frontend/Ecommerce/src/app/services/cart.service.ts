import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export interface CartItem {
  id: number;               // Unique item ID (can be variant ID)
  productId?: number;
  variantId?: number;       // <-- new
  title: string;
  image: string;
  price: number;
  quantity: number;
  color?: string;           // optional
  size?: string;            // optional
  variantAttributes?: string[]; // ['Size: M', 'Color: Red']
  userId?: number;
}
  
@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  private cartTotal = new BehaviorSubject<number>(0);

  constructor(private authService: AuthService) {
    this.loadCart();
  }

  refreshCart() {
    this.loadCart();
  }

  private loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const allItems: CartItem[] = JSON.parse(savedCart);
      const userId = this.authService.getUserId();
      const userItems = userId ? allItems.filter(item => item.userId === userId) : [];
      this.cartItems.next(userItems);
      this.updateCartTotal();
    }
  }

  getCartItems(): Observable<CartItem[]> {
    return this.cartItems.asObservable();
  }

  getCartTotal(): Observable<number> {
    return this.cartTotal.asObservable();
  }

  addToCart(item: CartItem) {
    const userId = this.authService.getUserId();
    if (!userId) return;

    item.userId = userId;

    const currentItems = this.cartItems.value;
    const existingItem = currentItems.find(i =>
      i.id === item.id &&
      i.userId === item.userId &&
      i.size === item.size &&
      i.color === item.color
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;
      this.cartItems.next([...currentItems]);
    } else {
      this.cartItems.next([...currentItems, item]);
    }

    this.updateCartTotal();
    this.saveCartToLocalStorage();
  }

  removeFromCart(itemId: number) {
    const currentItems = this.cartItems.value;
    this.cartItems.next(currentItems.filter(item => item.id !== itemId));
    this.updateCartTotal();
    this.saveCartToLocalStorage();
  }

  updateQuantity(itemId: number, quantity: number) {
    const currentItems = this.cartItems.value;
    const item = currentItems.find(i => i.id === itemId);

    if (item) {
      item.quantity = quantity;
      this.cartItems.next([...currentItems]);
      this.updateCartTotal();
      this.saveCartToLocalStorage();
    }
  }

  clearCart() {
    this.cartItems.next([]);
    this.updateCartTotal();
    this.saveCartToLocalStorage();
  }

  private updateCartTotal() {
    const total = this.cartItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.cartTotal.next(total);
  }

  private saveCartToLocalStorage() {
    const savedCart = localStorage.getItem('cart');
    let allItems: CartItem[] = [];

    if (savedCart) {
      allItems = JSON.parse(savedCart);
    }

    const currentUserId = this.authService.getUserId();
    if (currentUserId) {
      // Remove current user's previous items
      allItems = allItems.filter(item => item.userId !== currentUserId);
      // Add updated user's cart
      allItems = [...allItems, ...this.cartItems.value];
    }

    localStorage.setItem('cart', JSON.stringify(allItems));
  }
} 