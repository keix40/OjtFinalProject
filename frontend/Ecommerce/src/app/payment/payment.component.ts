import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../services/cart.service';
import { OrderService } from '../services/order.service';
import { UserOrder } from '../user-order';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OrderConfirmComponent } from '../order-confirm/order-confirm.component';

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
  
  // Loading state
  isSubmitting: boolean = false;
  
  // Card form
  cardForm: FormGroup;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router, 
    private cartService: CartService,
    private orderService: OrderService,
    private fb: FormBuilder,
    private modalService: NgbModal
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
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getSubtotal() {
    return this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
  
  getDeliveryCost() {
    return this.deliveryFee;
  }
  
  getTotal() {
    return this.getSubtotal() + this.getDeliveryCost() - this.discountAmount;
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
          deliveryFee: this.deliveryFee,
          discountAmount: this.discountAmount,
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
