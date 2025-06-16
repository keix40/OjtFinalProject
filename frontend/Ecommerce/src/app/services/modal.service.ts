import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateBrandComponent } from '../create-brand/create-brand.component';
import { CreateCategoryComponent } from '../create-category/create-category.component';
import { CreateAttributeValueComponent } from '../create-attribute-value/create-attribute-value.component';
import { ProductComponent } from '../product/product.component';

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
  
}