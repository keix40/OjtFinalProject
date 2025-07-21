import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, CategoryDTO, CategoryTreeDTO, SubCategoryDTO } from '../category';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  baseUrl = 'http://localhost:8080/category';

  constructor(private http: HttpClient) { }

  getAllCategory(): Observable<Category[]>{
    return this.http.get<Category[]>(`${this.baseUrl}/getallcategory`);
  }

  createCategoryWithImage(cateDto: CategoryDTO, imageFile?: File): Observable<any> {
    const formData = new FormData();
  
    const categoryBlob = new Blob([JSON.stringify(cateDto)], { type: 'application/json' });
    formData.append('category', categoryBlob);
  
    if (imageFile) {
      formData.append('image', imageFile);
    }
  
    return this.http.post(`${this.baseUrl}/addcategory`, formData, { responseType: 'text' });
  }
  
  getAllCateWithBrand(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/getallcatewithbrand/${id}`);
  }

  getCategoryTree(): Observable<CategoryTreeDTO[]> {
    return this.http.get<CategoryTreeDTO[]>(`${this.baseUrl}/tree`);
  }

  updateCategory(id: number, name: string, parentId?: number, imageFile?: File): Observable<any> {
    const formData = new FormData();
    formData.append('name', name);
    if (parentId) formData.append('parentId', parentId.toString());
    if (imageFile) formData.append('image', imageFile);

    return this.http.put(`${this.baseUrl}/update/${id}`, formData);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/delete/${id}`, {}, {responseType:  "text"});
  }

  addSubCategories(dto: SubCategoryDTO): Observable<any> {
    return this.http.put(`${this.baseUrl}/addsubcategories`, dto, { responseType: 'text' });
  }
  
}
