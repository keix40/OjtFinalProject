import { Injectable } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import { Subject, Observable, of } from 'rxjs';
import SockJS from 'sockjs-client';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotifcationService {
  private client!: Client;
  private notificationSubject = new Subject<any>();
  public notifications$ = this.notificationSubject.asObservable();
  private httpOptions = { withCredentials: true as const };

  constructor(private http: HttpClient, private authService: AuthService) {
    if (!this.authService.isLoggedIn()) {
      this.authService.loadSession().subscribe(session => {
        if (session) {
          this.initWebSocket();
        }
      });
    } else {
      this.initWebSocket();
    }
  }

  private initWebSocket(): void {
    if (!this.authService.isLoggedIn()) {
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,
    });

    this.client.onConnect = () => {
      this.client.subscribe('/user/queue/notifications', (message: Message) => {
        let notificationData: any;
        try {
          notificationData = JSON.parse(message.body);
        } catch {
          notificationData = { message: message.body, timestamp: new Date().toISOString() };
        }
        this.notificationSubject.next(notificationData);
      });

      this.client.subscribe('/topic/activity-feed', (message: Message) => {
        let activityData: any;
        try {
          activityData = JSON.parse(message.body);
        } catch {
          activityData = { message: message.body, timestamp: new Date().toISOString() };
        }
        this.notificationSubject.next(activityData);
      });
    };

    this.client.onStompError = (frame) => {
      console.error('[NotificationService] STOMP Error:', frame.headers['message']);
    };

    this.client.activate();
  }

  sendNotification(notificationData: any): void {
    this.http.post('/api/notifications', notificationData, this.httpOptions).subscribe({
      next: (savedNotification) => this.notificationSubject.next(savedNotification),
      error: (err) => console.error('Failed to save notification:', err)
    });
  }

  getStoredNotifications(): Observable<any[]> {
    if (!this.authService.isLoggedIn()) {
      return of([]);
    }
    return this.http.get<any[]>('/api/notifications', this.httpOptions);
  }

  deleteNotification(id: number): Observable<any> {
    return this.http.delete(`/api/notifications/${id}`, this.httpOptions);
  }

  markAsRead(id: number): Observable<any> {
    return this.http.post(`/api/notifications/${id}/read`, {}, this.httpOptions);
  }

  markAsUnread(id: number): Observable<any> {
    return this.http.post(`/api/notifications/${id}/unread`, {}, this.httpOptions);
  }
}
