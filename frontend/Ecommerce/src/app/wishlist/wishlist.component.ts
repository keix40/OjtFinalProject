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
import { ImageService } from '../services/image.service';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import { PriceFormatService } from '../services/price-format.service';

interface WishlistItem {
  id: number;
  title: string;
  price: number;
  image: string;
  oldPrice?: number;
  addedOn?: string;
  wishlistDate?: string;
  originalPrice?: number;
  discountedPrice?: number;
  hasDiscount?: boolean;
  discountType?: string;
  discountValue?: number;
  discountName?: string;
}

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
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
    private cartService: CartService,
    public imageService: ImageService,
    private priceFormatService: PriceFormatService
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

    this.wishlistService.getWishlistWithDiscounts(this.userId).subscribe({
      next: (wishlistItems: any[]) => {
        this.wishlistItems = wishlistItems.map(item => ({
          id: item.id,
          title: item.productName,
          price: item.discountedPrice || item.originalPrice,
          originalPrice: item.originalPrice,
          discountedPrice: item.discountedPrice,
          image: this.imageService.getFullImageUrl(item.imageUrl),
          hasDiscount: item.hasDiscount,
          discountType: item.discountType,
          discountValue: item.discountValue,
          discountName: item.discountName,
          wishlistDate: item.wishlistDate
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
    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.cartService.addToCart({
      userId: this.userId,
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

 goToProductDetail(productId: number): void {
  console.log('Navigating to product:', productId);
  this.router.navigate(['/product', productId]);
}

 getDiscountText(item: WishlistItem): string {
  if (!item.hasDiscount || !item.discountValue) return '';
  
  if (item.discountType === 'PERCENTAGE') {
    return `${Math.round(item.discountValue * 100)}% OFF`;
  } else {
    return `${this.formatPriceOnly(item.discountValue)} MMK OFF`;
  }
}

  // Price formatting methods
  formatPrice(price: number, currency: string = 'MMK'): string {
    return this.priceFormatService.formatPrice(price, currency);
  }

  formatPriceOnly(price: number): string {
    return this.priceFormatService.formatPriceOnly(price);
  }

  formatDiscountedPrice(originalPrice: number, discountValue: number, discountType: string, currency: string = 'MMK'): string {
    return this.priceFormatService.formatDiscountedPrice(originalPrice, discountValue, discountType, currency);
  }

  formatDiscountText(discountValue: number, discountType: string): string {
    return this.priceFormatService.formatDiscountText(discountValue, discountType);
  }
} 