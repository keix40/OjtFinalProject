import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
export interface SavedCard {
  id?: number;
  userId: number;
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cardBrand: string;
  cardToken?: string;
  isDefault: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CardService {

  private baseUrl = 'http://localhost:8080/card';
  constructor(private http: HttpClient) {}

  getCardsByUserId(userId: number): Observable<SavedCard[]> {
    return this.http.get<SavedCard[]>(`${this.baseUrl}/user/${userId}`);
  }

  saveCard(card: SavedCard): Observable<SavedCard> {
    return this.http.post<SavedCard>(this.baseUrl, card);
  }

  deleteCard(cardId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${cardId}`);
  }
}
