import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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

  getValueById(id : number): Observable<AttributeAndValueDTO[]> {
    return this.http.get<AttributeAndValueDTO[]>(`${this.baseUrl}/getvaluebyid/${id}`);
  }

  create(attributeDTO : AttributeAndValueDTO): Observable<any> {
    return this.http.post(`${this.baseUrl}/create`, attributeDTO, { responseType: 'text' });
  }

  addValue(attributeId: number, value: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/addvalue?attributeId=${attributeId}`, { value }, { responseType: 'text' });
  }

  updateAttribute(id: number, name: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/update/${id}`, { name }, { responseType: 'text' });
  }

  deleteAttribute(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`, { responseType: 'text' });
  }

  updateAttributeValue(id: number, value: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/update-value/${id}`, { value }, { responseType: 'text' });
  }

  deleteAttributeValue(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete-value/${id}`, { responseType: 'text' });
  }
  
}
