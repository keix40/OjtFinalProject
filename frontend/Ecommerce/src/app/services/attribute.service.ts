import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Attribute, AttributeAndValueDTO, AttributeValue } from '../attribute';

@Injectable({
  providedIn: 'root'
})
export class AttributeService {
  baseUrl = 'http://localhost:8080/attribute';

  constructor(private http: HttpClient) { }

  getAllAttribute(): Observable<Attribute[]> {
    return this.http.get<Attribute[]>(`${this.baseUrl}/getallattribute`);
  }

  getAllValue(): Observable<AttributeValue[]> {
    return this.http.get<AttributeValue[]>(`${this.baseUrl}/getallvalue`);
  }

  getValueById(id: number): Observable<AttributeValue[]> {
    return this.http.get<AttributeValue[]>(`${this.baseUrl}/getvaluebyid/${id}`).pipe(
      catchError(() => {
        // If there's an error, return empty array instead of error
        return of([]);
      })
    );
  }

  create(attributeDTO: AttributeAndValueDTO): Observable<any> {
    return this.http.post(`${this.baseUrl}/create`, attributeDTO, { responseType: 'text' });
  }
}
