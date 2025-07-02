import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../services/cart.service';
import { Observable, Subscription } from 'rxjs';
import { WishlistService } from '../services/wishlist.service';
import { AuthService } from '../auth/auth.service';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

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

  constructor(
    private router: Router,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private authService: AuthService
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
}