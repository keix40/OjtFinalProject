import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VipTier {
  id?: number;
  name: string;
  description: string;
  minPoints: number;
  weight: number;
  icon: string;
  color: string;
  order: number;
}

export interface VipTierInfo {
  currentTier: VipTier | null;
  nextTier: VipTier | null;
  pointsToNextTier: number;
  currentPoints: number;
}

@Injectable({
  providedIn: 'root'
})
export class VipTierService {
  private readonly baseUrl = `${environment.apiUrl}/vip-tiers`;

  constructor(private http: HttpClient) { }

  getAllVipTiers(): Observable<VipTier[]> {
    return this.http.get<VipTier[]>(this.baseUrl);
  }

  getById(id: number): Observable<VipTier> {
    return this.http.get<VipTier>(`${this.baseUrl}/${id}`);
  }

  create(tier: VipTier): Observable<VipTier> {
    return this.http.post<VipTier>(this.baseUrl, tier);
  }

  update(id: number, tier: VipTier): Observable<VipTier> {
    return this.http.put<VipTier>(`${this.baseUrl}/${id}`, tier);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  calculateVipTierInfo(totalPoints: number, allTiers: VipTier[]): VipTierInfo {
    const sortedTiers = [...allTiers].sort((a, b) => a.minPoints - b.minPoints);

    let currentTier: VipTier | null = null;
    let nextTier: VipTier | null = null;

    for (let i = sortedTiers.length - 1; i >= 0; i--) {
      if (totalPoints >= sortedTiers[i].minPoints) {
        currentTier = sortedTiers[i];
        break;
      }
    }

    for (const tier of sortedTiers) {
      if (totalPoints < tier.minPoints) {
        nextTier = tier;
        break;
      }
    }

    const pointsToNextTier = nextTier ? nextTier.minPoints - totalPoints : 0;

    return {
      currentTier,
      nextTier,
      pointsToNextTier,
      currentPoints: totalPoints
    };
  }
}
