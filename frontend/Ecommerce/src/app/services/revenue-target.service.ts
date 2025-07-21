import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RevenueTargetService {
  private apiUrl = 'http://localhost:8080/api/target';

  constructor(private http: HttpClient) {}

  getTarget(periodType: string, periodValue: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?periodType=${periodType}&periodValue=${periodValue}`);
  }

  setTarget(periodType: string, periodValue: string, targetAmount: number): Observable<any> {
    return this.http.post<any>(this.apiUrl, { periodType, periodValue, targetAmount });
  }
} 