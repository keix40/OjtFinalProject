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
  activeDiscounts: any[] = [];
  productDiscounts: Map<number, any> = new Map();
  productDetails: Map<number, ProductDTO> = new Map();

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
      },
      error: () => {
        this.isFirstTimeBuyerDiscount = false;
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  decrementQty(item: CartItem) {
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item.id, item.quantity - 1);
    }
  }

  incrementQty(item: CartItem) {
    this.cartService.updateQuantity(item.id, item.quantity + 1);
  }

  removeItem(item: CartItem) {
    this.cartService.removeFromCart(item.id);
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
} 