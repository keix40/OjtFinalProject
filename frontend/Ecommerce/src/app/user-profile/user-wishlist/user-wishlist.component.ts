import { Component, OnInit } from '@angular/core';
import { WishlistService } from '../../services/wishlist.service';
import { AuthService } from '../../auth/auth.service';
import { ProductService } from '../../services/product.service';
import { ProductDTO } from '../../product';

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
  userId: number | null = null;
  allProducts: ProductDTO[] = [];

  constructor(
    private wishlistService: WishlistService,
    private authService: AuthService,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    if (this.userId) {
      this.loadAllProducts();
    }
  }

  private loadAllProducts() {
    this.productService.getAllAcProduct().subscribe({
      next: (products) => {
        this.allProducts = products;
        this.loadWishlistItems();
      },
      error: (error) => {
        console.error('Error loading products:', error);
      }
    });
  }

  private loadWishlistItems() {
    if (!this.userId) return;

    this.wishlistService.getWishlist(this.userId).subscribe({
      next: (productIds: number[]) => {
        this.wishlistItems = [];
        productIds.forEach(productId => {
          const product = this.allProducts.find(p => p.id === productId);
          if (product) {
            const wishlistItem: WishlistItem = {
              id: product.id,
              title: product.productName,
              price: product.price,
              image: product.productImages && product.productImages.length > 0 
                ? 'http://localhost:8080' + product.productImages[0].imageUrl 
                : '/assets/project_img/fashion_store.jpg'
            };
            this.wishlistItems.push(wishlistItem);
          }
        });
      },
      error: (error) => {
        console.error('Error loading wishlist:', error);
      }
    });
  }

  addToCart(item: WishlistItem) {
    // TODO: Implement add to cart functionality
    console.log('Adding to cart:', item);
  }

  removeFromWishlist(item: WishlistItem) {
    if (!this.userId) return;

    this.wishlistService.removeWishlist(this.userId, item.id).subscribe({
      next: () => {
        // Remove item from local array
        this.wishlistItems = this.wishlistItems.filter(i => i.id !== item.id);
        // Notify wishlist update
        this.wishlistService.notifyWishlistUpdated();
      },
      error: (error) => {
        console.error('Error removing from wishlist:', error);
      }
    });
  }
}
