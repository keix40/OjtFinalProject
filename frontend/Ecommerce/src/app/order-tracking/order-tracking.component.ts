import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../services/order.service';
import { ModalService } from '../services/modal.service';
import { ReturnService } from '../services/return.service';
import { AuthService } from '../auth/auth.service';

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
  statusSteps = ['Order Placed', 'Processing', 'Shipped', 'Delivered'];
  showAllStatus: boolean = false;
  stopStatuses = ['CANCELLED', 'RETURNED'];
  orderStatusAtCancelRequest: string | null = null;

  // Return Policy Modal
  showPolicyModal: boolean = false;
  returnPolicyText: string = `Customers are eligible to request returns under the following conditions. All return requests must be reviewed and approved by the admin before any refund or replacement is processed.\n\n1. Wrong Item Delivered\nIf the item received is different from what was ordered, a return request must be submitted within 7 days of delivery.\n\nUpon verification, a full refund will be issued.\n\n2. Damaged on Arrival\nIf the item is received in a damaged or defective condition, photo evidence must be provided.\n\nAfter verification by the admin, customers will be offered either a refund or a replacement.\n\n3. Changed Mind\nReturns due to a change of mind are accepted only if the product is unused and sealed.\n\nThe customer is responsible for the return shipping costs.\n\nA refund will be processed after the returned product is inspected and approved.`;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private modalService: ModalService,
    private returnService: ReturnService
  ) {}

  ngOnInit(): void {
    this.loadOrderTracking();
  }

  loadOrderTracking() {
    const orderId = this.route.snapshot.paramMap.get('orderId');
    if (orderId) {
      this.orderService.getOrderById(+orderId).subscribe({
        next: (order) => {
          // Sort statusHistory ascending (oldest first)
          order.statusHistory = order.statusHistory?.sort(
            (a: any, b: any) => new Date(a.statusDate).getTime() - new Date(b.statusDate).getTime()
          );
          this.order = order;
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
    const statusMap: any = {
      'PENDING': 0,
      'PROCESSING': 1,
      'SHIPPED': 2,
      'OUT_FOR_DELIVERY': 3,
      'DELIVERED': 4
    };

    if (!this.order?.statusHistory?.length) return 0;
    const latest = [...this.order.statusHistory]
      .sort((a, b) => new Date(b.statusDate).getTime() - new Date(a.statusDate).getTime())[0];
    return statusMap[latest.status?.toUpperCase()] ?? 0;
  }

  toggleShowAllStatus() {
    this.showAllStatus = !this.showAllStatus;
  }
  

  getDeliveredDate(): Date | null {
    const delivered = this.order?.statusHistory?.find(
      (s: any) => s.status.toUpperCase() === 'DELIVERED'
    );
    return delivered ? new Date(delivered.statusDate) : null;
  }

  getLastNonCancelledStatus(): string {
    if (!this.order?.statusHistory?.length) return 'UNKNOWN';
  
    const stopStatuses = ['CANCELLED', 'RETURNED'];
  
    const nonStopStatus = [...this.order.statusHistory]
      .filter(s => !stopStatuses.includes(s.status?.toUpperCase()))
      .sort((a, b) => new Date(b.statusDate).getTime() - new Date(a.statusDate).getTime());
  
    return nonStopStatus.length > 0
      ? String(nonStopStatus[0].status)
      : 'UNKNOWN';
  }  

  goToReturnRequest() {
    this.showPolicyModal = true;
  }

  onAgreePolicy() {
    this.showPolicyModal = false;
    const lastStatus = this.getLastNonCancelledStatus();
    this.orderStatusAtCancelRequest = lastStatus;
    const orderId = Number(this.route.snapshot.paramMap.get('orderId'));
    if (orderId) {
      this.modalService.openReturnRequestModal(orderId, lastStatus).then((result) => {
        if (result === 'success') {
          this.loadOrderTracking();
        }
      });
    }
  }

  onClosePolicyModal() {
    this.showPolicyModal = false;
  }

  cancelReturnRequest(returnRequestId: number) {
    if (!this.order || !this.order.orderId) {
      console.error('Order not loaded or missing ID.');
      return;
    }
  
    this.modalService.showConfirmation(
      'Cancel Return Request',
      'Are you sure you want to cancel this return request?'
    ).then((confirmed: boolean) => {
      if (confirmed) {
        this.returnService.cancelReturnRequest(returnRequestId).subscribe({
          next: () => {
            this.loadOrderTracking();
            this.orderService.updateOrderStatus(this.order.orderId, this.getLastNonCancelledStatus()).subscribe({
              next: () => {
                this.loadOrderTracking();
              },
              error: (err: any) => {
                console.error('Failed to update order status:', err);
              }
            });
  
            const request = this.order.returnRequests.find((r: any) => r.id === returnRequestId);
            if (request) {
              request.status = 'CANCELLED';
              request.cancelledAt = new Date().toISOString();
            }
          },
          error: (err: any) => {
            console.error('Failed to cancel return request:', err);
          }
        });
      }
    });
  }

  isReturned(): boolean {
    return this.order?.status === 'RETURNED' ||
           this.order?.statusHistory?.some((s: any) => s.status.toUpperCase() === 'RETURNED');
  }

  formatReason(reason: string): string {
    return reason ? reason.replace(/_/g, ' ') : '';
  }

  isStopStatus(status: string): boolean {
    return this.stopStatuses.includes(status?.toUpperCase());
  }

  isSameStatusDate(statusDate: string, requestedAt: string): boolean {
    if (!statusDate || !requestedAt) return false;
    const d1 = new Date(statusDate);
    const d2 = new Date(requestedAt);
    return Math.abs(d1.getTime() - d2.getTime()) < 10 * 60 * 1000; // 10 minutes
  }
  
  shouldShowCancelOrder(): boolean {
    if (!this.order) return false;
    // Only show if order is delivered and within 7 days
    if (this.order.status !== 'DELIVERED') return false;
    const deliveredDate = this.getDeliveredDate();
    if (!deliveredDate) return false;
    const now = new Date();
    const diffDays = (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 7) return false;
    return true;
  }
}
  