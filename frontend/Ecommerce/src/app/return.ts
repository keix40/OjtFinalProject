export interface ReturnRequestById {
    id: number;
    userId: number;
    userName: string;
    orderId: number;
    orderCode: string;
    orderDate: string;
    orderProductId: number;
    cardId: number;
    cardNumber: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
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
    refundStatus: String;
  }
  