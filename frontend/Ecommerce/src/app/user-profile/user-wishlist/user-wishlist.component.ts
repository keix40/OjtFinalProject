import { Component, OnInit } from '@angular/core';
import { WishlistService } from '../../services/wishlist.service';
import { AuthService } from '../../auth/auth.service';
import { ProductService } from '../../services/product.service';
import { ProductDTO } from '../../product';
import { ImageService } from '../../services/image.service';

interface WishlistItem {
  id: number;
  title: string;
  price: number;
  image: string;
  oldPrice?: number;
  wishlistDate?: Date;
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
  isLoading: boolean = false;

  constructor(
    private wishlistService: WishlistService,
    private authService: AuthService,
    private productService: ProductService,
    public imageService: ImageService
  ) { }

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    if (this.userId) {
      this.loadAllProducts();
    }
  }

  private loadAllProducts() {
    this.isLoading = true;
    this.productService.getAllAcProduct().subscribe({
      next: (products) => {
        this.allProducts = products;
        this.loadWishlistItems();
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoading = false;
      }
    });
  }

  private loadWishlistItems() {
    if (!this.userId) {
      this.isLoading = false;
      return;
    }

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
              image: this.imageService.getProductImageUrl(product),
              oldPrice: undefined, // Not available in current ProductDTO
              wishlistDate: new Date() // You might want to get this from the wishlist service
            };
            this.wishlistItems.push(wishlistItem);
          }
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading wishlist:', error);
        this.isLoading = false;
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
