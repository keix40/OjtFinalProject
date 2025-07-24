export interface UserOrder {
    orderCode?: string;
    userId: number;
    addressId: number;
    discountId: number | null;
    deliveryServiceId: number;
    deliveryFee: number;
    totalAmount: number;
    cartItem: {
        productId: number;
        quantity: number;
        price: number;
        variantId?: number | null;
    }[];
    cardId?: number;
}

export interface OrderProductDTO {
  orderProductId: number; // <-- This is the UserOrderHasProduct ID
  productId: number;
  productName: string;
  variantId?: number;
  sku?: string;
  quantity: number;
  unitPrice: number;
  status?: string; // <-- add this line
  originalPrice?: number;
  discountedPrice?: number;
}


export interface AddressDTO {
  id: number;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  type: string;
  createUpdate: string;
  updateDate: string;
}

export interface UserDTO {
  id: number;
  name: string;
  email: string;
  dob: string;
  gender: string;
  phNo: string;
  createdDate: string;
  totalPoints: number;
}

export interface UserOrderListDTO {
  orderId: number;
  orderCode: string;
  orderDate: string;
  updatedDate: string;
  status: string;

  deliveryMethod: string;
  deliveryService : String;
  deliveryFee: number;

  discountType?: string;
  discountCode?: string;
  discountValue?: number;
  userDiscountId?: number;

  subtotal: number;
  discountAmount: number;
  total: number;

  products: OrderProductDTO[];
  user: UserDTO;
  address: AddressDTO;
  statusHistory: {
    status: string;
    statusDate: string;
  }[];
  returnRequests: ReturnRequestDTO[];
  cardInfo?: CardInfoDTO;
}

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

export interface ReturnRequestDTO {
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

export interface CardInfoDTO {
  cardBrand: string;
  maskedCardNumber: string;
  cardholderName: string;
  expiryDate: string;
}
