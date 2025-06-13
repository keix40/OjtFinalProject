import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Product, ProductDTO, ProductList } from './product';


@Injectable({
  providedIn: 'root'
})
export class ProductService {

  baseUrl = 'http://localhost:8080/product';

  constructor(private http: HttpClient) {}

  createProduct(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/create`, formData);
  }

  getAllProduct(): Observable<ProductList[]> {
    return this.http.get<ProductList[]>(`${this.baseUrl}/getallproduct`).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        throw new Error('Invalid response format');
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error('Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  activeProduct(id: number) {
    return this.http.put(`${this.baseUrl}/active/${id}`, null);
  }

  inactiveProduct(id: number) {
    return this.http.put(`${this.baseUrl}/inactive/${id}`, null);
  }
  
  deleteProduct(id: number) {
    return this.http.put(`${this.baseUrl}/delete/${id}`, null);
  }

  getAllAcProduct(): Observable<ProductDTO[]>{
    return this.http.get<ProductDTO[]>(`${this.baseUrl}/productlist`);
  }
}
