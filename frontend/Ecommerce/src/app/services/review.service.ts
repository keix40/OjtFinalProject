import { inject, Injectable } from '@angular/core';
import { Client, IMessage, Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { ReviewMessage } from '../review-message';
import { HttpClient } from '@angular/common/http';
import { Review, ReviewDTO } from '../review';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private stompClient!: Client;
  private reviewSubject = new BehaviorSubject<ReviewMessage[]>([]);
  public reviews$ = this.reviewSubject.asObservable();

  private productId!: number;
  private http = inject(HttpClient);

  connect(productId: number, username: string): void {
    this.productId = productId;
  
    // 🔐 Get token from localStorage (or AuthService if you're using one)
    const token = localStorage.getItem('token');
  
    this.stompClient = new Client({
      // 🛠️ Use SockJS with token in query param
      webSocketFactory: () => new SockJS(`http://localhost:8080/ws-review?token=${token}`),
      reconnectDelay: 5000,
    });
  
    this.stompClient.onConnect = () => {
      // ✅ Subscribe to product review topic
      this.stompClient.subscribe(`/topic/reviews.${productId}`, (message: IMessage) => {
        const msg: ReviewMessage = JSON.parse(message.body);
        console.log('Received review message:', msg); // Debug incoming message
      
        const list = this.reviewSubject.value;
      
        if (msg.action === 'create') {
          if (!list.find(r => r.id === msg.id)) {
            this.reviewSubject.next([msg, ...list]);
          }
        } else if (msg.action === 'update') {
          this.reviewSubject.next(list.map(r => r.id === msg.id ? msg : r));
        } else if (msg.action === 'delete') {
          this.reviewSubject.next(list.filter(r => r.id !== msg.id));
        }
      });      
  
      // 📦 Get initial review history
      this.stompClient.subscribe('/user/queue/review-history', (message: IMessage) => {
        const history: ReviewMessage[] = JSON.parse(message.body);
        this.reviewSubject.next(history);
      });
  
      // ⬇️ Send request for review history
      this.stompClient.publish({
        destination: '/app/history',
        body: String(productId),
      });
    };
  
    this.stompClient.activate();
  }  
  
  sendReview(formData: FormData): Observable<any> {
    return this.http.post('http://localhost:8080/review', formData); // Adjust URL as needed
  }

  getTop5StarReviews(): Observable<ReviewDTO[]> {
    return this.http.get<ReviewDTO[]>(`http://localhost:8080/review/top5star`);
  }

  getUserReviews(userId: number) {
    return this.http.get<ReviewDTO[]>(`http://localhost:8080/review/getallreviewbyid/${userId}`);
  }
  
}
