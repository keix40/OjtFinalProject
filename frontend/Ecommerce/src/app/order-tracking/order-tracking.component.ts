import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../services/order.service';

@Component({
  selector: 'app-order-tracking',
  standalone: false,
  templateUrl: './order-tracking.component.html',
  styleUrl: './order-tracking.component.css'
})
export class OrderTrackingComponent {
  order: any;
  isLoading = true;
  error: string | null = null;
  statusSteps = ['Order Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
  orderCode: string = '';

  constructor(private route: ActivatedRoute, private orderService: OrderService) {}

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('orderId');
    if (orderId) {
      this.orderService.getOrderById(+orderId).subscribe({
        next: (order) => {
          this.order = order;  // order now has the typed DTO structure
          this.isLoading = false;
        },
        error: () => {
          this.error = 'Order not found.';
          this.isLoading = false;
        }
      });
    }
  }

  getCurrentStep(): number {
    // Map your order.status to the step index
    const statusMap: any = {
      'PENDING': 0,
      'PROCESSING': 1,
      'SHIPPED': 2,
      'OUT_FOR_DELIVERY': 3,
      'DELIVERED': 4
    };
    return statusMap[this.order?.status?.toUpperCase()] ?? 0;
  }

  trackOrder() {
    // Stub: You can implement order tracking logic here
    console.log('Track order for code:', this.orderCode);
  }
}
  