import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private sessionId: string | null = null;
  private sessionTimeout: any;
  private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  constructor(private http: HttpClient) {
    this.initSession();
    // Ensure session is ended and sessionId is removed on tab close
    window.addEventListener('unload', () => {
      this.endSession();
    });
  }

  private initSession() {
    // Generate or retrieve session ID
    this.sessionId = localStorage.getItem('sessionId') || this.generateSessionId();
    localStorage.setItem('sessionId', this.sessionId);
    
    // Reset session timeout
    this.resetSessionTimeout();
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private resetSessionTimeout() {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
    this.sessionTimeout = setTimeout(() => {
      this.endSession();
    }, this.SESSION_TIMEOUT_MS);
  }

  startSession(userId?: number) {
    // Allow sessions for both authenticated and anonymous users
    const sessionUserId = userId || 0; // Use 0 for anonymous users

    const userAgent = navigator.userAgent;
    const ipAddress = '127.0.0.1'; // In production, get from server

    this.http.post('http://localhost:8080/api/auth/user/session/start', {
      userId: sessionUserId,
      sessionId: this.sessionId,
      userAgent,
      ipAddress
    }).subscribe({
      next: () => console.log('Session started successfully for user:', sessionUserId),
      error: (err) => console.error('Failed to start session:', err)
    });
  }

  recordPageView() {
    if (!this.sessionId) return;

    this.http.post('http://localhost:8080/api/auth/user/session/page-view', {
      sessionId: this.sessionId
    }).subscribe({
      next: () => console.log('Page view recorded'),
      error: (err) => console.error('Failed to record page view:', err)
    });

    // Reset session timeout on page view
    this.resetSessionTimeout();
  }

  endSession() {
    if (!this.sessionId) return;

    const url = 'http://localhost:8080/api/auth/user/session/end';
    const payload = JSON.stringify({ sessionId: this.sessionId });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, payload);
      localStorage.removeItem('sessionId');
      this.sessionId = null;
      console.log('Session ended using Beacon API');
    } else {
      this.http.post(url, { sessionId: this.sessionId }).subscribe({
        next: () => {
          console.log('Session ended successfully');
          localStorage.removeItem('sessionId');
          this.sessionId = null;
        },
        error: (err) => console.error('Failed to end session:', err)
      });
    }

    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  // Handle page unload
  handlePageUnload() {
    this.endSession();
  }
} 