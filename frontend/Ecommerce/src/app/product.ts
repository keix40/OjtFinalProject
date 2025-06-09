export interface Product {
  productName: string;
  price: number;
  quantity: number;
  description: string;
  categoryBrandPairs: {
    categoryId: number;
    brandId: number | null;
  }[];
}

export interface ProductList{
  id: number;
  productName: string;
  productCode: string;
  description: string;
  price: number;
  quantity: number;
  createDate : string;
  updateDate : string;
  status : number;
  productImages: {
    id: number;
    imageUrl: string;
    status : number;
  }[];
  checked?: boolean;
}