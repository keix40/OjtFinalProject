import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
export interface SavedCard {
  id?: number;
  userId: number;
  cardholderName: string;
  /** Full PAN on write only; API returns lastFour/maskedNumber on read. */
  cardNumber: string;
  lastFour?: string;
  maskedNumber?: string;
  expiryDate: string;
  cardBrand: string;
  cardToken?: string;
  isDefault: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CardService {

  private baseUrl = '/card';
  private opts = { withCredentials: true as const };
  constructor(private http: HttpClient) {}

  getCardsByUserId(userId: number): Observable<SavedCard[]> {
    return this.http.get<SavedCard[]>(`${this.baseUrl}/user/${userId}`, this.opts).pipe(
      catchError((error: any) => {
        console.error('Error fetching cards:', error);
        return throwError(() => error);
      })
    );
  }

  saveCard(card: SavedCard): Observable<SavedCard> {
    return this.http.post<SavedCard>(this.baseUrl, card, this.opts).pipe(
      catchError((error: any) => {
        console.error('Error saving card:', error);
        if (error.error && typeof error.error === 'string') {
          try {
            // Try to parse the error response as JSON
            const parsedError = JSON.parse(error.error);
            return throwError(() => parsedError);
          } catch (parseError) {
            // If parsing fails, return the original error
            return throwError(() => error);
          }
        }
        return throwError(() => error);
      })
    );
  }

  softDeleteCard(cardId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/delete/${cardId}`, {}, { ...this.opts, responseType: 'text' });
  }

  updateCard(cardId: number, cardData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/update/${cardId}`, cardData, this.opts).pipe(
      catchError((error: any) => {
        console.error('Error updating card:', error);
        return throwError(() => error);
      })
    );
  }
  
}
