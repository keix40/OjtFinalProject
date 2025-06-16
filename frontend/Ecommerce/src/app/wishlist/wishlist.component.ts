import { Component, OnInit } from '@angular/core';
import { WishlistService } from '../services/wishlist.service';
import { AuthService } from '../auth/auth.service';
import { ProductService } from '../services/product.service';
import { ProductDTO } from '../product';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Wishlist } from '../wishlist';
import { CartService } from '../services/cart.service';
import Swal from 'sweetalert2';

interface WishlistItem {
  id: number;
  title: string;
  price: number;
  image: string;
  oldPrice?: number;
  addedOn?: string;
  wishlistDate?: string;
}

@Component({
  selector: 'app-wishlist',
  standalone: false,
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit {
  wishlistItems: WishlistItem[] = [];
  userId: number | null = null;
  allProducts: ProductDTO[] = [];
  isLoading = true;

  constructor(
    private wishlistService: WishlistService,
    private authService: AuthService,
    private productService: ProductService,
    private router: Router,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadAllProducts();
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
    if (!this.userId) return;

    this.wishlistService.getWishlistByUserId(this.userId).subscribe({
      next: (wishlistArr: Wishlist[]) => {
        this.wishlistItems = wishlistArr.map(entry => ({
          id: entry.product.id,
          title: entry.product.productName,
          price: entry.product.price,
          image: entry.product.productImages && entry.product.productImages.length > 0
            ? 'http://localhost:8080' + entry.product.productImages[0].imageUrl
            : '/assets/project_img/fashion_store.jpg',
          oldPrice: (entry.product as any).oldPrice,
          wishlistDate: entry.wishlistDate
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading wishlist:', error);
        this.isLoading = false;
      }
    });
  }

  addToCart(item: WishlistItem) {
    this.cartService.addToCart({
      id: item.id,
      title: item.title,
      price: item.price,
      quantity: 1,
      image: item.image,
      size: undefined,
      color: undefined
    });
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Added to cart',
      showConfirmButton: false,
      timer: 1200,
      timerProgressBar: true,
      customClass: { popup: 'swal2-toast' }
    });
  }

  removeFromWishlist(item: WishlistItem) {
    if (!this.userId) return;

    this.wishlistService.removeWishlist(this.userId, item.id).subscribe({
      next: () => {
        this.wishlistItems = this.wishlistItems.filter(i => i.id !== item.id);
        this.wishlistService.notifyWishlistUpdated();
      },
      error: (error) => {
        console.error('Error removing from wishlist:', error);
      }
    });
  }
} 