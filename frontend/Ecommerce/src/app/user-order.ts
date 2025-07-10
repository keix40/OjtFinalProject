export interface UserOrder {
    orderCode?: string;
    userId : number,
    addressId : number,
    discountId : number | null,
    deliveryId : number,
    totalAmount : number,
    cartItem : {
        productId : number,
        quantity : number,
        price : number,
        variantId?: number | null; 
    }[]
    cardId?: number;
}

export interface OrderProductDTO {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
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
  deliveryFee: number;

  discountType?: string;
  discountCode?: string;
  discountValue?: number;

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

export interface ReturnRequestDTO {
  id: number;

  userId: number;
  userName: string;

  orderId: number;
  orderCode: string;
  orderDate: string;

  orderProductId: number;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;

  reasonForReturn: string;
  returnDetail?: string;
  status: string;
  adminRemark?: string;

  requestedAt: string;
  cancelledAt?: string;
  decisionAt?: string;

  imageUrls: string[];

  orderStatusAtCancelRequest?: string;
}

export interface CardInfoDTO {
  cardBrand: string;
  maskedCardNumber: string;
  cardholderName: string;
  expiryDate: string;
}
