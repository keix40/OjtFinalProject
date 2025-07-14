import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Policy {
  id: number;
  title: string;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class PolicyService {
  private baseUrl = '/api/policies';

  constructor(private http: HttpClient) { }

  getAllPolicies(): Observable<Policy[]> {
    return this.http.get<Policy[]>(this.baseUrl);
  }

  getPolicyById(id: number): Observable<Policy> {
    return this.http.get<Policy>(`${this.baseUrl}/${id}`);
  }

  createPolicy(data: { title: string; content: string }): Observable<Policy> {
    return this.http.post<Policy>(this.baseUrl, data);
  }

  updatePolicy(id: number, data: { title: string; content: string }): Observable<Policy> {
    return this.http.put<Policy>(`${this.baseUrl}/${id}`, data);
  }

  deletePolicy(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
