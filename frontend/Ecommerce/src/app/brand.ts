export interface Brand {
    id : number;
    name : String;
}

export interface BrandDTO{
    brandName : String;
    categoryIds: number[];
    categoryName : String;
}
