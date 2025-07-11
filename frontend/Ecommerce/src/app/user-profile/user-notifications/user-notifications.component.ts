import { Component, OnInit, HostListener } from '@angular/core';
import { NotifcationService } from '../../notifcation.service';


@Component({
  selector: 'app-user-notifications',
  standalone: false,
  templateUrl: './user-notifications.component.html',
  styleUrls: ['./user-notifications.component.css']
})
export class UserNotificationsComponent implements OnInit {
  notifications: any[] = [];

  constructor(private notificationService: NotifcationService) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('.menu-container, .menu-btn')) {
      this.closeAllMenus();
    }
  }

  ngOnInit() {
    this.notificationService.getStoredNotifications().subscribe({
      next: (stored) => {
        this.notifications = (stored || []).map(n => ({
          ...n,
          formattedTimestamp: this.formatTimestamp(n.timestamp),
          showMenu: false
        }));
      },
      error: (err) => {
        console.error('Failed to fetch stored notifications:', err);
      }
    });

    this.notificationService.notifications$.subscribe(notif => {
      const newNotif = {
        ...notif,
        formattedTimestamp: this.formatTimestamp(notif.timestamp),
        showMenu: false
      };
      this.notifications.unshift(newNotif);
    });
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  deleteNotification(id: number, event: MouseEvent): void {
    event.stopPropagation();

    this.notificationService.deleteNotification(id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== id);
      },
      error: (err) => {
        console.error('Failed to delete notification:', err);
      }
    });
  }

  markAsRead(notification: any): void {
    if (notification.read || (event?.target as HTMLElement)?.closest('.menu-container')) {
      return;
    }

    this.notificationService.markAsRead(notification.id).subscribe({
      next: (updatedNotification) => {
        const index = this.notifications.findIndex(n => n.id === notification.id);
        if (index > -1) {
          this.notifications[index].read = true;
        }
      },
      error: (err) => {
        console.error('Failed to mark notification as read:', err);
      }
    });
  }

  toggleMenu(notification: any, event: MouseEvent): void {
    event.stopPropagation();
    const currentState = notification.showMenu;
    this.closeAllMenus();
    notification.showMenu = !currentState;
  }

  closeAllMenus(): void {
    this.notifications.forEach(n => n.showMenu = false);
  }

  formatTimestamp(timestamp: string): string {
    if (!timestamp) return '';

    const now = new Date();
    const notifDate = new Date(timestamp);
    const diffSeconds = Math.floor((now.getTime() - notifDate.getTime()) / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {
      return "0 min ago";
    }
    if (diffHours < 1) {
      return `${diffMinutes} min ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} hr ago`;
    }
    if (diffDays === 1) {
      return "yesterday";
    }
    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }

    return notifDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }
}
