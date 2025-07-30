import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class UserActivityService {
  constructor(private http: HttpClient) {}

  logPageView(userId: number) {
    if (!userId) {
      console.warn('UserActivityService: No userId provided for page view log.');
      return;
    }
    console.log('UserActivityService: Logging page view for user:', userId);
    this.http.post('http://localhost:8080/api/auth/user/user/activity', { userId, type: 'page_view' })
      .subscribe({
        next: () => console.log('UserActivityService: Page view logged successfully.'),
        error: (err) => console.error('UserActivityService: Failed to log page view:', err)
      });
  }
} 