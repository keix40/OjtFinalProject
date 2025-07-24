import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../services/cart.service';
import { Subscription } from 'rxjs';
import { ImageService } from '../services/image.service';
import { HttpClient } from '@angular/common/http';
import { DiscountService } from '../services/discount.service';
import { ProductService } from '../services/product.service';
import { ProductDTO } from '../product';

@Component({
  selector: 'app-cart-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-sidebar.component.html',
  styleUrls: ['./cart-sidebar.component.css']
})
export class CartSidebarComponent implements OnInit, OnDestroy {
  @Input() showCartSidebar = false;
  @Output() closeSidebar = new EventEmitter<void>();

  cartItems: CartItem[] = [];
  cartTotal: number = 0;
  private subscriptions: Subscription[] = [];
  isFirstTimeBuyerDiscount = false;
  firstTimeBuyerDiscountAmount: number = 0;
  activeDiscounts: any[] = [];
  productDiscounts: Map<number, any> = new Map();
  productDetails: Map<number, ProductDTO> = new Map();
  maxQuantities: Map<string, number> = new Map();

  constructor(
    private router: Router, 
    private cartService: CartService,
    public imageService: ImageService,
    private http: HttpClient, // Add HttpClient for preview API
    private discountService: DiscountService,
    private productService: ProductService
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.cartService.getCartItems().subscribe(items => {
        this.cartItems = items;
        this.checkFirstTimeBuyerDiscount(); // Check discount when cart changes
        this.loadProductDetails();
        this.loadMaxQuantities(); // <-- fetch max quantities
      }),
      this.cartService.getCartTotal().subscribe(total => {
        this.cartTotal = total;
      })
    );
    this.checkFirstTimeBuyerDiscount(); // Check on init
    this.loadActiveDiscounts();
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

    // 2. Always apply VIP tier discount (if any)
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

  getVipDiscountPercent(product: ProductDTO): number | null {
    const token = localStorage.getItem('token');
    let userVipTier = null;
    if (token) {
      try {
        userVipTier = JSON.parse(atob(token.split('.')[1])).vipTier;
      } catch {}
    }
    if (!userVipTier) return null;
    const vipDiscount = this.activeDiscounts.find(d =>
      (d.rules || []).some((r: any) => r.targetType === 'VIP_TIER' && r.vipTierName === userVipTier)
    );
    return vipDiscount ? vipDiscount.discount_percent : null;
  }

  getDiscountedPrice(product: ProductDTO): number {
    if (this.isFirstTimeBuyerDiscount) return product.price;
    return this.getFinalDiscountedPrice(product);
  }

  getDiscountDisplayText(discount: any): string {
    if (!discount) return '';
    if (discount.discountType === 'PERCENTAGE') {
      return `${discount.discount_percent}% OFF`;
    } else {
      return `Save ${discount.discount_amount} MMK`;
    }
  }

  checkFirstTimeBuyerDiscount() {
    // You may want to get userId from a service if needed
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
        this.firstTimeBuyerDiscountAmount = preview.discountAmount || 0;
      },
      error: () => {
        this.isFirstTimeBuyerDiscount = false;
        this.firstTimeBuyerDiscountAmount = 0;
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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

  // Returns the max quantity allowed for a cart item based on product or variant stock
  getMaxQuantity(item: CartItem): number {
    return this.maxQuantities.get(this.getItemKey(item)) ?? 0;
  }

  decrementQty(item: CartItem) {
    if (item.quantity > 0) {
      this.cartService.updateQuantity(item.id, item.quantity - 1);
    }
  }

  incrementQty(item: CartItem) {
    const maxQty = this.getMaxQuantity(item);
    if (item.quantity < maxQty) {
      this.cartService.updateQuantity(item.id, item.quantity + 1);
    }
  }

  removeItem(item: CartItem) {
    this.cartService.removeFromCart(item.id);
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
  
  // Apply first time buyer discount from backend
  if (this.isFirstTimeBuyerDiscount && this.firstTimeBuyerDiscountAmount > 0) {
    total = Math.max(0, total - this.firstTimeBuyerDiscountAmount);
  }
  
  return Math.round(total);
}

  goToCart() {
    this.router.navigate(['/cart']);
    this.closeSidebar.emit();
  }

  proceedToPayment() {
    this.router.navigate(['/checkout']);
    this.closeSidebar.emit();
  }

  onClose() {
    this.closeSidebar.emit();
  }

  goToProductDetail(productId: number): void {
    this.router.navigate(['/product', productId]);
  }

  getSubtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getTax(): number {
    // Example: 5% tax
    // return Math.round(this.getSubtotal() * 0.05);
    return 0; // Or implement your tax logic here
  }

  getTotalSavings(): number {
    let totalSavings = 0;
    
    // Product-specific discounts
    for (const item of this.cartItems) {
      const product = this.productDetails.get(item.productId || item.id);
      if (product && this.getProductDiscount(product.id)) {
        const originalPrice = product.price * item.quantity;
        const discountedPrice = this.getFinalDiscountedPrice(product) * item.quantity;
        totalSavings += originalPrice - discountedPrice;
      }
    }
    
    // First time buyer discount from backend
    if (this.isFirstTimeBuyerDiscount && this.firstTimeBuyerDiscountAmount > 0) {
      totalSavings += this.firstTimeBuyerDiscountAmount;
      
      console.log('First Time Buyer Discount Debug:', {
        isFirstTimeBuyerDiscount: this.isFirstTimeBuyerDiscount,
        firstTimeBuyerDiscountAmount: this.firstTimeBuyerDiscountAmount,
        totalSavings: totalSavings
      });
    }
    
    const roundedSavings = Math.round(totalSavings);
    console.log('Total Savings Calculation:', {
      totalSavings: totalSavings,
      roundedSavings: roundedSavings,
      isFirstTimeBuyerDiscount: this.isFirstTimeBuyerDiscount
    });
    
    return roundedSavings;
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
    const percent = this.getVipDiscountPercent(product);
    if (percent) {
      return `${userVipTier.charAt(0).toUpperCase() + userVipTier.slice(1)} Tier ${percent}% OFF`;
    }
    return '';
  }
} 