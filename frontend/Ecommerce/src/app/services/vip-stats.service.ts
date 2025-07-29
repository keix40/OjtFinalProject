import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VipStatsService {
  private baseUrl = '/api/vip-tiers/stats';

  constructor(private http: HttpClient) {}

  getCustomersGrowth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/customers-growth`);
  }

  getRevenueGrowth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/revenue-growth`);
  }

  getAvgOrderValueComparison(): Observable<any> {
    return this.http.get(`${this.baseUrl}/avg-order-value`);
  }

  getLoyaltyScoreGrowth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/loyalty-score-growth`);
  }
} 