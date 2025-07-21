import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotifcationService } from '../notifcation.service';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-notification-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-sidebar.component.html',
  styleUrl: './notification-sidebar.component.css'
})
export class NotificationSidebarComponent implements OnInit, OnDestroy {
  @Input() showNotificationSidebar = false;
  @Output() closeNotificationSidebar = new EventEmitter<void>();

   animationState: 'open' | 'closed' = 'closed';
  notifications: any[] = [];
  isClearing = false; // For clear animation
  private notifSub?: Subscription;
  private realtimeSub?: Subscription;

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  constructor(private notifService: NotifcationService,
     private router: Router,
  private route: ActivatedRoute,
  private authService: AuthService
  ) {}

  ngOnInit() {
    // Fetch stored notifications from backend
    setTimeout(() => this.animationState = 'open', 10);
    this.notifSub = this.notifService.getStoredNotifications().subscribe({
      next: (stored) => {
        this.notifications = (stored || [])
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 3)
          .map(n => ({
            ...n,
            title: n.title || 'Notification',
            time: this.formatTime(n.timestamp)
          }));
      },
      error: (err) => {
        console.error('Failed to fetch notifications:', err);
      }
    });

    
    // Subscribe to real-time notifications
    this.realtimeSub = this.notifService.notifications$.subscribe(notif => {
      const newNotif = {
        ...notif,
        title: notif.title || 'Notification',
        time: this.formatTime(notif.timestamp)
      };
      this.notifications = [newNotif, ...this.notifications]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 3);
    });
 
    
    
  }

  ngOnDestroy() {
    this.notifSub?.unsubscribe();
    this.realtimeSub?.unsubscribe();
  }

  markAllAsRead() {
    // Mark all as read in backend
    this.notifications.forEach(n => {
      if (!n.read && n.id) {
        this.notifService.markAsRead(n.id).subscribe({
          next: () => n.read = true,
          error: (err) => console.error('Failed to mark as read:', err)
        });
      }
    });
  }

  onClose() {
    this.closeNotificationSidebar.emit();
    this.animationState = 'closed';
    // Delay the actual closing so animation can complete
    setTimeout(() => this.closeNotificationSidebar.emit(), 300); // 300ms = duration of transition
  }

  // Add this method to clear notifications from the sidebar only
  clearAll() {
    this.isClearing = true;
    setTimeout(() => {
      this.notifications = [];
      this.isClearing = false;
    }, 400); // Match animation duration
  }

  private formatTime(timestamp: string | Date): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

 goToNotifications() {
    this.closeNotificationSidebar.emit();

    const userId = this.authService.getDecodedToken()?.id;
    if (!userId) {
      console.error('No user ID found in token');
      return;
    }

    this.router.navigate([`/profile/${userId}`], {
      queryParams: { section: 'notifications' }
    });
  }

  onNotificationClick(notification: any) {
  if (!notification.read && notification.id) {
    this.notifService.markAsRead(notification.id).subscribe({
      next: () => notification.read = true,
      error: (err) => console.error('Failed to mark as read:', err)
    });
    notification.read = true; // Optimistic UI
  }
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
}


} 