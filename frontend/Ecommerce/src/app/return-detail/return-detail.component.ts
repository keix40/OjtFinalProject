import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReturnService } from '../services/return.service';
import { OrderService } from '../services/order.service';
import { ReturnRequestById } from '../return';
import { RefundDTO } from '../refund';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-return-detail',
  templateUrl: './return-detail.component.html',
  styleUrls: ['./return-detail.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ReturnDetailComponent implements OnInit {
  returnDetail: ReturnRequestById | null = null;
  orderDetails: any = null;
  refundOrReplacement: 'refund' | 'replacement' = 'refund';
  adminRemark = '';
  selectedCard = '';
  refundAmount = 0;
  selectedImage: string | null = null;
  selectedImageIndex: number | null = null;
  @ViewChild('mediaPreviewModal') mediaPreviewModalTemplate: any;
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.selectedImageIndex !== null && this.mediaPreviewModalTemplate && this.isModalOpen) {
      if (event.key === 'ArrowLeft') {
        this.imageModalPrev();
      } else if (event.key === 'ArrowRight') {
        this.imageModalNext();
      }
    }
  }
  isModalOpen = false;

  constructor(
    private returnService: ReturnService,
    private orderService: OrderService,
    private route: ActivatedRoute,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.loadRequestDetail();
  }

  private getTotalAmountFromProducts(products: any[]): number {
    if (!products || products.length === 0) return 0;
    return products.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  }

  loadRequestDetail(){
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.returnService.getReturnById(+id).subscribe(data => {
        this.returnDetail = data;
        this.refundAmount = this.getTotalAmountFromProducts(data.products);
        this.selectedCard = data.cardNumber;
        this.adminRemark = data.adminRemark || '';
        // ✅ Chain: load order details after getting return
        this.loadOrderDetails();  // This ensures fresh status history
      });
    }
  }
  

  private loadOrderDetails() {
    if (this.returnDetail?.orderId) {
      this.orderService.getOrderById(this.returnDetail.orderId).subscribe({
        next: (order) => {
          this.orderDetails = order;
        },
        error: (error) => {
          console.error('Error loading order details:', error);
        }
      });
    }
  }  

  onApprove() {
    if (!this.returnDetail) return;
    this.returnService.approveRequest({
      returnRequestId: this.returnDetail.id,
      adminRemark: this.adminRemark
    }).subscribe(() => {
      // Update the status locally so the UI updates immediately
      this.returnDetail!.status = 'APPROVED';
      Swal.fire('Success', 'Return request approved!', 'success');
    });
  }

  onReject() {
    if (!this.returnDetail) return;

    this.returnService.rejectRequest({
      returnRequestId: this.returnDetail.id,
      adminRemark: this.adminRemark
    }).subscribe({
      next: () => {
        // After rejection, restore order status to before cancellation
        this.orderService.getOrderById(this.returnDetail!.orderId).subscribe({
          next: (order) => {
            const statusBeforeCancellation = this.findStatusBeforeCancellation(order);
            const targetStatus = statusBeforeCancellation || 'PENDING';
            this.orderService.updateOrderStatus(this.returnDetail!.orderId, targetStatus).subscribe({
              next: () => {
                Swal.fire('Success', `Return request rejected and order status restored to ${targetStatus}.`, 'success');
                this.loadRequestDetail();
              },
              error: (error) => {
                Swal.fire('Error', `Return request rejected but failed to update order status: ${error.error || error.message || 'Unknown error'}`, 'error');
              }
            });
          },
          error: (error) => {
            Swal.fire('Error', `Return request rejected but failed to fetch order details: ${error.error || error.message || 'Unknown error'}`, 'error');
          }
        });
      },
      error: (error) => {
        Swal.fire('Error', 'Failed to reject return request: ' + (error.error || error.message || 'Unknown error'), 'error');
      }
    });
  }

  onSendRefund() {
    if (!this.returnDetail) return;
    const refundDTO: RefundDTO = {
      returnRequestId: this.returnDetail.id,
      refundAmount: this.refundAmount,
      receiveCardId: this.returnDetail.cardId,
      adminRemark: this.adminRemark
    };

    this.returnService.processRefund(refundDTO).subscribe(() => {
      Swal.fire('Success', 'Refund sent successfully!', 'success');
      this.loadRequestDetail();
    });
  }

  onSendReplacement() {
    if (!this.returnDetail) return;

    const requestBody = {
      returnRequestId: this.returnDetail.id,
      adminRemark: this.adminRemark || ''
    };

    this.returnService.processReplacement(requestBody).subscribe({
      next: (response) => {
        Swal.fire('Success', 'Replacement processed and order status set to PENDING.', 'success');
        this.loadRequestDetail();
      },
      error: (error) => {
        Swal.fire('Error', 'Failed to process replacement: ' + (error.error || error.message || 'Unknown error'), 'error');
      }
    });
  }
  private findStatusBeforeCancellation(order: any): string | null {
    console.log('Finding status before cancellation for order:', order);
    
    if (!order.statusHistory || order.statusHistory.length === 0) {
      console.log('No status history found');
      return null;
    }

    console.log('Original status history:', order.statusHistory);

    // Sort status history by date (oldest first)
    const sortedHistory = [...order.statusHistory].sort(
      (a: any, b: any) => new Date(a.statusDate).getTime() - new Date(b.statusDate).getTime()
    );

    console.log('Sorted status history:', sortedHistory);

    // Find the status before CANCELLED
    for (let i = sortedHistory.length - 1; i >= 0; i--) {
      console.log(`Checking status at index ${i}:`, sortedHistory[i].status);
      if (sortedHistory[i].status === 'CANCELLED') {
        console.log('Found CANCELLED status at index:', i);
        // Return the status before CANCELLED
        if (i > 0) {
          const previousStatus = sortedHistory[i - 1].status;
          console.log('Status before CANCELLED:', previousStatus);
          return previousStatus;
        } else {
          console.log('CANCELLED is the first status, no previous status');
          break;
        }
      }
    }

    console.log('No CANCELLED status found or it\'s the first status');
    return null;
  }  

  onImageClick(img: string) {
    this.selectedImage = img;
  }

  closeImageModal() {
    this.selectedImageIndex = null;
  }

  get hasImages(): boolean {
    return !!this.returnDetail?.imageUrls?.length;
  }

  get previewImages(): string[] {
    return this.returnDetail?.imageUrls || [];
  }

  openImageModal(idx: number) {
    this.selectedImageIndex = idx;
  }

  openMediaPreviewModal(idx: number) {
    this.selectedImageIndex = idx;
    this.isModalOpen = true;
    const modalRef = this.modalService.open(this.mediaPreviewModalTemplate, {
      centered: true,
      backdrop: 'static',
      windowClass: 'p-0',
      scrollable: true
    });
    modalRef.result.finally(() => {
      this.isModalOpen = false;
    });
  }

  imageModalCanGoLeft(): boolean {
    return this.selectedImageIndex !== null && this.selectedImageIndex > 0;
  }

  imageModalCanGoRight(): boolean {
    return (
      this.selectedImageIndex !== null &&
      this.selectedImageIndex < this.previewImages.length - 1
    );
  }

  imageModalPrev() {
    if (this.imageModalCanGoLeft()) this.selectedImageIndex!--;
  }

  imageModalNext() {
    if (this.imageModalCanGoRight()) this.selectedImageIndex!++;
  }

  get hasRefund(): boolean {
    return !!(
      this.returnDetail &&
      this.returnDetail.refundAmount &&
      this.returnDetail.refundAmount > 0
    );
  }

  get showRefundSection(): boolean {
    return this.returnDetail?.status === 'APPROVED';
  }

  get statusBeforeCancellation(): string | null {
    if (!this.orderDetails || !this.orderDetails.statusHistory) {
      return null;
    }
    return this.findStatusBeforeCancellation(this.orderDetails);
  }

  getCurrentDateTime(): string {
    return new Date().toLocaleString();
  }

  // Test method to manually test order status update
  testOrderStatusUpdate() {
    if (!this.returnDetail) {
      console.error('No return detail available for testing');
      return;
    }

    console.log('Testing order status update for order ID:', this.returnDetail.orderId);
    
    // Test with a simple status update
    this.orderService.updateOrderStatus(this.returnDetail.orderId, 'PENDING').subscribe({
      next: (response) => {
        console.log('Test order status update successful:', response);
        Swal.fire('Success', 'Test order status update successful!', 'success');
        this.loadRequestDetail(); // Reload to see changes
      },
      error: (error) => {
        console.error('Test order status update failed:', error);
        Swal.fire('Error', `Test failed: ${error.error || error.message || 'Unknown error'}`, 'error');
      }
    });
  }
}