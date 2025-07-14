import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DiscountCouponService  {
  private adminBaseUrl = 'http://localhost:8080/api/admin/discounts';

  private couponValidateUrl = 'http://localhost:8080/api/coupons/validate';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  // Admin CRUD
  getDiscounts(): Observable<any> {
    return this.http.get(this.adminBaseUrl, { headers: this.getAuthHeaders() });
  }

  getDiscount(id: number): Observable<any> {
    return this.http.get(`${this.adminBaseUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  createDiscount(discount: any): Observable<any> {
    return this.http.post(this.adminBaseUrl, discount, { headers: this.getAuthHeaders() });
  }

  updateDiscount(id: number, discount: any): Observable<any> {
    return this.http.put(`${this.adminBaseUrl}/${id}`, discount, { headers: this.getAuthHeaders() });
  }

  deleteDiscount(id: number): Observable<any> {
    return this.http.delete(`${this.adminBaseUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  checkCodeExists(code: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.adminBaseUrl}/check-code?code=${encodeURIComponent(code)}`, { headers: this.getAuthHeaders() });
  }
}