export interface ReturnRequestProductDTO {
  id: number;
  orderProductId: number;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  productRemark?: string;
}

export interface ReturnRequestById {
  id: number;
  userId: number;
  userName: string;
  orderId: number;
  orderCode: string;
  orderDate: string;
  cardId: number;
  cardNumber: string;
  reasonForReturn: string;
  returnDetail: string;
  status: string;
  adminRemark: string | null;
  requestedAt: string;
  cancelledAt: string | null;
  decisionAt: string | null;
  imageUrls: string[];
  refundId?: number;
  refundAmount?: number;
  initiatedAt: string;
  completedAt?: string;
  refundAdminRemark?: string;
  refundStatus: string;
  refundType?: string;
  products: ReturnRequestProductDTO[];
}
  