export interface Product {
  productName: string;
  price: number;
  quantity : number;
  description: string;
  brand: { id: number };
  category: { id: number };
}
