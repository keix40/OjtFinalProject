import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Product, ProductDTO, ProductList } from '../product';


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

  getProductDetailById(id: string, userId?: number) {
    const url = userId ? `${this.baseUrl}/adminProductDetail/${id}?userId=${userId}` : `${this.baseUrl}/adminProductDetail/${id}`;
    return this.http.get<any>(url);
  }

  getProductsByIds(ids: number[]): Observable<ProductDTO[]> {
    return this.http.post<ProductDTO[]>(`${this.baseUrl}/by-ids`, { ids });
  }

  updateProduct(id: string, formData: FormData): Observable<any> {
    return this.http.put(`${this.baseUrl}/update/${id}`, formData);
  }

  getProductQuantity(productId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/productquantity/${productId}`);
  }

  getProductVariantStock(variantId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/variantstock/${variantId}`);
  }

  getLatestProducts(): Observable<ProductDTO[]> {
    return this.http.get<ProductDTO[]>(`${this.baseUrl}/latest`);
  }

  getTopOrderedProducts(): Observable<ProductList[]> {
    return this.http.get<ProductList[]>(`${this.baseUrl}/topordered`);
  }

  getTrendingProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/trending`);
  }

  getFeaturedProducts(userId?: number): Observable<any[]> {
    const url = userId ? `${this.baseUrl}/featured?userId=${userId}` : `${this.baseUrl}/featured`;
    return this.http.get<any[]>(url);
  }

  getRelatedProducts(categoryIds: number[], brandIds: number[], currentProductId: number, excludeProductIds: number[]): Observable<ProductDTO[]> {
    const params = new URLSearchParams();
    categoryIds.forEach(id => params.append('categoryIds', id.toString()));
    brandIds.forEach(id => params.append('brandIds', id.toString()));
    params.append('currentProductId', currentProductId.toString());
    excludeProductIds.forEach(id => params.append('excludeProductIds', id.toString()));
    
    const url = `${this.baseUrl}/related?${params.toString()}`;
    console.log('Calling related products API:', url);
    console.log('Parameters:', { categoryIds, brandIds, currentProductId, excludeProductIds });
    
    return this.http.get<ProductDTO[]>(url);
  }

  searchProducts(keyword: string): Observable<ProductDTO[]> {
    return this.http.get<ProductDTO[]>(`${this.baseUrl}/search?keyword=${encodeURIComponent(keyword)}`);
  }

  // Enhanced search method for comprehensive search
  searchProductsComprehensive(keyword: string): Observable<ProductDTO[]> {
    return this.http.get<ProductDTO[]>(`${this.baseUrl}/search-comprehensive?keyword=${encodeURIComponent(keyword)}`);
  }

  // Live search method for real-time results
  liveSearch(keyword: string): Observable<ProductDTO[]> {
    return this.http.get<ProductDTO[]>(`${this.baseUrl}/live-search?keyword=${encodeURIComponent(keyword)}`);
  }
  
}
