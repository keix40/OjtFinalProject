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
  selectedProducts: OrderProductDTO[] = [];
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
          this.products = order.products.map(p => ({
            ...p,
            orderProductId: p.orderProductId // This must be set!
          }));
          console.log('Loaded products:', this.products);
          this.products.forEach((p, i) => console.log(`Product[${i}]`, p));
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

  getSelectedProductNames(): string {
    if (this.selectedProducts && this.selectedProducts.length > 0) {
      return this.selectedProducts.map(p => p.productName).join(', ');
    }
    return '-';
  }

  onSubmit() {
    if (!this.selectedProducts.length || !this.reason) {
      alert('Please select at least one product and a reason.');
      return;
    }
    if (!this.orderId) {
      alert('Order information is missing.');
      return;
    }
    // Defensive: filter out products with null/undefined orderProductId
    const validSelectedProducts = this.selectedProducts.filter(p => p.orderProductId != null);
    if (validSelectedProducts.length !== this.selectedProducts.length) {
      alert('One or more selected products are invalid. Please reselect.');
      return;
    }
    const formData = new FormData();
    // Build the data object for backend
    const data = {
      orderId: this.orderId,
      orderProductIds: validSelectedProducts.map(p => p.orderProductId),
      reason: this.reason,
      returnDetail: this.details,
      quantities: validSelectedProducts.map(p => p.quantity)
    };
    const validOrderProductIds = this.products.map(p => p.orderProductId);
    const filteredOrderProductIds = validSelectedProducts
      .map(p => p.orderProductId)
      .filter(id => validOrderProductIds.includes(id));
    formData.append('data', new Blob([JSON.stringify({
      ...data,
      orderProductIds: filteredOrderProductIds
    })], { type: 'application/json' }));
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
    console.log('Submitting form data:', data);
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
