import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
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

  constructor(public activeModal: NgbActiveModal) {}

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
}
