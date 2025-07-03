import { Injectable } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import { Subject, Observable } from 'rxjs';
import SockJS from 'sockjs-client';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class NotifcationService {
private client!: Client;
  private notificationSubject = new Subject<any>();
  public notifications$ = this.notificationSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token');

    if (!token) {
      console.warn('[NotificationService] No token found in localStorage. WebSocket not started.');
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(`http://localhost:8080/ws?token=${token}`),
      reconnectDelay: 5000,

    });

    this.client.onConnect = () => {
      console.log('[NotificationService] Connected to WebSocket server');

 this.client.subscribe('/user/queue/notifications', (message: Message) => {
  let notificationData: any;

  try {
    notificationData = JSON.parse(message.body); // parse the JSON
  } catch {
    notificationData = { message: message.body, timestamp: new Date().toISOString() };
  }

  // 👇 Log correctly
  if (typeof notificationData === 'object') {
    console.log('[NotificationService] Received notification:', JSON.stringify(notificationData, null, 2));
  } else {
    console.log('[NotificationService] Received notification:', notificationData);
  }

  this.notificationSubject.next(notificationData);
});
    };

    this.client.onStompError = (frame) => {
      console.error('[NotificationService] STOMP Error:', frame.headers['message']);
    };

    this.client.onWebSocketError = (evt) => {
      console.error('[NotificationService] WebSocket error:', evt);
    };

    this.client.activate();
  }

   //🔁 Load stored notifications from backend

  getStoredNotifications(): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any[]>('http://localhost:8080/api/notifications', { headers });
  }


   //🗑 Delete a notification from the backend

  deleteNotification(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete(`http://localhost:8080/api/notifications/${id}`, { headers });
  }

   //✅ Mark a notification as read

  markAsRead(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(`http://localhost:8080/api/notifications/${id}/read`, {}, { headers });
  }
}