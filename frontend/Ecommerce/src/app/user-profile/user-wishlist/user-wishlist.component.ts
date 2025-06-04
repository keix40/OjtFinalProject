import { Component, OnInit } from '@angular/core';

interface WishlistItem {
  id: number;
  title: string;
  price: number;
  image: string;
}

@Component({
  selector: 'app-user-wishlist',
  standalone: false,
  templateUrl: './user-wishlist.component.html',
  styleUrl: './user-wishlist.component.css'
})
export class UserWishlistComponent implements OnInit {

  wishlistItems: WishlistItem[] = [];

  constructor() { }

  ngOnInit(): void {
    this.loadWishlistItems();
  }

  // Wishlist Methods
  private loadWishlistItems() {
    // TODO: Implement API call to load wishlist items
    this.wishlistItems = [
      {
        id: 1,
        title: 'Sample Product 1',
        price: 99.99,
        image: 'assets/images/test.jpg'
      },
      {
        id: 2,
        title: 'Sample Product 2',
        price: 149.99,
        image: 'assets/images/test.jpg'
      }
    ];
  }

  addToCart(item: WishlistItem) {
    // TODO: Implement add to cart functionality
    console.log('Adding to cart:', item);
  }

  removeFromWishlist(item: WishlistItem) {
    // TODO: Implement remove from wishlist functionality
    this.wishlistItems = this.wishlistItems.filter(i => i.id !== item.id);
  }

}
