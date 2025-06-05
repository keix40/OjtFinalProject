import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CartItem {
  id: number;
  title: string;
  price: number;
  oldPrice: number;
  quantity: number;
  image: string;
  size: string;
  color: string;
  discount: string;
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

  cartItems: CartItem[] = [
    {
      id: 1,
      title: 'VINGLI 56" Modern Sofa, Small Corduroy Couch Deep Seat',
      price: 259,
      oldPrice: 440,
      quantity: 1,
      image: 'assets/images/test.jpg',
      size: 'S',
      color: 'Satin linen',
      discount: '40%'
    },
    {
      id: 2,
      title: 'Fabric Recliner Chair Single Sofa',
      price: 109,
      oldPrice: 400,
      quantity: 1,
      image: 'assets/images/test.jpg',
      size: 'S',
      color: 'Satin linen',
      discount: '73%'
    },
    {
      id: 3,
      title: 'Stuffed Animal Storage Bean Bag Chair Cover (No Filler)',
      price: 79,
      oldPrice: 160,
      quantity: 1,
      image: 'assets/images/test.jpg',
      size: 'S',
      color: 'Satin linen',
      discount: '51%'
    }
  ];

  increaseQty(item: CartItem) {
    item.quantity++;
  }

  decreaseQty(item: CartItem) {
    if (item.quantity > 1) item.quantity--;
  }

  getItemTotal(item: CartItem) {
    return item.price * item.quantity;
  }

  getCartTotal() {
    return this.cartItems.reduce((sum, item) => sum + this.getItemTotal(item), 0);
  }

  onClose() {
    this.closeSidebar.emit();
  }
} 