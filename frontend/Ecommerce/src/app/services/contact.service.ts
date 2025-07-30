import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private apiUrl = '/api/contact';

  constructor(private http: HttpClient) {}

  sendContactMessage(data: ContactMessage): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }
}