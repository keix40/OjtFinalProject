import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VipTier {
  id: number;
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
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getAllVipTiers(): Observable<VipTier[]> {
    return this.http.get<VipTier[]>(`${this.apiUrl}/vip-tiers`);
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

  calculateVipTierInfo(totalPoints: number, allTiers: VipTier[]): VipTierInfo {
    console.log('calculateVipTierInfo called with totalPoints:', totalPoints, 'allTiers:', allTiers);
    
    // Sort tiers by minPoints in ascending order
    const sortedTiers = allTiers.sort((a, b) => a.minPoints - b.minPoints);
    console.log('Sorted tiers:', sortedTiers);
    
    let currentTier: VipTier | null = null;
    let nextTier: VipTier | null = null;
    
    // Find current tier (highest tier where user's points >= minPoints)
    for (let i = sortedTiers.length - 1; i >= 0; i--) {
      if (totalPoints >= sortedTiers[i].minPoints) {
        currentTier = sortedTiers[i];
        break;
      }
    }
    
    // Find next tier (lowest tier where user's points < minPoints)
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