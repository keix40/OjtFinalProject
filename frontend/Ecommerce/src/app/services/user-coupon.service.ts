import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserCoupon {
  id: number;
  name: string;
  description?: string;
  code: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  status: boolean;
  autoApply: boolean;
  minimumSpend?: number;
  discountRules?: any[];
  couponStatus: string; // "ACTIVE", "EXPIRED", "ALREADY_USED", "NOT_STARTED", "INACTIVE"
  canUse: boolean;
  statusMessage: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserCouponService {
  private apiUrl = `${environment.apiUrl}/coupons`;

  constructor(private http: HttpClient) { }

  getUserCoupons(userId: number): Observable<UserCoupon[]> {
    return this.http.get<UserCoupon[]>(`${this.apiUrl}/user/${userId}`);
  }
} 