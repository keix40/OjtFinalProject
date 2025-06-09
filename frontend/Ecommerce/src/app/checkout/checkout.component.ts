import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../services/cart.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-checkout',
  standalone: false,
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit, OnDestroy {
  activeStep = 1;
  orderNumber = '';

  // Track completed steps
  stepCompleted: { [key: number]: boolean } = {};

  // Cart items
  cartItems: CartItem[] = [];
  private subscriptions: Subscription[] = [];

  // Customer info
  customer = {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  };

  // Shipping info
  shipping = {
    address: '',
    city: '',
    state: '',
    postal: '',
    country: '',
    phone: ''
  };

  // Delivery options
  delivery = {
    method: ''
  };
  deliveryOptions = [
    { name: 'Standard DDP', cost: 4.49, estimated: '5-15 days' },
    { name: 'Express DDP', cost: 6.49, estimated: '2-6 days' },
    { name: 'Standard DDU', cost: 5.49, estimated: '5-15 days' }
  ];

  // Payment info
  payment = {
    method: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    paypalEmail: ''
  };

  constructor(private router: Router, private cartService: CartService) {}

  ngOnInit() {
    this.subscriptions.push(
      this.cartService.getCartItems().subscribe(items => {
        this.cartItems = items;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Step navigation
  setActiveStep(step: number) {
    if (step === 1 || this.stepCompleted[step - 1]) {
      this.activeStep = step;
    }
  }

  nextStep(form?: any) {
    if (form && !form.valid) return;
    this.stepCompleted[this.activeStep] = true;
    if (this.activeStep < 5) {
      this.activeStep++;
    }
    if (this.activeStep === 5) {
      this.orderNumber = Math.floor(100000 + Math.random() * 900000).toString();
    }
  }

  editStep(event: Event, step: number) {
    event.stopPropagation();
    this.activeStep = step;
  }

  resetCheckout() {
    this.activeStep = 1;
    this.stepCompleted = {};
    this.customer = { firstName: '', lastName: '', email: '', phone: '' };
    this.shipping = { address: '', city: '', state: '', postal: '', country: '', phone: '' };
    this.delivery = { method: '' };
    this.payment = { method: '', cardNumber: '', expiry: '', cvv: '', paypalEmail: '' };
    this.orderNumber = '';
  }

  // Cart summary helpers
  getSubtotal() {
    return this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
  getTotal() {
    // Example: subtotal + delivery cost (if selected)
    const deliveryCost = this.deliveryOptions.find(opt => opt.name === this.delivery.method)?.cost || 0;
    return this.getSubtotal() + deliveryCost;
  }
  // Quantity controls for cart review (if needed)
  decrementQty(item: any) {
    if (item.quantity > 1) item.quantity--;
  }
  incrementQty(item: any) {
    item.quantity++;
  }
  removeItem(index: number) {
    this.cartItems.splice(index, 1);
  }

  goToPayment(form: any) {
    if (!form.valid) return;
    this.stepCompleted[3] = true;
    this.router.navigate(['/checkout/payment'], {
      state: {
        customer: this.customer,
        shipping: this.shipping,
        delivery: this.delivery,
        cartItems: this.cartItems
      }
    });
  }
}
