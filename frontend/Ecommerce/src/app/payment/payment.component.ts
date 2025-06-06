import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment',
  standalone: false,
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent implements OnInit {
  customer: any;
  shipping: any;
  delivery: any;
  cartItems: any[] = [];
  paymentMethod: string = '';
  orderNumber: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    const nav = window.history.state;
    this.customer = nav.customer;
    this.shipping = nav.shipping;
    this.delivery = nav.delivery;
    this.cartItems = nav.cartItems;
    // Generate order number if not present
    this.orderNumber = nav.orderNumber || (Math.floor(100000 + Math.random() * 900000).toString());
  }

  getSubtotal() {
    return this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
  getDeliveryCost() {
    if (!this.delivery || !this.delivery.method) return 0;
    if (this.delivery.method.includes('Express DDP')) return 6.49;
    if (this.delivery.method.includes('Standard DDP')) return 4.49;
    if (this.delivery.method.includes('Standard DDU')) return 5.49;
    if (this.delivery.method.includes('Express DDU')) return 10.49;
    return 0;
  }
  getTotal() {
    return this.getSubtotal() + this.getDeliveryCost() - 100; // Example discount
  }

  submitOrder() {
    if (!this.paymentMethod) return;
    this.router.navigate(['/checkout/confirm'], {
      state: {
        customer: this.customer,
        shipping: this.shipping,
        delivery: this.delivery,
        cartItems: this.cartItems,
        paymentMethod: this.paymentMethod,
        orderNumber: this.orderNumber
      }
    });
  }
}
