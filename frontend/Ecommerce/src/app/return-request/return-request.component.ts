import { Component, Input, OnInit } from '@angular/core';
import { OrderService } from '../services/order.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserOrderListDTO, OrderProductDTO } from '../user-order';
import { ReturnService } from '../services/return.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-return-request',
  standalone: false,
  templateUrl: './return-request.component.html',
  styleUrl: './return-request.component.css'
})
export class ReturnRequestComponent implements OnInit {
  @Input() orderId?: number;
  @Input() orderStatusAtCancelRequest?: string;
  orderCode: string = '';
  products: OrderProductDTO[] = [];
  selectedProduct: OrderProductDTO | null = null;
  reason: string = '';
  details: string = '';
  files: File[] = [];
  previewUrls: string[] | undefined ;

  constructor(
    private orderService: OrderService,
    public activeModal: NgbActiveModal,
    private returnService : ReturnService
  ) {}

  ngOnInit() {
    this.loadOrderDetails();
  }

  loadOrderDetails() {
    if (this.orderId) {
      this.orderService.getOrderById(this.orderId).subscribe({
        next: (order: UserOrderListDTO) => {
          this.orderCode = order.orderCode;
          this.products = order.products;
        },
        error: (err) => {
          console.error('Failed to load order details:', err);
        }
      });
    }
  }

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.files = Array.from(event.target.files);
      this.previewUrls = this.files.map(file => URL.createObjectURL(file));
    }
  }  

  getImagePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  onSubmit() {
    if (!this.selectedProduct || !this.reason) {
      alert('Please complete the form.');
      return;
    }

    const formData = new FormData();
    formData.append('orderId', this.orderId!.toString());
    formData.append('productId', this.selectedProduct.productId.toString());
    formData.append('reason', this.reason);
    formData.append('returnDetail', this.details);
    formData.append('orderStatusAtCancelRequest', this.orderStatusAtCancelRequest ?? '');

    this.files.forEach(file => {
      formData.append('images', file);
    });

    this.returnService.submitReturnRequest(formData).subscribe({
      next: () => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Return request submitted!',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
          customClass: { popup: 'swal2-toast' }
        });
        this.activeModal.close("success");
      },
      error: err => {
        this.activeModal.close();
      }
    });

    console.log('Submitting form data:', formData);
  }

  closeModal() {
    this.activeModal.dismiss();
  }

  removeFile(index: number) {
    if (this.previewUrls && this.previewUrls.length > index) {
      URL.revokeObjectURL(this.previewUrls[index]);
      this.files.splice(index, 1);
      this.previewUrls.splice(index, 1);
    }
  }
  
  
}
