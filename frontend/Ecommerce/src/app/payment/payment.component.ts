import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../services/cart.service';
import { OrderService } from '../services/order.service';
import { UserOrder } from '../user-order';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OrderConfirmComponent } from '../order-confirm/order-confirm.component';
import { ImageService } from '../services/image.service';

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
    private modalService: NgbModal,
    public imageService: ImageService
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
      console.error('Missing required data:', {
        userId: this.userId,
        addressId: this.addressId,
        deliveryMethodId: this.deliveryMethodId
      });
      alert('Missing required order information. Please go back and complete the checkout process.');
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
    const userOrder: UserOrder = {
      userId: this.userId,
      addressId: this.addressId,
      discountId: this.discountId || null,
      deliveryId: this.deliveryMethodId,
      totalAmount: this.getTotal(),
      cartItem: this.cartItems.map(item => {
        const cartItem = {
          productId: item.productId || item.id, // Ensure productId is available
          quantity: item.quantity,
          price: item.price,
          variantId: item.variantId || null
        };
        console.log('Cart item being sent:', cartItem);
        return cartItem;
      })
    };
    
    console.log('Final UserOrder object being sent:', userOrder);
    
    // Call the order service to create the order
    this.orderService.createOrder(userOrder).subscribe({
      next: (response: any) => {
        console.log('Order created successfully:', response);
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
          orderNumber: orderData.orderCode || orderData.orderId || 'ORDER-' + Date.now(),
          deliveryFee: this.deliveryFee,
          discountAmount: this.discountAmount,
          cardInfo: this.cardForm.value,
          discount: this.discount
        };

        this.openConfirmationModal(orderDetails);
      },
      error: (error) => {
        console.error('Error creating order:', error);
        console.error('Error details:', {
          status: error.status,
          message: error.message,
          error: error.error,
          url: error.url
        });
        this.isSubmitting = false;
        
        // Show user-friendly error message
        let errorMessage = 'Failed to create order. Please try again.';
        if (error.status === 400) {
          errorMessage = 'Invalid order data. Please check your information.';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        alert(errorMessage);
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
