import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DiscountCouponService {
  private adminBaseUrl = '/api/admin/discounts';
  private couponValidateUrl = '/api/coupons/validate';
  private httpOptions = { withCredentials: true as const };

  constructor(private http: HttpClient) {}

  getDiscounts(): Observable<any> {
    return this.http.get(this.adminBaseUrl, this.httpOptions);
  }

  getDiscount(id: number): Observable<any> {
    return this.http.get(`${this.adminBaseUrl}/${id}`, this.httpOptions);
  }

  createDiscount(discount: any): Observable<any> {
    return this.http.post(this.adminBaseUrl, discount, this.httpOptions);
  }

  updateDiscount(id: number, discount: any): Observable<any> {
    return this.http.put(`${this.adminBaseUrl}/${id}`, discount, this.httpOptions);
  }

  deleteDiscount(id: number): Observable<any> {
    return this.http.delete(`${this.adminBaseUrl}/${id}`, this.httpOptions);
  }

  validateCoupon(payload: any): Observable<any> {
    return this.http.post(this.couponValidateUrl, payload, this.httpOptions);
  }

  checkCodeExists(code: string): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.adminBaseUrl}/check-code?code=${encodeURIComponent(code)}`,
      this.httpOptions
    );
  }
}
