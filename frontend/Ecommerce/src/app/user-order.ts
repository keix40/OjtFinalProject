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
}

export interface OrderProductDTO {
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
}