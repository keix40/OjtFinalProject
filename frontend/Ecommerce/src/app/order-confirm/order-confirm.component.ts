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
    return this.orderDetails.cartItems.reduce((sum: any, item: any) => sum + item.price * item.quantity, 0);
  }

  getDeliveryCost() {
    return this.orderDetails.deliveryFee || 0;
  }
  
  getTotal() {
    const discount = this.orderDetails.discountAmount || 0;
    return this.getSubtotal() + this.getDeliveryCost() - discount;
  }

  closeAndNavigate() {
    this.activeModal.close();
    this.router.navigate(['/home']);
  }
}
