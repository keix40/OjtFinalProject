import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category, CategoryDTO } from './category';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  baseUrl = 'http://localhost:8080/category';

  constructor(private http: HttpClient) { }

  getAllCategory(): Observable<Category[]>{
    return this.http.get<Category[]>(`${this.baseUrl}/getallcategory`);
  }

  createCategory(cateDto : CategoryDTO): Observable<CategoryDTO> {
    return this.http.post<CategoryDTO>(`${this.baseUrl}/addcategory`, cateDto,{responseType : 'text' as 'json'});
  }
}
