export interface Category {
    id: number;
    name: string;
    image?: string;
    parentId?: number;
    status?: number;
    iconUrl?: string;
    iconClass?: string;
}

export interface CategoryDTO{
    cateNames : String[];
    brandId : number;
    brandName : String;
    parentId?: number;
    image?: String;
    icon?: string;
    iconUrl?: string;
    iconClass?: string;
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