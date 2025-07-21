import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotifcationService } from './notifcation.service';
import { IpService } from './services/ip.service';
import { LoginAttemptsService } from './services/login-attempts.service';

import { NotificationSidebarService } from './notifcation-sidebar.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  showNotificationSidebar = false;
  title = 'Britium Gallary';

  toastMessage: string | null = null;
  toastTimeout: any = null;
  isToastClosing = false;
  lastToastNotification: any = null;
  newNotificationCount = 0;

  constructor(
    private notificationService: NotifcationService,
    private notificationSidebarService: NotificationSidebarService,
    private router: Router,
    private ipService: IpService,
    private loginAttemptsService: LoginAttemptsService
  ) {}

  ngOnInit() {
    const storedCount = localStorage.getItem('newNotificationCount');
  this.newNotificationCount = storedCount ? parseInt(storedCount, 10) : 0;
    this.notificationSidebarService.getSidebarState().subscribe(open => {
      this.showNotificationSidebar = open;
    });
    // Subscribe to notifications and show toast globally
    this.notificationService.notifications$.subscribe(notif => {
      this.newNotificationCount++;
      localStorage.setItem('newNotificationCount', this.newNotificationCount.toString());
      this.showToast(notif.message || 'You have a new notification!', notif);
    });

    this.ipService.getPublicIp().subscribe(ip => {
      if (ip) {
        this.loginAttemptsService.isIPBlocked(ip).subscribe(res => {
          if (res.blocked) {
            this.router.navigate(['/banned'], { queryParams: { until: res.blockedUntil } });

            
          }
        });
      }
    });
}

  showToast(message: string, notification: any = null) {
    this.toastMessage = message;
    this.lastToastNotification = notification;
    this.isToastClosing = false;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.closeToast();
    }, 5000);
  }

  closeToast(event?: MouseEvent) {
    if (event) {
      event.stopPropagation(); // Prevent click from triggering onToastClick
    }
    this.isToastClosing = true;
    setTimeout(() => {
      this.toastMessage = null;
      this.isToastClosing = false;
      this.lastToastNotification = null;
    }, 400); // Match fade-out duration
  }

  onToastClick() {
    if (!this.lastToastNotification) return;
    const notification = this.lastToastNotification;
    // Mark as read if needed
    if (!notification.read && notification.id && this.notificationService.markAsRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => notification.read = true,
        error: (err) => console.error('Failed to mark as read:', err)
      });
      notification.read = true; // Optimistic UI
    }
    // Handle link navigation
    if (notification.link) {
      if (notification.link.startsWith('http')) {
        window.open(notification.link, '_blank');
      } else {
        // Split path and query params
        const [path, queryString] = notification.link.split('?');
        if (queryString) {
          const queryParams: { [key: string]: string } = {};
          queryString.split('&').forEach((pair: string) => {
            const [key, value] = pair.split('=');
            queryParams[key] = value;
          });
          this.router.navigate([path], { queryParams });
        } else {
          this.router.navigate([notification.link]);
        }
      }
    }
    this.closeToast();
  }

  showToastOld(message: string) {
    // For legacy calls without notification object
    this.showToast(message, null);
  }

  closeNotificationSidebar() {
    this.notificationSidebarService.close();
  }
}
