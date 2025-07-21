import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface NotificationData {
  message: string;
  link?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationSubject = new Subject<NotificationData>();

  get notifications$(): Observable<NotificationData> {
    return this.notificationSubject.asObservable();
  }

  show(notification: NotificationData) {
    this.notificationSubject.next(notification);
  }

  showSuccess(message: string, link?: string) {
    this.show({ message, type: 'success', link });
  }

  showError(message: string, link?: string) {
    this.show({ message, type: 'error', link });
  }

  showInfo(message: string, link?: string) {
    this.show({ message, type: 'info', link });
  }

  showWarning(message: string, link?: string) {
    this.show({ message, type: 'warning', link });
  }
} 