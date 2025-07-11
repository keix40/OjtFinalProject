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
import { ImageService } from '../services/image.service';
import { CardService } from '../services/card.service';

interface Card {
  id: number;
  cardholderName: string;
  cardBrand: string;
  expiryDate: string;
  isDefault: boolean;
  cardNumber: string;
}

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

  cardForm: FormGroup;
  
  activeDiscounts: any[] = [];
  productDiscounts: Map<number, any> = new Map();
  productDetails: Map<number, ProductDTO> = new Map();
  productDiscountAmount: number = 0;
  
  private subscriptions: Subscription[] = [];

  savedCards: Card[] = [];
  selectedSavedCardId: string | null = null;
  useNewCard: boolean = false;

  constructor(
    private router: Router,
    private cartService: CartService,
    private orderService: OrderService,
    private cardService: CardService,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private discountService: DiscountService,
    private productService: ProductService,
    public imageService: ImageService
  ) {
    this.cardForm = this.fb.group({
      cardNumber: ['', [
        Validators.required,
        Validators.pattern(/^(\d{4} ){2,3}\d{3,4}$/)
      ]],
      cardholderName: ['', Validators.required],
      expiryDate: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2]) \/ \d{2}$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      cardBrand: ['', Validators.required]
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

  if (this.userId != null) {
    this.loadSavedCards();
  } else {
    this.useNewCard = true;
  }

  this.subscriptions.push(
    this.cartService.getCartItems().subscribe(items => {
      setTimeout(() => {
        this.cartItems = items;
      });
    })
  );

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
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    if (this.useNewCard) {
      if (this.cardForm.invalid) {
        this.cardForm.markAllAsTouched();
        this.isSubmitting = false;
        return;
      }
    } else {
      if (!this.selectedSavedCardId) {
        alert('Please select a saved card to proceed.');
        this.isSubmitting = false;
        return;
      }
    }

    if (!this.userId || !this.addressId || !this.deliveryMethodId) {
      console.error('Missing required data:', {
        userId: this.userId,
        addressId: this.addressId,
        deliveryMethodId: this.deliveryMethodId
      });
      alert('Missing required order information.');
      this.isSubmitting = false;
      return;
    }
    
    // Validate cart items
    if (!this.cartItems || this.cartItems.length === 0) {
      console.error('No cart items found');
      alert('No items in cart. Please add items before proceeding.');
      return;
    }
    
    this.isSubmitting = true;
    
    // Log all received data for debugging
    console.log('=== PAYMENT DEBUG DATA ===');
    console.log('Customer:', this.customer);
    console.log('Shipping:', this.shipping);
    console.log('Delivery:', this.delivery);
    console.log('Cart Items:', this.cartItems);
    console.log('User ID:', this.userId);
    console.log('Address ID:', this.addressId);
    console.log('Delivery Method ID:', this.deliveryMethodId);
    console.log('Discount ID:', this.discountId);
    console.log('Discount:', this.discount);
    console.log('Discount Amount:', this.discountAmount);
    console.log('Delivery Fee:', this.deliveryFee);
    console.log('Total Amount:', this.getTotal());
    console.log('========================');
    
    // Create UserOrder object with proper data structure

    if (this.useNewCard) {
      const newCard = {
        userId: this.userId,
        cardholderName: this.cardForm.value.cardholderName,
        cardNumber: this.cardForm.value.cardNumber.replace(/\s/g, ''),
        expiryDate: this.cardForm.value.expiryDate,
        cardBrand: this.cardForm.value.cardBrand,
        isDefault: true
      };

      this.cardService.saveCard(newCard).subscribe({
        next: (response: any) => {
          const savedCardId = response?.id;
          if (savedCardId) {
            this.placeOrderWithCardId(savedCardId);
          } else {
            alert('Card saved but no ID returned.');
            this.isSubmitting = false;
          }
        },
        error: (err) => {
          console.error('Failed to save card:', err);
          this.isSubmitting = false;
          alert('Failed to save card.');
        }
      });
    } else {
      const selectedCard = this.getSelectedSavedCard();
      if (!selectedCard) {
        alert('Selected card not found.');
        this.isSubmitting = false;
        return;
      }
      this.placeOrderWithCardId(Number(selectedCard.id));
    }
  }

  placeOrderWithCardId(cardId?: number) {
    const userOrder: UserOrder = {
      userId: this.userId!,
      addressId: this.addressId!,
      discountId: this.discountId || null,
      deliveryId: this.deliveryMethodId!,
      totalAmount: this.getTotal(),
      cartItem: this.cartItems.map(item => ({
        productId: item.productId ?? item.id,
        quantity: item.quantity,
        price: item.price,
        variantId: item.variantId ?? null
      })),
      cardId
    };

    this.orderService.createOrder(userOrder).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        // Handle text response from backend
        let orderData;
        if (typeof response === 'string') {
          // Backend returns "success" as plain text
          orderData = { 
            orderCode: 'ORDER-' + Date.now(), // Generate a temporary order code
            status: response 
          };
        } else {
          orderData = response;
        }
        
        const orderDetails = {
          ...orderData,
          customer: this.customer,
          shipping: this.shipping,
          delivery: this.delivery,
          cartItems: this.cartItems,
          paymentMethod: this.paymentMethod,
          subtotal: this.getSubtotal(),
          discountAmount: this.getTotalDiscount(),
          orderNumber: orderData.orderCode || orderData.orderId || 'ORDER-' + Date.now(),
          deliveryFee: this.deliveryFee,
          cardInfo: this.useNewCard
            ? {
                ...this.cardForm.value,
                cardNumber: this.maskCardNumber(this.cardForm.value.cardNumber)
              }
            : this.getSelectedSavedCard(),
          discount: this.discount
        };
        this.openConfirmationModal(orderDetails);
      },
      error: (error) => {
        console.error('Error placing order:', error);
        this.isSubmitting = false;
        alert('Failed to place order. Please try again.');
      }
    });
  }

  openConfirmationModal(orderDetails: any) {
    const modalRef = this.modalService.open(OrderConfirmComponent, { centered: true });
    modalRef.componentInstance.orderDetails = orderDetails;
  }

  onCardNumberInput(event: any) {
    this.formatCardNumber(event);
    const brand = this.detectCardBrand(event.target.value);
    if (brand !== 'UNKNOWN') {
      this.cardForm.get('cardBrand')?.setValue(brand, { emitEvent: false });
    }
  }

  formatCardNumber(event: any) {
    let value = event.target.value.replace(/\s/g, '');
    value = value.replace(/\D/g, '');
    value = value.replace(/(\d{4})/g, '$1 ').trim();
    event.target.value = value.substring(0, 19);
  }

  formatExpiryDate(event: any) {
    let value = event.target.value.replace(/\s\/\s/g, '').replace('/', '');
    value = value.replace(/\D/g, '');

    if (value.length > 2) {
      value = value.slice(0, 2) + ' / ' + value.slice(2, 4);
    }

    event.target.value = value.substring(0, 7);
  }

  formatCVV(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.substring(0, 4);
    event.target.value = value;
  }

  onPaymentMethodChange() {
    if (this.paymentMethod !== 'card') {
      this.cardForm.reset();
    }
  }

  loadSavedCards() {
    if (this.userId == null) return;
    this.cardService.getCardsByUserId(this.userId).subscribe(cards => {
      this.savedCards = cards.map(card => ({
        id: Number(card.id),
        cardholderName: card.cardholderName,
        cardBrand: card.cardBrand,
        cardNumber: card.cardNumber,
        expiryDate: card.expiryDate,
        isDefault: card.isDefault
      }));
      this.selectedSavedCardId = cards.length > 0 && cards[0]?.id != null
      ? cards[0].id.toString()
      : '';
          this.useNewCard = cards.length === 0;
    });
  }

  getSelectedSavedCard() {
    if (!this.selectedSavedCardId) return undefined;
    const selected = this.savedCards.find(card => card.id === +(this.selectedSavedCardId ?? 0));
    console.log("Selected saved card:", selected);
    return selected;
  }
  

  detectCardBrand(cardNumber: string): string {
    const noSpaces = cardNumber.replace(/\s/g, '');
    if (/^4/.test(noSpaces)) return 'VISA';
    if (/^5[1-5]/.test(noSpaces)) return 'MASTERCARD';
    if (/^3[47]/.test(noSpaces)) return 'AMEX';
    return 'UNKNOWN';
  }

  toggleUseNewCard(useNew: boolean) {
    this.useNewCard = useNew;
    if (!useNew && this.savedCards.length > 0) {
      this.selectedSavedCardId = this.savedCards[0].id.toString();
    }
  }

  maskCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, '');
    const length = cleaned.length;
    if (length <= 4) return cleaned;
    const maskedSection = '*'.repeat(length - 4);
    const visibleSection = cleaned.slice(-4);
    const fullMasked = maskedSection + visibleSection;
    return fullMasked.match(/.{1,4}/g)?.join(' ') ?? fullMasked;
  }
}
