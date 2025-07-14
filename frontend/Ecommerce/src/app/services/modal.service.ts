import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateBrandComponent } from '../create-brand/create-brand.component';
import { CreateCategoryComponent } from '../create-category/create-category.component';
import { CreateAttributeValueComponent } from '../create-attribute-value/create-attribute-value.component';
import { ProductComponent } from '../product/product.component';
import { ReturnRequestComponent } from '../return-request/return-request.component';
import { ConfirmModelComponent } from '../confirm-model/confirm-model.component';

@Injectable({
  providedIn: 'root'
})
export class ModalService {

  constructor(private modalService: NgbModal) {}

  openCreateBrandModal() {
    const modalRef = this.modalService.open(CreateBrandComponent, {
      backdrop: 'static',
      keyboard: false
    });
    return modalRef.result;
  }

  openCreateCategoryModal() {
    const modalRef = this.modalService.open(CreateCategoryComponent, {
      backdrop: 'static',
      keyboard: false
    });
    return modalRef.result;
  }

  openCreatAttributeAndValueModal() {
    const modalRef = this.modalService.open(CreateAttributeValueComponent, {
      backdrop: 'static',
      keyboard: false
    });
    return modalRef.result;
  }

  openReturnRequestModal(orderId?: number, orderStatusAtCancelRequest?: string) {
    const modalRef = this.modalService.open(ReturnRequestComponent, {
      backdrop: 'static',
      keyboard: false
    });
    if (orderId) {
      (modalRef.componentInstance as any).orderId = orderId;
    }
    if (orderStatusAtCancelRequest) {
      (modalRef.componentInstance as any).orderStatusAtCancelRequest = orderStatusAtCancelRequest;
    }
    return modalRef.result;
  }

  showConfirmation(title: string, message: string): Promise<boolean> {
    const modalRef = this.modalService.open(ConfirmModelComponent, {
      backdrop: 'static',
      keyboard: false,
      size: 'sm'
    });
    (modalRef.componentInstance as any).message = message;
    return modalRef.result;
  }
  
}