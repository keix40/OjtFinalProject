import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class IpService {
  constructor(private http: HttpClient) {}

  getPublicIp(): Observable<string> {
    return new Observable<string>((observer) => {
      fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => {
          observer.next(data.ip);
          observer.complete();
        })
        .catch(() => {
          observer.next('');
          observer.complete();
        });
    });
  }
} 