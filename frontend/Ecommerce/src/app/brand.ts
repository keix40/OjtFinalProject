import { CategoryListDTO } from "./category";

export interface Brand {
    id : number;
    name : String;
    image? : String;
}

export interface BrandDTO{
    id?: number;
    brandName : String;
    categoryIds: number[];
    categoryName : String;
    image?: String;
}

export interface BrandListDTO{
    id : number;
    name : string;
    image : string;
    categories : CategoryListDTO[];
}