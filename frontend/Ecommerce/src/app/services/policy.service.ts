import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Policy {
  id: number;
  title: string;
  content: string;
  status?: string | number;
  open?: boolean;
  checked?: boolean;
  lastUpdated?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PolicyService {
  private baseUrl = 'http://localhost:8080/api/policies';

  constructor(private http: HttpClient) { }

  getAllPolicies(): Observable<Policy[]> {
    return this.http.get<Policy[]>(this.baseUrl);
  }

  getPolicyById(id: number): Observable<Policy> {
    return this.http.get<Policy>(`${this.baseUrl}/${id}`);
  }

  createPolicy(data: { title: string; content: string; status?: number }): Observable<Policy> {
    return this.http.post<Policy>(this.baseUrl, data);
  }

  updatePolicy(id: number, data: { title: string; content: string; status?: number }): Observable<Policy> {
    return this.http.put<Policy>(`${this.baseUrl}/${id}`, data);
  }

  deletePolicy(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
