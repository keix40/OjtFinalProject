import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface Address {
  id?: number;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  type: string;
  userId?: number;
  deliveryServiceId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private apiUrl = `${environment.apiUrl}/addresses`;
  private httpOptions = { withCredentials: true as const };

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getAddresses(): Observable<Address[]> {
    const userId = this.authService.getUserId();
    return this.http.get<Address[]>(`${this.apiUrl}/showAddressList/${userId}`, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error('Address Service Error:', errorMessage);
    return throwError(() => errorMessage);
  }

  addAddress(address: Address): Observable<any> {
    const userId = this.authService.getUserId();
    const addressWithUserId = { ...address, userId };
    return this.http.post(
      `${this.apiUrl}/addNewAddress`,
      addressWithUserId,
      { ...this.httpOptions, responseType: 'text' as 'json' }
    );
  }

  updateAddress(id: number, address: Address): Observable<Address> {
    return this.http.put<any>(`${this.apiUrl}/updateAddress/${id}`, address, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deleteAddress/${id}`, this.httpOptions);
  }
}
