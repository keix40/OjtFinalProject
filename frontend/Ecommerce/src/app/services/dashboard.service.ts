 import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  getTotalSales(): Observable<number> {
    return this.http.get<number>('http://localhost:8080/order/total-sales');
  }

  getSalesTrend(timeFrame: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/order/sales-trend?timeFrame=${timeFrame}`);
  }

  getOrderCount(): Observable<number> {
    return this.http.get<number>('http://localhost:8080/order/count');
  }

  getActiveUsers(timeFrame: string): Observable<number> {
    return this.http.get<number>(`http://localhost:8080/order/active-users?timeFrame=${timeFrame}`);
  }

  getCustomersCount(): Observable<number> {
    return this.http.get<number>('http://localhost:8080/order/customers-count');
  }

  getPreviousMetrics(timeFrame: string): Observable<any> {
    return this.http.get<any>(`http://localhost:8080/order/previous-metrics?timeFrame=${timeFrame}`);
  }

  // Session and Bounce Rate endpoints
  getSessionCount(timeFrame: string): Observable<number> {
    return this.http.get<number>(`http://localhost:8080/order/session-count?timeFrame=${timeFrame}`);
  }

  getActiveSessions(timeFrame: string): Observable<number> {
    return this.http.get<number>(`http://localhost:8080/order/active-sessions?timeFrame=${timeFrame}`);
  }

  getBounceRate(timeFrame: string): Observable<number> {
    return this.http.get<number>(`http://localhost:8080/order/bounce-rate?timeFrame=${timeFrame}`);
  }

  getSessionStats(timeFrame: string): Observable<any> {
    return this.http.get<any>(`http://localhost:8080/order/session-stats?timeFrame=${timeFrame}`);
  }

  getSessionTrends(timeFrame: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/order/session-trends?timeFrame=${timeFrame}`);
  }

  // Engagement Analytics endpoints
  getEngagementAnalytics(timeFrame: string): Observable<any> {
    return this.http.get<any>(`http://localhost:8080/order/engagement-analytics?timeFrame=${timeFrame}`);
  }

  getEngagementTrends(timeFrame: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/order/engagement-trends?timeFrame=${timeFrame}`);
  }

  // Customer Segmentation endpoints
  getCustomerSegmentation(timeFrame: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/order/customer-segmentation?timeFrame=${timeFrame}`);
  }

  getVipTierData(timeFrame: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/order/vip-tier-data?timeFrame=${timeFrame}`);
  }

  getCustomerAcquisition(timeFrame: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/order/customer-acquisition?timeFrame=${timeFrame}`);
  }

  // Analytics endpoints for pie charts
  getBrandSalesData(timeFrame: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/order/analytics/brand-sales?timeFrame=${timeFrame}`);
  }

  getCategorySalesData(timeFrame: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/order/analytics/category-sales?timeFrame=${timeFrame}`);
  }

  getProductSalesData(timeFrame: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/order/analytics/product-sales?timeFrame=${timeFrame}`);
  }

  getDeliveryServiceData(timeFrame: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/order/analytics/delivery-services?timeFrame=${timeFrame}`);
  }

  // New Users endpoints
  getNewUsersCount(timeFrame: string): Observable<number> {
    return this.http.get<number>(`http://localhost:8080/order/new-users-count?timeFrame=${timeFrame}`);
  }

  getNewUsersTrends(timeFrame: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/order/new-users-trends?timeFrame=${timeFrame}`);
  }
} 