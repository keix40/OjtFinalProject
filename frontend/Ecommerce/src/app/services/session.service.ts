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
    
    // Also handle page visibility change (when user switches tabs)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // User left the page, but don't end session immediately
        // Just reset the timeout
        this.resetSessionTimeout();
      }
    });
  }

  private initSession() {
    // Check if existing session is valid
    const existingSessionId = localStorage.getItem('sessionId');
    const sessionStartTime = localStorage.getItem('sessionStartTime');
    
    if (existingSessionId && sessionStartTime) {
      const startTime = parseInt(sessionStartTime);
      const currentTime = Date.now();
      const sessionAge = currentTime - startTime;
      const maxAge = 30 * 60 * 1000; // 30 minutes
      
      // If session is expired, clear it
      if (sessionAge > maxAge) {
        console.log('Existing session expired, clearing...');
        localStorage.removeItem('sessionId');
        localStorage.removeItem('sessionStartTime');
        this.sessionId = this.generateSessionId();
      } else {
        this.sessionId = existingSessionId;
      }
    } else {
      this.sessionId = this.generateSessionId();
    }
    
    localStorage.setItem('sessionId', this.sessionId);
    localStorage.setItem('sessionStartTime', Date.now().toString());
    
    console.log('Session initialized with ID:', this.sessionId);
    
    // Reset session timeout
    this.resetSessionTimeout();
  }

  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const sessionId = `session_${timestamp}_${random}`;
    console.log('Generated new sessionId:', sessionId);
    return sessionId;
  }

  private resetSessionTimeout() {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
    this.sessionTimeout = setTimeout(() => {
      console.log('Session timeout reached, ending session');
      this.endSession();
    }, this.SESSION_TIMEOUT_MS);
  }

  startSession(userId?: number) {
    // Ensure sessionId is available
    if (!this.sessionId) {
      this.initSession();
    }

    // Double-check that sessionId is available
    if (!this.sessionId) {
      console.error('Failed to initialize sessionId');
      return;
    }

    // Allow sessions for both authenticated and anonymous users
    const sessionUserId = userId || 0; // Use 0 for anonymous users

    const userAgent = navigator.userAgent;
    const ipAddress = '127.0.0.1'; // In production, get from server

    // Create the request payload
    const payload = {
      userId: sessionUserId,
      sessionId: this.sessionId,
      userAgent: userAgent,
      ipAddress: ipAddress
    };

    console.log('Starting session with payload:', payload);

    this.http.post('http://localhost:8080/api/auth/user/session/start', payload).subscribe({
      next: (response) => {
        console.log('Session started successfully for user:', sessionUserId, 'Response:', response);
      },
      error: (err) => {
        console.error('Failed to start session:', err);
        console.error('Request payload was:', payload);
        console.error('SessionId value:', this.sessionId);
        
        // If the error is due to database constraint violation, regenerate sessionId
        if (err.error && err.error.error && 
            (err.error.error.includes('sessionId') || err.error.error.includes('constraint') || 
             err.error.error.includes('UKbjoac5vd2jt3pnrfrdeb49014'))) {
          console.log('Constraint violation detected, regenerating sessionId and retrying...');
          // Clear the problematic sessionId from localStorage
          localStorage.removeItem('sessionId');
          localStorage.removeItem('sessionStartTime');
          // Generate a completely new sessionId
          this.sessionId = this.generateSessionId();
          localStorage.setItem('sessionId', this.sessionId);
          localStorage.setItem('sessionStartTime', Date.now().toString());
          // Retry the request with new sessionId after a short delay
          setTimeout(() => {
            console.log('Retrying with new sessionId:', this.sessionId);
            this.startSession(userId);
          }, 200);
        }
      }
    });
  }

  recordPageView() {
    if (!this.sessionId) return;

    // Check if session is still valid before recording page view
    if (!this.isSessionValid()) {
      console.log('Session invalid, starting new session before recording page view');
      this.startSession();
      return;
    }

    this.http.post('http://localhost:8080/api/auth/user/session/page-view', {
      sessionId: this.sessionId
    }).subscribe({
      next: () => console.log('Page view recorded'),
      error: (err) => {
        console.error('Failed to record page view:', err);
        // If session doesn't exist on server, regenerate it
        if (err.status === 400 || err.status === 404) {
          console.log('Session not found on server, regenerating...');
          this.initSession();
        }
      }
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
      localStorage.removeItem('sessionStartTime');
      this.sessionId = null;
      console.log('Session ended using Beacon API');
    } else {
      this.http.post(url, { sessionId: this.sessionId }).subscribe({
        next: () => {
          console.log('Session ended successfully');
          localStorage.removeItem('sessionId');
          localStorage.removeItem('sessionStartTime');
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

  // Public method to ensure session is initialized
  ensureSessionInitialized(): void {
    if (!this.sessionId) {
      this.initSession();
    }
  }

  // Check if current session is still valid
  isSessionValid(): boolean {
    if (!this.sessionId) {
      return false;
    }
    
    // Check if session has expired (30 minutes)
    const sessionStart = localStorage.getItem('sessionStartTime');
    if (sessionStart) {
      const startTime = parseInt(sessionStart);
      const currentTime = Date.now();
      const sessionAge = currentTime - startTime;
      const maxAge = 30 * 60 * 1000; // 30 minutes in milliseconds
      
      if (sessionAge > maxAge) {
        console.log('Session expired, regenerating...');
        this.initSession();
        return false;
      }
    }
    
    return true;
  }

  // Test method to verify connection
  testConnection(): void {
    const testPayload = {
      test: true,
      timestamp: Date.now(),
      sessionId: this.sessionId || 'test_session'
    };

    console.log('Testing connection with payload:', testPayload);

    this.http.post('http://localhost:8080/api/auth/user/session/test', testPayload).subscribe({
      next: (response) => {
        console.log('Connection test successful:', response);
      },
      error: (err) => {
        console.error('Connection test failed:', err);
      }
    });
  }

  // Handle page unload
  handlePageUnload() {
    this.endSession();
  }
} 