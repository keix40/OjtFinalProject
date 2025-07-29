import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VipTier {
  id?: number;
  name: string;
  description: string;
  minPoints: number;
  icon: string;
  color: string;
  order: number;
  weight: number;
}

@Injectable({ providedIn: 'root' })
export class VipTierService {
    private apiUrl = 'http://localhost:8080/api/vip-tiers';

  constructor(private http: HttpClient) {}

  getAll(): Observable<VipTier[]> {
    return this.http.get<VipTier[]>(this.apiUrl);
  }

  getById(id: number): Observable<VipTier> {
    return this.http.get<VipTier>(`${this.apiUrl}/${id}`);
  }

  create(tier: VipTier): Observable<VipTier> {
    return this.http.post<VipTier>(this.apiUrl, tier);
  }

  update(id: number, tier: VipTier): Observable<VipTier> {
    return this.http.put<VipTier>(`${this.apiUrl}/${id}`, tier);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
} 