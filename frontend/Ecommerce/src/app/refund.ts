export interface RefundDTO {
  returnRequestId: number;
  refundAmount: number;
  refundMethod?: string;
  adminRemark?: string;
  receiveCardId: number;
}
