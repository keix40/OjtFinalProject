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

export interface ProductDTO {
  id: number;
  productName: string;
  productCode: string;
  price: number;
  quantity: number;
  description: string;
  status: number;

  categoryBrandArray: {
    categoryId: number;
    cateName?: string;
    brandId: number | null;
    brandName?: string | null;
  }[];
  
  productImages: {
    id: number;
    imageUrl: string;
    status: number;
  }[];
  
  // Rating fields
  averageRating?: number;
  reviewCount?: number;
}
