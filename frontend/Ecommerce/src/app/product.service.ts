import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Product } from './product';
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

}
