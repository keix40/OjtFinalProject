import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../services/cart.service';
import { OrderService } from '../services/order.service';
import { UserOrder } from '../user-order';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OrderConfirmComponent } from '../order-confirm/order-confirm.component';
import { DiscountService } from '../services/discount.service';
import { ProductService } from '../services/product.service';
import { ProductDTO } from '../product';

@Component({
  selector: 'app-payment',
  standalone: false,
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent implements OnInit, OnDestroy {
  customer: any;
  shipping: any;
  delivery: any;
  cartItems: CartItem[] = [];
  paymentMethod: string = 'card';
  orderNumber: string = '';
  
  // Additional data from checkout
  userId: number | null = null;
  addressId: number | null = null;
  deliveryMethodId: number | null = null;
  discountId: number | null = null;
  discount: any = null;
  discountAmount: number = 0;
  deliveryFee: number = 0;
  
  orderPreview: any = null;
  isFirstTimeBuyerDiscount = false;
  
  // Loading state
  isSubmitting: boolean = false;
  
  // Card form
  cardForm: FormGroup;
  
  activeDiscounts: any[] = [];
  productDiscounts: Map<number, any> = new Map();
  productDetails: Map<number, ProductDTO> = new Map();
  productDiscountAmount: number = 0;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router, 
    private cartService: CartService,
    private orderService: OrderService,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private discountService: DiscountService,
    private productService: ProductService
  ) {
    this.cardForm = this.fb.group({
      cardNumber: ['', [Validators.required, Validators.minLength(19), Validators.maxLength(19)]],
      cardholderName: ['', [Validators.required, Validators.minLength(3)]],
      expiryDate: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\s\/\s\d{2}$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]]
    });
  }

  ngOnInit() {
    const nav = window.history.state;
    this.customer = nav.customer;
    this.shipping = nav.shipping;
    this.delivery = nav.delivery;
    
    this.userId = nav.userId;
    this.addressId = nav.addressId;
    this.deliveryMethodId = nav.deliveryMethodId;
    this.discountId = nav.discountId;
    this.discount = nav.discount;
    this.discountAmount = nav.discountAmount || 0;
    this.deliveryFee = nav.deliveryFee || 0;
    this.paymentMethod = 'card';
    this.orderPreview = nav.orderPreview || null;
    if (this.orderPreview && this.orderPreview.discountAmount) {
      this.discountAmount = this.orderPreview.discountAmount;
    } else {
      this.discountAmount = nav.discountAmount || 0;
    }
    this.productDiscountAmount = nav.productDiscountAmount || 0;
    
    // Debug logging
    console.log('Payment Component - Received data from checkout:', {
      userId: this.userId,
      addressId: this.addressId,
      deliveryMethodId: this.deliveryMethodId,
      discountId: this.discountId,
      discount: this.discount,
      discountAmount: this.discountAmount,
      deliveryFee: this.deliveryFee
    });
    
    this.subscriptions.push(
      this.cartService.getCartItems().subscribe(items => {
        this.cartItems = items;
        this.loadProductDetails();
      })
    );
    this,this.loadActiveDiscounts();
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

  getTotalDiscount() {
    // If first time buyer discount is active, only use that
    if (this.isFirstTimeBuyerDiscount && this.orderPreview?.discountAmount > 0) {
      return this.orderPreview.discountAmount;
    }
    if (this.productDiscountAmount) return this.productDiscountAmount;
    let discount = 0;
    for (const item of this.cartItems) {
      const product = this.productDetails.get(item.productId || item.id);
      if (product) {
        const discounted = this.getDiscountedPrice(product);
        if (discounted < product.price) {
          discount += (product.price - discounted) * item.quantity;
        }
      }
    }
    return discount;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

   getSubtotal() {
    // Always return the sum of original prices
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
  
  getDeliveryCost() {
    return this.deliveryFee;
  }
  
  getTotal() {
    // Always use subtotal - discount + shipping
    return this.getSubtotal() - this.getTotalDiscount() + this.deliveryFee;
  }

  submitOrder() {
    if (this.isSubmitting) return; // Prevent multiple submissions
    
    // Validate card form
    if (!this.cardForm.valid) {
      this.markFormGroupTouched();
      alert('Please fill in all card information correctly.');
      return;
    }
    
    // Validate required data
    if (!this.userId || !this.addressId || !this.deliveryMethodId) {
      alert('Missing required order information. Please go back and complete the checkout process.');
      return;
    }
    
    this.isSubmitting = true;
    
    // Create UserOrder object
    const userOrder: UserOrder = {
      userId: this.userId,
      addressId: this.addressId,
      discountId: this.discountId || null,
      deliveryId: this.deliveryMethodId,
      totalAmount: this.getTotal(),
      cartItem: this.cartItems.map(item => ({
        productId: item.productId ?? item.id, // fallback if productId is missing
        quantity: item.quantity,
        price: item.price,
        variantId: item.variantId ?? null    // <== FIX HERE
      }))
    };
    
    console.log('Creating order with data:', userOrder);
    
    // Call the order service to create the order
    this.orderService.createOrder(userOrder).subscribe({
      next: (response: any) => {
        console.log('Order created successfully:', response);
        this.isSubmitting = false;
        
        const responseData = typeof response === 'object' && response !== null ? response : {};
        const orderDetails = {
          ...responseData,
          customer: this.customer,
          shipping: this.shipping,
          delivery: this.delivery,
          cartItems: this.cartItems,
          paymentMethod: this.paymentMethod,
          orderNumber: responseData.orderCode,
          subtotal: this.getSubtotal(),
          deliveryFee: this.deliveryFee,
          discountAmount: this.getTotalDiscount(),
          cardInfo: this.cardForm.value,
          discount: this.discount
        };

        this.openConfirmationModal(orderDetails);
      },
      error: (error) => {
        console.error('Error creating order:', error);
        this.isSubmitting = false;
      }
    });
  }

  openConfirmationModal(orderDetails: any) {
    const modalRef = this.modalService.open(OrderConfirmComponent, { centered: true });
    modalRef.componentInstance.orderDetails = orderDetails;
  }

  // Helper method to mark all form controls as touched
  private markFormGroupTouched() {
    Object.keys(this.cardForm.controls).forEach(key => {
      const control = this.cardForm.get(key);
      control?.markAsTouched();
    });
  }

  // Method to format card number with spaces
  formatCardNumber(event: any) {
    let value = event.target.value.replace(/\s/g, '');
    value = value.replace(/\D/g, '');
    value = value.replace(/(\d{4})/g, '$1 ').trim();
    event.target.value = value.substring(0, 19);
  }

  // Method to format expiry date
  formatExpiryDate(event: any) {
    let value = event.target.value.replace(/\s\/\s/g, '').replace('/', '');
    value = value.replace(/\D/g, '');

    if (value.length > 2) {
      value = value.slice(0, 2) + ' / ' + value.slice(2, 4);
    }
    
    event.target.value = value.substring(0, 7);
  }

  // Method to format CVV
  formatCVV(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.substring(0, 4);
    event.target.value = value;
  }

  // Method to handle payment method change
  onPaymentMethodChange() {
    if (this.paymentMethod !== 'card') {
      this.cardForm.reset();
    }
  }
}
