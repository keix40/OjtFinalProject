import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CartService } from '../services/cart.service';
import { ImageService } from '../services/image.service';

@Component({
  selector: 'app-order-confirm',
  standalone: false,
  templateUrl: './order-confirm.component.html',
  styleUrls: ['./order-confirm.component.css']
})
export class OrderConfirmComponent implements OnInit {
  @Input() orderDetails: any;

  constructor(
    public activeModal: NgbActiveModal,
    private router: Router,
    private cartService: CartService,
    public imageService: ImageService
  ) {}

  ngOnInit() {
    if (this.orderDetails) {
      this.cartService.clearCart();
    }
  }

  getSubtotal() {
    if (typeof this.orderDetails.subtotal === 'number') {
      return this.orderDetails.subtotal;
    }
    if (this.orderDetails.cartItems) {
      return this.orderDetails.cartItems.reduce((sum: any, item: any) => sum + item.price * item.quantity, 0);
    }
    return 0;
  }

  getDeliveryCost() {
    if (typeof this.orderDetails.deliveryFee === 'number') {
      return this.orderDetails.deliveryFee;
    }
    return 0;
  }
  
  getTotal() {
    const discount = typeof this.orderDetails.discountAmount === 'number' ? this.orderDetails.discountAmount : 0;
    return this.getSubtotal() + this.getDeliveryCost() - discount;
  }

  closeAndNavigate() {
    this.activeModal.close();
    this.router.navigate(['/userproductlist']);
  }
}
