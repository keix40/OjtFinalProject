import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PriceFormatService } from '../services/price-format.service';
// import { OrderService } from '../services/order.service'; // Uncomment if you want to fetch from service

@Component({
  selector: 'app-order-invoice',
  standalone: false,
  templateUrl: './order-invoice.component.html',
  styleUrl: './order-invoice.component.css'
})
export class OrderInvoiceComponent implements OnInit {
  @Input() order: any; // Accepts order object directly for modal use

  // constructor(private orderService: OrderService) {}

  constructor(
    public activeModal: NgbActiveModal,
    private priceFormatService: PriceFormatService
  ) {}

  ngOnInit(): void {
    // If you want to fetch by ID, do it here
    // if (this.orderId) {
    //   this.orderService.getOrderById(this.orderId).subscribe(order => this.order = order);
    // }
  }

  printInvoice() {
    window.print();
  }

  closeModal() {
    this.activeModal.dismiss();
  }

  // Calculate total discount amount as sum of (originalPrice - unitPrice) * quantity for all products
  get calculatedDiscountAmount(): number {
    if (!this.order?.products) return 0;
    const discount = this.order.products.reduce((sum: number, p: any) => {
      if (p.originalPrice && p.originalPrice > p.unitPrice) {
        return sum + (p.originalPrice - p.unitPrice) * p.quantity;
      }
      return sum;
    }, 0);
    return Math.round(discount);
  }

  // Price formatting methods
  formatPrice(price: number, currency: string = 'MMK'): string {
    return this.priceFormatService.formatPrice(price, currency);
  }

  formatPriceOnly(price: number): string {
    return this.priceFormatService.formatPriceOnly(price);
  }

  formatDiscountedPrice(originalPrice: number, discountValue: number, discountType: string, currency: string = 'MMK'): string {
    return this.priceFormatService.formatDiscountedPrice(originalPrice, discountValue, discountType, currency);
  }

  formatDiscountText(discountValue: number, discountType: string): string {
    return this.priceFormatService.formatDiscountText(discountValue, discountType);
  }
}
