import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationSidebarService {
  private sidebarOpen$ = new BehaviorSubject<boolean>(false);

  open() {
    this.sidebarOpen$.next(true);
  }

  close() {
    this.sidebarOpen$.next(false);
  }

  getSidebarState(): Observable<boolean> {
    return this.sidebarOpen$.asObservable();
  }
} 