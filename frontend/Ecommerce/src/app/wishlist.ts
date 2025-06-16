import { ProductDTO } from "./product";

export interface Wishlist {
  id: number;
  status: number;
  wishlistDate: string;
  product: ProductDTO;
}
