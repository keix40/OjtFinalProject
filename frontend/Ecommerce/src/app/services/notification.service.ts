import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

export interface NotificationData {
  message: string;
  link?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  timestamp?: string;
}

export interface Notification {
  id: number;
  recipientEmail: string;
  message: string;
  type?: string;
  category?: string;
  priority?: string;
  read: boolean;
  timestamp: string;
  link?: string;
  userType?: string; // Now expects string like "ADMIN", "MANAGER", etc.
  userEmail?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationSubject = new Subject<NotificationData>();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  get notifications$(): Observable<NotificationData> {
    return this.notificationSubject.asObservable();
  }

  show(notification: NotificationData) {
    const notificationWithTimestamp = {
      ...notification,
      timestamp: notification.timestamp || new Date().toISOString()
    };
    this.notificationSubject.next(notificationWithTimestamp);
  }

  showSuccess(message: string, link?: string) {
    this.show({ message, type: 'success', link, timestamp: new Date().toISOString() });
  }

  showError(message: string, link?: string) {
    this.show({ message, type: 'error', link, timestamp: new Date().toISOString() });
  }

  showInfo(message: string, link?: string) {
    this.show({ message, type: 'info', link, timestamp: new Date().toISOString() });
  }

  showWarning(message: string, link?: string) {
    this.show({ message, type: 'warning', link, timestamp: new Date().toISOString() });
  }


  // Get notifications specifically for admin users only
  getAdminOnlyNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${environment.apiUrl}/notifications/admin-only`);
  }

  // Role-based notification methods
  getNotificationsByRole(roleName: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${environment.apiUrl}/notifications/role/${roleName}`);
  }

  getNotificationsByRoleAndCategory(roleName: string, category: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${environment.apiUrl}/notifications/role/${roleName}/category/${category}`);
  }

  getNotificationsByRoleAndType(roleName: string, type: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${environment.apiUrl}/notifications/role/${roleName}/type/${type}`);
  }

  // Get notifications for current user based on their role
  getCurrentUserNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${environment.apiUrl}/notifications/current-user`);
  }

  // Get role-specific notifications based on current user's role
  getRoleSpecificNotifications(): Observable<Notification[]> {
    const roles = this.authService.getRoles();
    if (!roles || roles.length === 0) {
      return new Observable(subscriber => subscriber.next([]));
    }

    const primaryRole = roles[0]; // Use the first role as primary
    return this.getNotificationsByRole(primaryRole);
  }

  // Get notifications for specific categories based on role
  getRoleCategoryNotifications(category: string): Observable<Notification[]> {
    const roles = this.authService.getRoles();
    if (!roles || roles.length === 0) {
      return new Observable(subscriber => subscriber.next([]));
    }

    const primaryRole = roles[0];
    return this.getNotificationsByRoleAndCategory(primaryRole, category);
  }

  // Check if current user has specific role
  hasRole(roleName: string): boolean {
    const roles = this.authService.getRoles();
    // Strip ROLE_ prefix for comparison since backend uses raw role names
    const normalizedRoleName = roleName.startsWith('ROLE_') ? roleName.substring(5) : roleName;
    return roles.some(role => {
      const normalizedRole = role.startsWith('ROLE_') ? role.substring(5) : role;
      return normalizedRole === normalizedRoleName;
    });
  }

  // Get current user's primary role
  getCurrentUserPrimaryRole(): string | null {
    const roles = this.authService.getRoles();
    if (roles.length === 0) return null;
    // Strip ROLE_ prefix to match backend role names
    const primaryRole = roles[0];
    return primaryRole.startsWith('ROLE_') ? primaryRole.substring(5) : primaryRole;
  }

  // Get notifications based on role permissions
  getNotificationsByRolePermissions(): Observable<Notification[]> {
    const roles = this.authService.getRoles();
    if (!roles || roles.length === 0) {
      return new Observable(subscriber => subscriber.next([]));
    }

    const primaryRole = roles[0];
    
    // Define role-specific notification categories
    const roleCategories: { [key: string]: string[] } = {
      'ADMIN': ['order', 'support', 'urgent', 'general', 'admin_only', 'sales', 'warehouse'],
      'MANAGER': ['order', 'urgent'],
      'SALES/MARKETING': ['sales', 'urgent'],
      'CUSTOMER SUPPORT': ['support', 'urgent'],
      'WAREHOUSE STAFF': ['warehouse', 'urgent']
    };

    const allowedCategories = roleCategories[primaryRole] || ['urgent'];
    
    // Get notifications for allowed categories
    const observables = allowedCategories.map(category => 
      this.getNotificationsByRoleAndCategory(primaryRole, category)
    );

    return new Observable(subscriber => {
      // For now, just get the first category's notifications
      // You can enhance this to combine notifications from multiple categories
      observables[0].subscribe({
        next: (notifications) => subscriber.next(notifications),
        error: (error) => subscriber.error(error)
      });
    });
  }

  // Get notifications for current user with role-based filtering
  getCurrentUserRoleNotifications(): Observable<Notification[]> {
    // Use the correct endpoint that any authenticated user can access
    return this.http.get<Notification[]>(`${environment.apiUrl}/notifications/current-user/role-specific`);
  }

  // Get notifications for specific role with category filtering
  getRoleNotificationsWithCategories(roleName: string, categories: string[]): Observable<Notification[]> {
    const observables = categories.map(category => 
      this.getNotificationsByRoleAndCategory(roleName, category)
    );

    return new Observable(subscriber => {
      let allNotifications: Notification[] = [];
      let completedRequests = 0;
      
      observables.forEach(observable => {
        observable.subscribe({
          next: (notifications) => {
            allNotifications = allNotifications.concat(notifications);
            completedRequests++;
            
            if (completedRequests === observables.length) {
              const uniqueNotifications = this.removeDuplicateNotifications(allNotifications);
              subscriber.next(uniqueNotifications);
            }
          },
          error: (error) => {
            completedRequests++;
            if (completedRequests === observables.length) {
              subscriber.next(allNotifications);
            }
          }
        });
      });
    });
  }

  // Remove duplicate notifications based on ID
  private removeDuplicateNotifications(notifications: Notification[]): Notification[] {
    const seen = new Set();
    return notifications.filter(notification => {
      const duplicate = seen.has(notification.id);
      seen.add(notification.id);
      return !duplicate;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Create sample notifications for testing
  createSampleNotifications(): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/notifications/test/create-sample`, {});
  }

  // Delete notification
  deleteNotification(id: number): Observable<any> {
    return this.http.delete<any>(`/api/notifications/${id}`);
  }

  // Mark notification as read
  markAsRead(id: number): Observable<any> {
    return this.http.post<any>(`/api/notifications/${id}/read`, {});
  }

  // Mark notification as unread
  markAsUnread(id: number): Observable<any> {
    return this.http.post<any>(`/api/notifications/${id}/unread`, {});
  }

} 