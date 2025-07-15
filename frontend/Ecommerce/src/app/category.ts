export interface Category {
    id: number;
    name: string;
    image?: string;
    parentId?: number;
    status?: number;
}

export interface CategoryDTO{
    cateNames : String[];
    brandId : number;
    brandName : String;
    parentId?: number;
    image?: String;
}

export interface CategoryListDTO {
    id: number;
    name: string;
    image: string;
    subcategories: CategoryListDTO[];
  }
  
export interface CategoryTreeDTO {
    id: number;
    name: string;
    image?: string;
    status: number;
    children?: CategoryTreeDTO[];
}
  
export interface SubCategoryDTO {
    parentId: number;
    subCategoryNames: string[];
  }  