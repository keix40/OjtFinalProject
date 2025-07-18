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
} 