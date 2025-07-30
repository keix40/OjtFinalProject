import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationService, NotificationData } from '../services/notification.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: ` 
    <div *ngIf="notification" class="notification" [ngClass]="notification.type">
      <div class="notification-content">
        <span class="notification-icon">
          <ng-container [ngSwitch]="notification.type">
            
            <svg *ngSwitchCase="'success'" width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="9" stroke="#181818" stroke-width="2" fill="none"/>
              <path d="M6 10.5L9 13.5L14 7.5" stroke="#181818" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            
            <svg *ngSwitchCase="'error'" width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="9" stroke="#181818" stroke-width="2" fill="none"/>
              <path d="M7 7L13 13M13 7L7 13" stroke="#181818" stroke-width="2" stroke-linecap="round"/>
            </svg>
            
            <svg *ngSwitchCase="'warning'" width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="10,3 18,17 2,17" stroke="#181818" stroke-width="2" fill="none"/>
              <rect x="9" y="8" width="2" height="5" rx="1" fill="#181818"/>
              <rect x="9" y="15" width="2" height="2" rx="1" fill="#181818"/>
            </svg>
            
            <svg *ngSwitchDefault width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
             
              <path d="M12 2C8.13 2 5 5.13 5 9v3.5c0 1.5-.5 2.5-1 3.5h16c-.5-1-1-2-1-3.5V9c0-3.87-3.13-7-7-7z" stroke="#181818" stroke-width="2" fill="none"/>
              
              <path d="M8 16c0 2.21 1.79 4 4 4s4-1.79 4-4" stroke="#181818" stroke-width="2" fill="none"/>
             
              <circle cx="12" cy="18" r="1" fill="#181818"/>
              
              <circle cx="16" cy="6" r="2" fill="#181818"/>
            </svg>
          </ng-container>
        </span>
        <span *ngIf="notification?.link; else plainMessage">
          <a [routerLink]="notification.link" (click)="closeNotification()">{{ notification.message }}heheh</a>
        </span>
        <ng-template #plainMessage>{{ notification.message }}</ng-template>
        <button class="close-btn" (click)="closeNotification()">×</button>
      </div>
    </div> 
  `,
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit, OnDestroy {
  notification: NotificationData | null = null;
  private timeout: any;
  private subscription!: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.subscription = this.notificationService.notifications$.subscribe(notification => {
      this.notification = notification;
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => this.closeNotification()); // Auto-hide after 4 seconds
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  closeNotification() {
    this.notification = null;
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }
} 