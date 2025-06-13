import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Product, ProductDTO, ProductList } from './product';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  baseUrl = 'http://localhost:8080/product';

  constructor(private http: HttpClient) {}

  createProduct(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/create`, formData);
  }

  getAllProduct(): Observable<ProductList[]>{
    return this.http.get<ProductList[]>(`${this.baseUrl}/getallproduct`);
  }

  activeProduct(id : number){
    return this.http.put(`${this.baseUrl}/active/${id}`, null);  
  }

  inactiveProduct(id : number){
    return this.http.put(`${this.baseUrl}/inactive/${id}`, null);  
  }
  
  deleteProduct(id : number){
    return this.http.put(`${this.baseUrl}/delete/${id}`, null);  
  }

  getAllAcProduct(): Observable<ProductDTO[]>{
    return this.http.get<ProductDTO[]>(`${this.baseUrl}/productlist`);
  }
}
