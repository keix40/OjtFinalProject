import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CartItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  color?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  private cartTotal = new BehaviorSubject<number>(0);

  constructor() {
    // Initialize cart from localStorage if available
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      this.cartItems.next(JSON.parse(savedCart));
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
    const currentItems = this.cartItems.value;
    const existingItem = currentItems.find(i => i.id === item.id);
    
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
    localStorage.setItem('cart', JSON.stringify(this.cartItems.value));
  }
} 