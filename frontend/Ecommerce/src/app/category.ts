export interface Category {
    id : number;
    name : String;
}

export interface CategoryDTO{
    cateNames : String[];
    brandId : number;
    brandName : String;
    parentId?: number;
}