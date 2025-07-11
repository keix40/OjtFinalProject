import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReturnService } from '../services/return.service';
import { ReturnRequestById } from '../return';
import { RefundDTO } from '../refund';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-return-detail',
  templateUrl: './return-detail.component.html',
  styleUrls: ['./return-detail.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ReturnDetailComponent implements OnInit {
  returnDetail: ReturnRequestById | null = null;
  showModal = false;
  refundOrReplacement: 'refund' | 'replacement' = 'refund';
  adminRemark = '';
  selectedCard = '';
  refundAmount = 0;
  selectedImage: string | null = null;
  selectedImageIndex: number | null = null;

  constructor(
    private returnService: ReturnService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.returnService.getReturnById(+id).subscribe(data => {
        this.returnDetail = data;
        this.refundAmount = data.totalAmount;
        this.selectedCard = data.cardNumber;
        this.adminRemark = data.adminRemark || '';
      });
    }
  }

  onApprove() {
    if (!this.returnDetail) return;
    this.returnService.approveRequest({
      returnRequestId: this.returnDetail.id,
      adminRemark: this.adminRemark
    }).subscribe(() => {
      this.showModal = true;
      Swal.fire('Success', 'Return request approved!', 'success');
    });
  }

  onReject() {
    if (!this.returnDetail) return;
    this.returnService.rejectRequest({
      returnRequestId: this.returnDetail.id,
      adminRemark: this.adminRemark
    }).subscribe(() => {
      Swal.fire('Success', 'Return request rejected!', 'success');
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
      this.showModal = false;
    });
  }

  onSendReplacement() {
    if (!this.returnDetail) return;
    this.returnService.processReplacement({
      returnRequestId: this.returnDetail.id,
      adminRemark: this.adminRemark
    }).subscribe(() => {
      Swal.fire('Success', 'Replacement processed successfully!', 'success');
      this.showModal = false;
    });
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
  
}