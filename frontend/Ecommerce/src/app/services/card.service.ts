import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
    return this.http.get<SavedCard[]>(`${this.baseUrl}/user/${userId}`).pipe(
      catchError((error: any) => {
        console.error('Error fetching cards:', error);
        return throwError(() => error);
      })
    );
  }

  saveCard(card: SavedCard): Observable<SavedCard> {
    return this.http.post<SavedCard>(this.baseUrl, card).pipe(
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
    return this.http.put(`${this.baseUrl}/delete/${cardId}`, {}, {responseType : 'text'});
  }

  updateCard(cardId: number, cardData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/update/${cardId}`, cardData).pipe(
      catchError((error: any) => {
        console.error('Error updating card:', error);
        return throwError(() => error);
      })
    );
  }
  
}
