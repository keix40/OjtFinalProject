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
  relatedProducts: any[] = [];

  userId: number | null = null;
  activeDiscounts: any[] = [];
  productDiscounts: Map<number, any> = new Map();
  productDetails: Map<number, ProductDTO> = new Map();
  isFirstTimeBuyerDiscount: boolean = false;
  maxQuantities: Map<string, number> = new Map();


  discountId: number | null = null;
  promoCode: string = '';
  promoMessage: string = '';
  promoSuccess: boolean = false;
  couponDiscount: number = 0;
  couponDiscountType: string = '';
  couponInfoMessage: string = '';
  appliedCouponName: string = '';
  private isValidatingCoupon: boolean = false;
  private isComponentInitialized: boolean = false;

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
        
        // Load coupon data after cart items are loaded
        this.loadCouponFromStorage();
        
        // Clear coupon if cart is empty
        if (items.length === 0 && this.promoSuccess) {
          this.removeCoupon();
        }
        
        this.loadProductDetails();
        this.loadMaxQuantities(); // fetch max quantities
        
        // If there's only one item in cart, load related products for that specific item
        if (items.length === 1) {
          this.loadCartItemRelatedProducts(items[0].id);
        } else {
          this.loadRelatedProducts();
        }
      }),
      this.cartService.getCartTotal().subscribe(total => {
        this.cartTotal = total;
      })
    );
    this.loadActiveDiscounts();
    this.checkFirstTimeBuyerDiscount();
    
    // Set component as initialized after all initializations
    setTimeout(() => {
      this.isComponentInitialized = true;
      console.log('Component fully initialized');
      
      // Trigger validation if coupon is loaded
      if (this.promoSuccess && this.couponDiscount) {
        console.log('Triggering delayed validation after initialization');
        this.validateStoredCoupon();
      }
    }, 1000);
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
      this.loadRelatedProducts(); // Load related products after product details are loaded
      
      // Validate stored coupon after product details are loaded with a delay
      if (this.promoSuccess && this.couponDiscount && this.isComponentInitialized) {
        // Add a small delay to ensure all data is properly loaded
        setTimeout(() => {
          this.validateStoredCoupon();
        }, 500);
      }
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
            eventName: discount.name,
            minimumSpend: discount.minimumSpend
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
    
    const discount = this.productDiscounts.get(productId);
    if (!discount) return null;
    
    // Get the product to check its price
    const product = this.productDetails.get(productId);
    if (!product) return null;
    
    // Check minimum spend requirement
    if (discount.minimumSpend && discount.minimumSpend > 0) {
      if (product.price < discount.minimumSpend) {
        // Product price is lower than minimum spend, don't show discount
        return null;
      }
    }
    
    return discount;
  }

  getFinalDiscountedPrice(product: ProductDTO): number {
    let price = product.price;
    const productDiscount = this.getProductDiscount(product.id);

    // 1. Apply product-based discount (if any)
    if (productDiscount) {
      if (productDiscount.discountType === 'PERCENTAGE') {
        price = price - (price * productDiscount.discount_percent / 100);
      } else {
        price = price - productDiscount.discount_amount;
      }
    }

    // 2. Apply VIP tier discount (if any)
    const token = localStorage.getItem('token');
    let userVipTier = null;
    if (token) {
      try {
        userVipTier = JSON.parse(atob(token.split('.')[1])).vipTier;
      } catch {}
    }
    if (userVipTier && this.activeDiscounts && this.activeDiscounts.length > 0) {
      // Find the best VIP discount for this tier
      const vipDiscount = this.activeDiscounts.find(d =>
        (d.rules || []).some((r: any) => r.targetType === 'VIP_TIER' && r.vipTierName === userVipTier)
      );
      if (vipDiscount && vipDiscount.discount_percent) {
        price = price - (price * vipDiscount.discount_percent / 100);
      }
    }

    return Math.round(price);
  }

  getVipDiscountDisplay(product: ProductDTO): string {
    const token = localStorage.getItem('token');
    let userVipTier = null;
    if (token) {
      try {
        userVipTier = JSON.parse(atob(token.split('.')[1])).vipTier;
      } catch {}
    }
    if (!userVipTier) return '';
    const vipDiscount = this.activeDiscounts.find(d =>
      (d.rules || []).some((r: any) => r.targetType === 'VIP_TIER' && r.vipTierName === userVipTier)
    );
    if (vipDiscount && vipDiscount.discount_percent) {
      return `${userVipTier.charAt(0).toUpperCase() + userVipTier.slice(1)} Tier ${vipDiscount.discount_percent}% OFF`;
    }
    return '';
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
        total += this.getFinalDiscountedPrice(product) * item.quantity;
      } else {
        total += item.price * item.quantity;
      }
    }
    return total;
  }

  // Returns the sum of original prices (before discount)
  getSubtotal(): number {
    let subtotal = 0;
    for (const item of this.cartItems) {
      const product = this.productDetails.get(item.productId || item.id);
      if (product) {
        subtotal += product.price * item.quantity;
      } else {
        subtotal += item.price * item.quantity;
      }
    }
    return subtotal;
  }

  // Returns the total discount amount saved
  getTotalDiscount(): number {
    if (this.isFirstTimeBuyerDiscount) {
      return this.getFirstTimeBuyerDiscountAmount();
    }
    
    if (this.hasProductDiscount()) {
      // Product discount exists, coupon cannot be used, so use product + VIP tier discounts
      const productDiscount = this.getTotalProductDiscount();
      const vipDiscount = this.getVipTierDiscountAmount();
      console.log('Product discount:', productDiscount, 'VIP discount:', vipDiscount);
      return productDiscount + vipDiscount;
      }
    
    // No product discount, allow coupon + VIP tier
    const couponDiscount = this.getCouponDiscountAmount();
    const vipDiscount = this.getVipTierDiscountAmount();
    console.log('Coupon discount:', couponDiscount, 'VIP discount:', vipDiscount);
    return couponDiscount + vipDiscount;
  }

  getTotalProductDiscount(): number {
    let discount = 0;
    for (const item of this.cartItems) {
      const product = this.productDetails.get(item.productId || item.id);
      if (product && this.getProductDiscount(product.id)) {
        const original = product.price * item.quantity;
        const discounted = Math.round(this.getFinalDiscountedPrice(product) * item.quantity);
        discount += (original - discounted);
      }
    }
    return discount;
  }

  // Returns the final order total: subtotal - discount (no tax, no shipping)
  getOrderTotal(): number {
    const subtotal = this.getSubtotal();
  
    if (this.isFirstTimeBuyerDiscount) {
      return Math.round(subtotal - this.getFirstTimeBuyerDiscountAmount());
    }
  
    if (this.hasProductDiscount()) {
      // Product discount exists, coupon cannot be used, so use product + VIP tier discounts
      return Math.round(subtotal - this.getTotalProductDiscount() - this.getVipTierDiscountAmount());
    }
  
    // No product discount, allow coupon + VIP tier
    return Math.round(subtotal - this.getCouponDiscountAmount() - this.getVipTierDiscountAmount());
  }

  // Returns the amount saved by first time buyer discount (10% of subtotal)
  getFirstTimeBuyerDiscountAmount(): number {
    return Math.round(this.getSubtotal() * 0.10);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.saveCouponToStorage(); // Save coupon data on destroy
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
      // Load related products for this specific cart item when quantity is updated
      this.loadCartItemRelatedProducts(itemId);
    }
  }

  continueShopping() {
    this.router.navigate(['/userproductlist']);
  }

  goToProductDetail(productId: number) {
    this.router.navigate(['/product', productId]);
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

  // Helper to get unique key for maxQuantities map
  getItemKey(item: CartItem): string {
    return item.variantId ? `${item.productId || item.id}-${item.variantId}` : `${item.productId || item.id}`;
  }

  // Fetch max quantity for each cart item (by variant or product)
  loadMaxQuantities() {
    this.maxQuantities.clear();
    for (const item of this.cartItems) {
      const key = this.getItemKey(item);
      if (item.variantId) {
        this.productService.getProductVariantStock(item.variantId).subscribe(stock => {
          this.maxQuantities.set(key, stock);
        });
      } else if (item.productId) {
        this.productService.getProductQuantity(item.productId).subscribe(stock => {
          this.maxQuantities.set(key, stock);
        });
      } else {
        this.maxQuantities.set(key, 0);
      }
    }
  }

  getMaxQuantity(item: CartItem): number {
    return this.maxQuantities.get(this.getItemKey(item)) ?? 0;
  }

  increaseQty(item: CartItem) {
    const maxQty = this.getMaxQuantity(item);
    if (item.quantity < maxQty) {
      this.updateQuantity(item.id, item.quantity + 1);
    }
  }

  decreaseQty(item: CartItem) {
    if (item.quantity > 1) {
      this.updateQuantity(item.id, item.quantity - 1);
    }
  }

  clearCart() {
    this.cartService.clearCart();
    // Clear coupon when cart is cleared
    this.removeCoupon();
  }

  proceedToCheckout() {
    this.goToCheckout();
  }

  loadRelatedProducts() {
    if (this.cartItems.length === 0) {
      this.relatedProducts = [];
      return;
    }

    // Collect all category IDs and brand IDs from cart items
    const categoryIds: number[] = [];
    const brandIds: number[] = [];
    const excludeProductIds: number[] = [];

    this.cartItems.forEach(item => {
      excludeProductIds.push(item.productId || item.id);
      
      const product = this.productDetails.get(item.productId || item.id);
      if (product && product.categoryBrandArray) {
        product.categoryBrandArray.forEach(pair => {
          if (pair.categoryId) {
            categoryIds.push(pair.categoryId);
          }
          if (pair.brandId) {
            brandIds.push(pair.brandId);
          }
        });
      }
    });

    // Remove duplicates
    const uniqueCategoryIds = [...new Set(categoryIds)];
    const uniqueBrandIds = [...new Set(brandIds)];
    const uniqueExcludeProductIds = [...new Set(excludeProductIds)];

    if (uniqueCategoryIds.length === 0 && uniqueBrandIds.length === 0) {
      this.relatedProducts = [];
      return;
    }

    this.productService.getRelatedProducts(uniqueCategoryIds, uniqueBrandIds, 0, uniqueExcludeProductIds)
      .subscribe({
        next: (products) => {
          // Randomly select 4 products
          this.relatedProducts = this.shuffleArray(products).slice(0, 4);
        },
        error: (error) => {
          console.error('Error loading related products:', error);
          this.relatedProducts = [];
        }
      });
  }

  // Separate method for cart item related products
  loadCartItemRelatedProducts(cartItemId: number) {
    const cartItem = this.cartItems.find(item => item.id === cartItemId);
    if (!cartItem) {
      console.log('Cart item not found:', cartItemId);
      return;
    }

    const product = this.productDetails.get(cartItem.productId || cartItem.id);
    if (!product || !product.categoryBrandArray) {
      console.log('Product details not found for cart item:', cartItemId);
      return;
    }

    // Collect category IDs and brand IDs from this specific product
    const categoryIds: number[] = [];
    const brandIds: number[] = [];
    const excludeProductIds: number[] = [cartItem.productId || cartItem.id];

    product.categoryBrandArray.forEach(pair => {
      if (pair.categoryId) {
        categoryIds.push(pair.categoryId);
      }
      if (pair.brandId) {
        brandIds.push(pair.brandId);
      }
    });

    // Remove duplicates
    const uniqueCategoryIds = [...new Set(categoryIds)];
    const uniqueBrandIds = [...new Set(brandIds)];

    if (uniqueCategoryIds.length === 0 && uniqueBrandIds.length === 0) {
      console.log('No category or brand IDs found for cart item:', cartItemId);
      return;
    }

    console.log('Loading related products for cart item:', cartItemId);
    console.log('Category IDs:', uniqueCategoryIds);
    console.log('Brand IDs:', uniqueBrandIds);
    console.log('Exclude product IDs:', excludeProductIds);

    this.productService.getRelatedProducts(uniqueCategoryIds, uniqueBrandIds, 0, excludeProductIds)
      .subscribe({
        next: (products) => {
          console.log('Backend returned related products for cart item:', products?.length || 0);
          if (products && products.length > 0) {
            // Randomly select 4 products
            this.relatedProducts = this.shuffleArray(products).slice(0, 4);
            console.log('Related products loaded for cart item:', this.relatedProducts.length);
          } else {
            console.log('No related products found from backend for cart item');
            this.relatedProducts = [];
          }
        },
        error: (error) => {
          console.error('Failed to load related products for cart item:', error);
          this.relatedProducts = [];
        }
      });
  }

  // Helper method to shuffle array
  shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Method to handle when a new item is added to cart
  onCartItemAdded(cartItemId: number) {
    console.log('New cart item added:', cartItemId);
    // Load related products for this specific cart item
    this.loadCartItemRelatedProducts(cartItemId);
  }

  // Helper methods for related products discount display
  getRelatedProductDiscount(product: any): any {
    if (!this.activeDiscounts || this.activeDiscounts.length === 0) {
      return null;
    }
    
    for (const discount of this.activeDiscounts) {
      const rules = discount.rules || [];
      for (const rule of rules) {
        if (this.isRelatedProductAffectedByRule(product, rule)) {
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

  isRelatedProductAffectedByRule(product: any, rule: any): boolean {
    switch (rule.targetType) {
      case 'PRODUCT':
        return rule.productId === product.id;
      case 'BRAND':
        if (!product.categoryBrandArray) return false;
        return product.categoryBrandArray.some((pair: any) => pair.brandId === rule.brandId);
      case 'CATEGORY':
        if (!product.categoryBrandArray) return false;
        return product.categoryBrandArray.some((pair: any) => pair.categoryId === rule.categoryId);
      case 'BRAND_CATEGORY':
        if (!product.categoryBrandArray) return false;
        return product.categoryBrandArray.some((pair: any) => pair.brandId === rule.brandId && pair.categoryId === rule.categoryId);
      default:
        return false;
    }
  }

  getRelatedProductDiscountText(product: any): string {
    const discount = this.getRelatedProductDiscount(product);
    if (!discount) return '';
    
    if (discount.discountType === 'PERCENTAGE') {
      return `${discount.discount_percent}% OFF`;
    } else {
      return `Save ${discount.discount_amount} MMK`;
    }
  }

  getRelatedProductFinalPrice(product: any): number {
    let price = product.price;
    const productDiscount = this.getRelatedProductDiscount(product);

    // Apply product-based discount (if any)
    if (productDiscount) {
      if (productDiscount.discountType === 'PERCENTAGE') {
        price = price - (price * productDiscount.discount_percent / 100);
      } else {
        price = price - productDiscount.discount_amount;
      }
    }

    // Apply VIP tier discount (if any)
    const token = localStorage.getItem('token');
    let userVipTier = null;
    if (token) {
      try {
        userVipTier = JSON.parse(atob(token.split('.')[1])).vipTier;
      } catch {}
    }
    if (userVipTier && this.activeDiscounts && this.activeDiscounts.length > 0) {
      const vipDiscount = this.activeDiscounts.find(d =>
        (d.rules || []).some((r: any) => r.targetType === 'VIP_TIER' && r.vipTierName === userVipTier)
      );
      if (vipDiscount) {
        price = price - (price * vipDiscount.discount_percent / 100);
      }
    }
    return Math.round(price);
  }

  // VIP discount display for related products
  getRelatedProductVipDiscount(product: any): string {
    const token = localStorage.getItem('token');
    let userVipTier = null;
    if (token) {
      try {
        userVipTier = JSON.parse(atob(token.split('.')[1])).vipTier;
      } catch {}
    }
    if (!userVipTier) return '';
    const vipDiscount = this.activeDiscounts.find(d =>
      (d.rules || []).some((r: any) => r.targetType === 'VIP_TIER' && r.vipTierName === userVipTier)
    );
    if (vipDiscount && vipDiscount.discount_percent) {
      return `${userVipTier.charAt(0).toUpperCase() + userVipTier.slice(1)} ${vipDiscount.discount_percent}% OFF`;
    }
    return '';
  }

  // Wishlist methods for related products
  isRelatedProductInWishlist(productId: number): boolean {
    return this.wishlist.has(productId);
  }

  toggleRelatedProductWishlist(productId: number, event: Event) {
    event.stopPropagation();
    this.moveToWishlist(productId);
  }

  // Add related product to cart
  addRelatedProductToCart(product: any, event: Event) {
    event.stopPropagation();
    this.addToCart(product);
  }

  // Add product to cart method
  addToCart(product: any): void {
    if (!this.userId) {
      alert("You must be logged in to add items to cart.");
      return;
    }

    const cartItem: CartItem = {
      id: Date.now(), // Generate temporary ID
      productId: product.id,
      title: product.productName,
      price: product.price,
      quantity: 1,
      image: this.imageService.getProductImageUrl(product),
      color: product.color || null,
      size: product.size || null,
      variantId: product.variantId || null,
      variantAttributes: product.variantAttributes || null
    };

    this.cartService.addToCart(cartItem);
    
    // Show success message
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

  // Get rating for related products
  getRelatedProductRating(product: any): number {
    if (!product || !product.averageRating) {
      return 0;
    }
    // Return rounded rating for display purposes
    return Math.round(product.averageRating * 10) / 10;
  }

  applyPromoCode() {
  this.promoMessage = '';
  this.promoSuccess = false;
  this.couponInfoMessage = '';
  const userId = this.userId;
  const total = this.getSubtotal();

  this.discountService.getCouponMinimumSpend(this.promoCode).subscribe({
    next: minSpend => {
      console.log('minSpend:', minSpend, 'total:', total); // Debug log
      if (minSpend == null) {
        this.promoMessage = 'promo code invalid';
        this.promoSuccess = false;
        this.couponDiscount = 0;
        this.couponDiscountType = '';
        this.couponInfoMessage = '';
        return;
      }
      if (total < minSpend) {
        this.promoMessage = `This promo code only allow for over ${minSpend}mmk`;
        this.promoSuccess = false;
        this.couponDiscount = 0;
        this.couponDiscountType = '';
        this.couponInfoMessage = '';
        return; // Do NOT call backend
      }
      // Only now call the backend to validate the coupon
      this.http.post<any>('http://localhost:8080/api/coupons/validate', {
        couponCode: this.promoCode,
        userId: userId,
        total: total
      }).subscribe({
        next: (res) => {
          if (res.valid) {
            this.promoSuccess = true;
            this.couponDiscount = res.discountAmount;
            this.couponDiscountType = res.discountType; // 'PERCENTAGE' or 'FIXED'
            this.appliedCouponName = res.couponName || this.promoCode;
            // Set the detailed coupon message with proper coupon name
            if (res.discountType === 'PERCENTAGE') {
              this.promoMessage = `You are using ${this.appliedCouponName} for save ${res.discountAmount}% off`;
            } else {
              this.promoMessage = `You are using ${this.appliedCouponName} for save ${res.discountAmount} MMK`;
            }
            this.couponInfoMessage = '';
            this.promoCode = ''; // Clear input after successful application
            this.discountId = res.discountId;
            this.saveCouponToStorage(); // Save to localStorage
          } else {
            this.promoMessage = res.message || 'Invalid promo code';
            this.promoSuccess = false;
            this.couponDiscount = 0;
            this.couponDiscountType = '';
            this.couponInfoMessage = '';
            this.appliedCouponName = '';
            this.clearCouponFromStorage(); // Clear from localStorage
          }
        },
        error: (err) => {
          this.promoMessage = err.error?.message || err.message || 'promo code invalid';
          this.promoSuccess = false;
          this.couponDiscount = 0;
          this.couponDiscountType = '';
          this.couponInfoMessage = '';
          this.appliedCouponName = '';
          this.clearCouponFromStorage(); // Clear from localStorage
        }
      });
    },
    error: (err) => {
      this.promoMessage = err.error?.message || err.message || 'promo code invalid';
      this.promoSuccess = false;
      this.couponDiscount = 0;
      this.couponDiscountType = '';
      this.couponInfoMessage = '';
      this.appliedCouponName = '';
      this.clearCouponFromStorage(); // Clear from localStorage
    }
  });
}

getCouponDiscountAmount(): number {
  if (!this.promoSuccess || !this.couponDiscount) return 0;
  // Only apply coupon to products without a product discount
  let eligibleTotal = 0;
  for (const item of this.cartItems) {
    const product = this.productDetails.get(item.productId || item.id);
    if (product && !this.getProductDiscount(product.id)) {
      eligibleTotal += product.price * item.quantity;
    }
  }
  if (this.couponDiscountType === 'PERCENTAGE') {
    return Math.round(eligibleTotal * this.couponDiscount / 100);
  } else {
    return this.couponDiscount;
  }
}

getVipTierDiscountAmount(): number {
  const token = localStorage.getItem('token');
  let userVipTier = null;
  if (token) {
    try {
      userVipTier = JSON.parse(atob(token.split('.')[1])).vipTier;
    } catch {}
  }
  if (!userVipTier || !this.activeDiscounts.length) return 0;
  const vipDiscount = this.activeDiscounts.find(d =>
    (d.rules || []).some((r: any) => r.targetType === 'VIP_TIER' && r.vipTierName === userVipTier)
  );
  if (!vipDiscount || !vipDiscount.discount_percent) return 0;
  let vipDiscountAmount = 0;
  for (const item of this.cartItems) {
    const product = this.productDetails.get(item.productId || item.id);
    if (product) {
      // Apply VIP discount to the already product-discounted price
      let price = product.price;
      const productDiscount = this.getProductDiscount(product.id);
      if (productDiscount) {
        if (productDiscount.discountType === 'PERCENTAGE') {
          price = price - (price * productDiscount.discount_percent / 100);
        } else {
          price = price - productDiscount.discount_amount;
        }
      }
      vipDiscountAmount += Math.round(price * vipDiscount.discount_percent / 100) * item.quantity;
    }
  }
  return vipDiscountAmount;
}

   hasProductDiscount(): boolean {
       const result = this.cartItems.some(item => !!this.getProductDiscount(item.productId || item.id));
       console.log('hasProductDiscount:', result, this.cartItems.map(item => this.getProductDiscount(item.productId || item.id)));
       return result;
     }

  // Check if coupon input should be disabled
  isCouponInputDisabled(): boolean {
    return this.hasProductDiscount() || this.promoSuccess;
  }

  // Get the reason why coupon input is disabled
  getCouponDisabledReason(): string {
    if (this.hasProductDiscount()) {
      return 'Cannot use with product discounts';
    }
    if (this.promoSuccess) {
      return 'Coupon already applied';
    }
    return '';
  }

  // Get the coupon name for display
  getCouponName(): string {
    if (!this.promoSuccess || !this.couponDiscount) return '';
    return this.appliedCouponName || this.promoCode;
  }

  // Remove the applied coupon
  removeCoupon() {
    this.promoSuccess = false;
    this.couponDiscount = 0;
    this.couponDiscountType = '';
    this.promoMessage = '';
    this.promoCode = '';
    this.couponInfoMessage = '';
    this.appliedCouponName = '';
    this.clearCouponFromStorage();
  }

  // Save coupon data to localStorage
  private saveCouponToStorage(): void {
    if (this.promoSuccess && this.couponDiscount) {
      const couponData = {
        promoCode: this.promoCode,
        promoSuccess: this.promoSuccess,
        couponDiscount: this.couponDiscount,
        couponDiscountType: this.couponDiscountType,
        appliedCouponName: this.appliedCouponName,
        discountId: this.discountId,
        promoMessage: this.promoMessage
      };
      localStorage.setItem('appliedCoupon', JSON.stringify(couponData));
    } else {
      localStorage.removeItem('appliedCoupon');
    }
  }

  // Load coupon data from localStorage
  private loadCouponFromStorage(): void {
    console.log('Loading coupon from localStorage...');
    const savedCoupon = localStorage.getItem('appliedCoupon');
    if (savedCoupon) {
      try {
        const couponData = JSON.parse(savedCoupon);
        this.promoCode = couponData.promoCode || '';
        this.promoSuccess = couponData.promoSuccess || false;
        this.couponDiscount = couponData.couponDiscount || 0;
        this.couponDiscountType = couponData.couponDiscountType || '';
        this.appliedCouponName = couponData.appliedCouponName || '';
        this.promoMessage = couponData.promoMessage || '';
        this.discountId = couponData.discountId || '';
        
        console.log('Coupon loaded from localStorage:', {
          promoCode: this.promoCode,
          promoSuccess: this.promoSuccess,
          couponDiscount: this.couponDiscount,
          couponDiscountType: this.couponDiscountType,
          appliedCouponName: this.appliedCouponName,
          discountId: this.discountId
        });
        
        // Validation will be called after product details are loaded
      } catch (error) {
        console.error('Error loading coupon from localStorage:', error);
        localStorage.removeItem('appliedCoupon');
      }
    } else {
      console.log('No coupon found in localStorage');
    }
  }

  // Validate stored coupon to ensure it's still valid
  private validateStoredCoupon(): void {
    if (this.isValidatingCoupon) {
      console.log('Validation already in progress, skipping');
      return;
    }
    
    if (!this.userId || !this.promoCode) {
      console.log('Validation skipped: missing userId or promoCode');
      this.clearCouponFromStorage();
      return;
    }

    // Ensure component is fully initialized
    if (!this.isComponentInitialized) {
      console.log('Validation skipped: component not fully initialized');
      return;
    }

    // Ensure cart items are loaded
    if (!this.cartItems || this.cartItems.length === 0) {
      console.log('Validation skipped: no cart items');
      return;
    }

    // Ensure product details are loaded
    if (this.productDetails.size === 0) {
      console.log('Validation skipped: product details not loaded');
      return;
    }

    const total = this.getSubtotal();
    
    // Don't validate if subtotal is 0 (cart items not loaded yet)
    if (total <= 0) {
      console.log('Validation skipped: subtotal is 0');
      return;
    }
    
    this.isValidatingCoupon = true;
    console.log('Validating stored coupon:', {
      promoCode: this.promoCode,
      userId: this.userId,
      total: total,
      cartItemsCount: this.cartItems.length,
      productDetailsCount: this.productDetails.size
    });
    
    this.http.post<any>('http://localhost:8080/api/coupons/validate', {
      couponCode: this.promoCode,
      userId: this.userId,
      total: total
    }).subscribe({
      next: (res) => {
        this.isValidatingCoupon = false;
        console.log('Coupon validation response:', res);
        if (!res.valid) {
          console.log('Coupon validation failed, clearing coupon');
          // Coupon is no longer valid, clear it
          this.promoSuccess = false;
          this.couponDiscount = 0;
          this.couponDiscountType = '';
          this.promoMessage = '';
          this.promoCode = '';
          this.couponInfoMessage = '';
          this.appliedCouponName = '';
          this.clearCouponFromStorage();
        } else {
          console.log('Coupon validation successful');
          // Update coupon data with fresh data from server
          this.couponDiscount = res.discountAmount;
          this.couponDiscountType = res.discountType;
          this.appliedCouponName = res.couponName || this.promoCode;
          this.saveCouponToStorage();
        }
      },
      error: (err) => {
        this.isValidatingCoupon = false;
        console.error('Coupon validation error:', err);
        
        // Don't clear coupon on network errors, only on validation failures
        if (err.status === 0 || err.status >= 500) {
          console.log('Network error during validation, keeping coupon');
          return;
        }
        
        // Only clear coupon on specific validation errors
        if (err.status === 400 || err.status === 404) {
          console.log('Validation error, clearing coupon');
          this.promoSuccess = false;
          this.couponDiscount = 0;
          this.couponDiscountType = '';
          this.promoMessage = '';
          this.promoCode = '';
          this.couponInfoMessage = '';
          this.appliedCouponName = '';
          this.clearCouponFromStorage();
        }
      }
    });
    
    // Add timeout to prevent hanging
    setTimeout(() => {
      if (this.isValidatingCoupon) {
        console.log('Coupon validation timeout, clearing flag');
        this.isValidatingCoupon = false;
      }
    }, 10000); // 10 second timeout
  }

  // Clear coupon data from localStorage
  private clearCouponFromStorage(): void {
    localStorage.removeItem('appliedCoupon');
  }

  // Public method for debugging coupon persistence
  public debugCouponStatus(): void {
    console.log('=== COUPON DEBUG INFO ===');
    console.log('Component initialized:', this.isComponentInitialized);
    console.log('Cart items count:', this.cartItems.length);
    console.log('Product details count:', this.productDetails.size);
    console.log('Promo success:', this.promoSuccess);
    console.log('Coupon discount:', this.couponDiscount);
    console.log('Applied coupon name:', this.appliedCouponName);
    console.log('LocalStorage coupon:', localStorage.getItem('appliedCoupon'));
    console.log('Subtotal:', this.getSubtotal());
    console.log('Is validating:', this.isValidatingCoupon);
    console.log('========================');
  }

  // Public method to manually trigger validation for testing
  public testCouponValidation(): void {
    console.log('Manually triggering coupon validation...');
    this.validateStoredCoupon();
  }

  // Public method to test backend connectivity
  public testBackendConnection(): void {
    console.log('Testing backend connection...');
    this.http.get('http://localhost:8080/api/coupons/test', { responseType: 'text' }).subscribe({
      next: (response) => {
        console.log('Backend connection successful:', response);
      },
      error: (error) => {
        console.log('Backend connection failed:', error);
      }
    });
  }
}
