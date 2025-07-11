import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../services/cart.service';
import { ImageService } from '../services/image.service';
import { Observable, Subscription } from 'rxjs';
import { WishlistService } from '../services/wishlist.service';
import { AuthService } from '../auth/auth.service';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { DiscountService } from '../services/discount.service';
import { ProductService } from '../services/product.service';
import { ProductDTO } from '../product';
import { HttpClient } from '@angular/common/http';

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
  wishlist = new Set<number>();

  userId: number | null = null;
  activeDiscounts: any[] = [];
  productDiscounts: Map<number, any> = new Map();
  productDetails: Map<number, ProductDTO> = new Map();
  isFirstTimeBuyerDiscount: boolean = false;

  constructor(
    private router: Router,
    private cartService: CartService,
    public imageService: ImageService,
    private wishlistService: WishlistService,
    private authService: AuthService,
    private discountService: DiscountService,
    private productService: ProductService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.userId = this.authService.getUserId();
    if(!this.userId) {
      this.router.navigate(['/login']);
      return;
    }
    this.subscriptions.push(
      this.cartService.getCartItems().subscribe(items => {
        this.cartItems = items;
        this.selectedItems = items.length;
        this.loadProductDetails();
      }),
      this.cartService.getCartTotal().subscribe(total => {
        this.cartTotal = total;
      })
    );
    this.loadActiveDiscounts();
    this.checkFirstTimeBuyerDiscount();
  }

  loadActiveDiscounts() {
    this.discountService.getActiveDiscount().subscribe({
      next: (discounts) => {
        this.activeDiscounts = discounts;
        this.calculateProductDiscounts();
      }
    });
  }

  loadProductDetails() {
    const productIds = this.cartItems.map(item => item.productId || item.id);
    if (productIds.length === 0) return;
    this.productService.getProductsByIds(productIds).subscribe(products => {
      products.forEach(product => {
        this.productDetails.set(product.id, product);
      });
      this.calculateProductDiscounts();
    });
  }

  calculateProductDiscounts() {
    this.productDiscounts.clear();
    this.cartItems.forEach(item => {
      const product = this.productDetails.get(item.productId || item.id);
      if (product) {
        const discount = this.findApplicableDiscount(product);
        if (discount) {
          this.productDiscounts.set(product.id, discount);
        }
      }
    });
  }

  findApplicableDiscount(product: ProductDTO): any {
    if (!this.activeDiscounts || this.activeDiscounts.length === 0) {
      return null;
    }
    for (const discount of this.activeDiscounts) {
      const rules = discount.rules || [];
      for (const rule of rules) {
        if (this.isProductAffectedByRule(product, rule)) {
          return {
            id: discount.id,
            name: discount.name,
            discount_percent: discount.discount_percent,
            discount_amount: discount.discount_amount,
            discountType: discount.discountType,
            targetType: rule.targetType,
            eventName: discount.name
          };
        }
      }
    }
    return null;
  }

  isProductAffectedByRule(product: ProductDTO, rule: any): boolean {
    switch (rule.targetType) {
      case 'PRODUCT':
        return rule.productId === product.id;
      case 'BRAND':
        if (!product.categoryBrandArray) return false;
        return product.categoryBrandArray.some(pair => pair.brandId === rule.brandId);
      case 'CATEGORY':
        if (!product.categoryBrandArray) return false;
        return product.categoryBrandArray.some(pair => pair.categoryId === rule.categoryId);
      case 'BRAND_CATEGORY':
        if (!product.categoryBrandArray) return false;
        return product.categoryBrandArray.some(pair => pair.brandId === rule.brandId && pair.categoryId === rule.categoryId);
      default:
        return false;
    }
  }

  getProductDiscount(productId: number): any {
    if (this.isFirstTimeBuyerDiscount) return null;
    return this.productDiscounts.get(productId);
  }

  getDiscountedPrice(product: ProductDTO): number {
    if (this.isFirstTimeBuyerDiscount) return product.price;
    const discount = this.getProductDiscount(product.id);
    if (!discount) return product.price;
    if (discount.discountType === 'PERCENTAGE') {
      return product.price - (product.price * discount.discount_percent / 100);
    } else {
      return Math.max(0, product.price - discount.discount_amount);
    }
  }

  getDiscountDisplayText(discount: any): string {
    if (!discount) return '';
    if (discount.discountType === 'PERCENTAGE') {
      return `${discount.discount_percent}% OFF`;
    } else {
      return `Save ${discount.discount_amount} MMK`;
    }
  }

  getTotal(): number {
    let total = 0;
    for (const item of this.cartItems) {
      const product = this.productDetails.get(item.productId || item.id);
      if (product) {
        total += this.getDiscountedPrice(product) * item.quantity;
      } else {
        total += item.price * item.quantity;
      }
    }
    return total;
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

  moveToWishlist(productId: number): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      alert("You must be logged in to use the wishlist.");
      return;
    }
  
    if (this.wishlist.has(productId)) {
      this.wishlist.delete(productId);
      this.wishlistService.removeWishlist(userId, productId).subscribe({
        next: () => {
          this.updateWishlistCount();
          this.wishlistService.notifyWishlistUpdated();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Removed from wishlist',
            showConfirmButton: false,
            timer: 1200,
            timerProgressBar: true,
            customClass: { popup: 'swal2-toast' }
          });
        },
        error: err => {
          console.error('Failed to remove wishlist', err);
          alert(`Error: ${err.status} - ${err.error?.message || err.message}`);
          this.wishlist.add(productId);
        }
      });
    } else {
      this.wishlist.add(productId);
      this.wishlistService.saveWishlist(userId, productId).subscribe({
        next: () => {
          this.updateWishlistCount();
          this.wishlistService.notifyWishlistUpdated();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Added to wishlist',
            showConfirmButton: false,
            timer: 1200,
            timerProgressBar: true,
            customClass: { popup: 'swal2-toast' }
          });
        },
        error: err => {
          console.error('Failed to save wishlist', err);
          alert(`Error: ${err.status} - ${err.error?.message || err.message}`);
          this.wishlist.delete(productId);
        }
      });
    }
  }

  moveAllToWishlist(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      alert('You must be logged in to use the wishlist.');
      return;
    }
  
    if (!this.cartItems || this.cartItems.length === 0) {
      alert('Your cart is empty.');
      return;
    }
  
    const saveCalls: Array<Observable<unknown>> = [];
    this.cartItems.forEach(item => {
      // Avoid duplicates in wishlist (assuming this.wishlist is a Set<number>)
      if (!this.wishlist.has(item.id)) {
        this.wishlist.add(item.id);
        saveCalls.push(this.wishlistService.saveWishlist(userId, item.id));
      }
    });
  
    if (saveCalls.length === 0) {
      alert('All cart items are already in the wishlist.');
      return;
    }
  
    forkJoin(saveCalls).subscribe({
      next: () => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Cart items moved to wishlist',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
          customClass: { popup: 'swal2-toast' }
        });
        this.wishlistService.notifyWishlistUpdated();
        this.updateWishlistCount();
      },
      error: (err) => {
        console.error(err);
        alert('Failed to move some cart items to wishlist.');
      }
    });
  }
  
  
  private updateWishlistCount(): void {
    const headerComponent = document.querySelector('app-header') as any;
    if (headerComponent) {
      headerComponent.wishlistCount = this.wishlist.size;
    }
  }

  checkFirstTimeBuyerDiscount(): void {
    const token = localStorage.getItem('token');
    let userId: number | null = null;
    if (token) {
      try {
        userId = JSON.parse(atob(token.split('.')[1])).id;
      } catch (e) {
        userId = null;
      }
    }
    if (!userId || this.cartItems.length === 0) {
      this.isFirstTimeBuyerDiscount = false;
      return;
    }
    const userOrderDto = {
      userId: userId,
      cartItem: this.cartItems.map(item => ({
        productId: item.productId || item.id,
        quantity: item.quantity,
        price: item.price
      }))
    };
    this.http.post<any>('http://localhost:8080/order/preview', userOrderDto).subscribe({
      next: (preview) => {
        this.isFirstTimeBuyerDiscount = preview.discountReason && preview.discountReason.toLowerCase().includes('first time buyer');
      },
      error: () => {
        this.isFirstTimeBuyerDiscount = false;
      }
    });
  }
  increaseQty(item: CartItem) {
    this.updateQuantity(item.id, item.quantity + 1);
  }

  decreaseQty(item: CartItem) {
    if (item.quantity > 1) {
      this.updateQuantity(item.id, item.quantity - 1);
    }
  }

  clearCart() {
    this.cartService.clearCart();
  }

  proceedToCheckout() {
    this.goToCheckout();
  }
}
