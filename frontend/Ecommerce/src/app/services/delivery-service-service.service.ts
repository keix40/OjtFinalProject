import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DeliveryService {
  id?: number;
  name: string;
  feePerKm: number | string;
  phoneNumber?: string;
  baseAddress: {
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
  };
  status?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DeliveryServiceService {
  private apiUrl = 'http://localhost:8080/deliveryservice';

  constructor(private http: HttpClient) {}

  getAll(): Observable<DeliveryService[]> {
    return this.http.get<DeliveryService[]>(this.apiUrl);
  }

  getById(id: number): Observable<DeliveryService> {
    return this.http.get<DeliveryService>(`${this.apiUrl}/${id}`);
  }

  create(deliveryService: DeliveryService): Observable<DeliveryService> {
    return this.http.post<DeliveryService>(this.apiUrl, deliveryService, {responseType: 'text' as 'json'});
  }

  update(id: number, deliveryService: DeliveryService): Observable<DeliveryService> {
    return this.http.put<DeliveryService>(`${this.apiUrl}/${id}`, deliveryService);
  }

  softDelete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }
}
