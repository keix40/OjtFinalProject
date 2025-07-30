import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminInboxService } from '../services/admin-inbox.service';
import { Subscription } from 'rxjs';
import { NotificationService } from '../services/notification.service';

interface InboxMessage {
  id: number;
  subject: string;
  sender: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  type?: string;
}

interface GroupedLoginAttempt {
  id: number;
  subject: string;
  sender: string;
  attempts: { timestamp: Date, content: string }[];
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  type: string;
}

@Component({
  selector: 'app-admin-inbox',
  standalone: false,
  templateUrl: './admin-inbox.component.html',
  styleUrl: './admin-inbox.component.css'
})
export class AdminInboxComponent implements OnInit, OnDestroy {
  showModal: boolean = false;
  selectedMessage: InboxMessage | null = null;
  messages: InboxMessage[] = [];
  dynamicNotifications: InboxMessage[] = [];
  unifiedMessages: InboxMessage[] = [];
  filteredMessages: InboxMessage[] = [];

  // Filter properties
  searchTerm: string = '';
  categoryFilter: string = 'all';
  priorityFilter: string = 'all';
  readFilter: string = 'all';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  private subscription: Subscription = new Subscription();

  constructor(
    private adminInboxService: AdminInboxService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Remove mock messages from admin inbox - only show role-based notifications
    // this.loadMockMessages(); // Commented out - admin inbox should only show role notifications
    this.loadAdminLoginNotifications();
    this.applyFilters();
    
    // Log current user's role for debugging
    console.log('Current user roles:', this.notificationService.getCurrentUserPrimaryRole());
    console.log('Is admin?', this.notificationService.hasRole('ADMIN'));
    console.log('Is manager?', this.notificationService.hasRole('MANAGER'));
    console.log('Is Sales/Marketing?', this.notificationService.hasRole('SALES/MARKETING'));
    console.log('Is CustomerSupport?', this.notificationService.hasRole('CUSTOMER SUPPORT'));
    console.log('Is WarehousrStaff?', this.notificationService.hasRole('WAREHOUSE STAFF'));
    
    // Subscribe to modal open requests
    this.subscription.add(
      this.adminInboxService.openModal$.subscribe(() => {
        this.openModal();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadMockMessages(): void {
    this.messages = [
      {
        id: 1,
        subject: 'Order #12345 - Payment Issue',
        sender: 'customer@example.com',
        content: 'I\'m having trouble with my payment for order #12345. The payment was deducted but the order shows as pending.',
        timestamp: new Date('2024-01-15T10:30:00'),
        isRead: false,
        priority: 'high',
        category: 'order'
      },
      {
        id: 2,
        subject: 'Product Return Request',
        sender: 'user@example.com',
        content: 'I would like to return the product I received. It arrived damaged and doesn\'t match the description.',
        timestamp: new Date('2024-01-15T09:15:00'),
        isRead: true,
        priority: 'medium',
        category: 'support'
      },
      {
        id: 3,
        subject: 'Website Bug Report',
        sender: 'developer@example.com',
        content: 'Found a bug in the checkout process. Users are unable to proceed after entering shipping information.',
        timestamp: new Date('2024-01-15T08:45:00'),
        isRead: false,
        priority: 'high',
        category: 'urgent'
      },
      {
        id: 4,
        subject: 'General Inquiry',
        sender: 'visitor@example.com',
        content: 'I\'m interested in becoming a vendor on your platform. What are the requirements and process?',
        timestamp: new Date('2024-01-14T16:20:00'),
        isRead: true,
        priority: 'low',
        category: 'general'
      },
      {
        id: 5,
        subject: 'Account Suspension Appeal',
        sender: 'seller@example.com',
        content: 'My account was suspended yesterday. I believe this was done in error and would like to appeal this decision.',
        timestamp: new Date('2024-01-14T14:30:00'),
        isRead: false,
        priority: 'high',
        category: 'urgent'
      }
    ];
    this.updateUnifiedMessages();
  }

  loadAdminLoginNotifications(): void {
    // Get role-specific notifications based on current user's role
    console.log('=== DEBUG: loadAdminLoginNotifications ===');
    console.log('Loading role-based notifications...');
    
    // Log current user info
    const currentUser = this.notificationService.getCurrentUserPrimaryRole();
    console.log('Current user primary role:', currentUser);
    console.log('Is admin?', this.notificationService.hasRole('ADMIN'));
    console.log('Is manager?', this.notificationService.hasRole('MANAGER'));
    console.log('Is Sales/Marketing?', this.notificationService.hasRole('SALES/MARKETING'));
    console.log('Is CustomerSupport?', this.notificationService.hasRole('CUSTOMER SUPPORT'));
    console.log('Is WarehouseStaff?', this.notificationService.hasRole('WAREHOUSE STAFF'));
    
    // Check if user is admin - only admin users should see login attempts
    const isAdmin = this.notificationService.hasRole('ADMIN');
    console.log('User is admin:', isAdmin);
    
    // If user is admin, use admin-only notifications
    if (isAdmin) {
      console.log('Loading admin-only notifications...');
      this.notificationService.getAdminOnlyNotifications().subscribe(
        (notifications) => {
          console.log('Received admin-only notifications:', notifications);
          console.log('Notifications length:', notifications?.length || 0);
          
          if (!notifications || notifications.length === 0) {
            console.log('No admin notifications received');
            console.log('This might mean:');
            console.log('1. No notifications were sent to admin users');
            console.log('2. The admin-only endpoint is not working correctly');
            return;
          }
          
          const roleMessages: InboxMessage[] = (notifications || []).map((notif, idx) => ({
            id: notif.id,
            subject: this.getNotificationSubject(notif.type || 'notification'),
            sender: notif.recipientEmail || 'System',
            content: notif.message,
            timestamp: notif.timestamp ? new Date(notif.timestamp) : new Date(),
            isRead: notif.read || false,
            priority: this.getNotificationPriority(notif.priority || 'medium'),
            category: notif.category || 'general',
            type: notif.type || 'notification',
          }));
          console.log('Processed admin messages:', roleMessages);
          this.dynamicNotifications = roleMessages;
          this.updateUnifiedMessages();
        },
        (error) => {
          console.error('Failed to load admin-only notifications', error);
          console.error('Error details:', error);
        }
      );
    } else {
      // For non-admin users, use role-based notifications
      console.log('Loading role-specific notifications for non-admin user...');
      console.log('Current user role:', currentUser);
      console.log('User has MANAGER role:', this.notificationService.hasRole('MANAGER'));
      
      this.notificationService.getCurrentUserRoleNotifications().subscribe(
      (notifications) => {
          console.log('Received role-based notifications:', notifications);
          console.log('Notifications length:', notifications?.length || 0);
          
          if (!notifications || notifications.length === 0) {
            console.log('No notifications received for non-admin user');
            console.log('This might mean:');
            console.log('1. No users with this role exist in the database');
            console.log('2. No notifications were sent to users with this role');
            console.log('3. The role name mismatch between frontend and backend');
            console.log('4. The current-user/role-specific endpoint is not working');
            return;
          }
          
          const roleMessages: InboxMessage[] = (notifications || []).map((notif, idx) => ({
          id: notif.id,
            subject: this.getNotificationSubject(notif.type || 'notification'),
          sender: notif.recipientEmail || 'System',
          content: notif.message,
          timestamp: notif.timestamp ? new Date(notif.timestamp) : new Date(),
          isRead: notif.read || false,
            priority: this.getNotificationPriority(notif.priority || 'medium'),
            category: notif.category || 'general',
            type: notif.type || 'notification',
          }));
          console.log('Processed role messages:', roleMessages);
          this.dynamicNotifications = roleMessages;
          this.updateUnifiedMessages();
      },
      (error) => {
          console.error('Failed to load role-specific notifications', error);
          console.error('Error details:', error);
        }
      );
    }
    console.log('=== END DEBUG: loadAdminLoginNotifications ===');
  }

  // Helper method to get notification subject based on type
  private getNotificationSubject(type: string): string {
    switch (type) {
      case 'login_attempt':
        return 'Login Attempt';
      case 'order_created':
        return 'New Order';
      case 'order_updated':
        return 'Order Update';
      case 'support_request':
        return 'Support Request';
      case 'low_stock':
        return 'Low Stock Alert';
      case 'discount_applied':
        return 'Discount Applied';
      case 'refund_request':
        return 'Refund Request';
      case 'review_submitted':
        return 'New Review Submitted';
      default:
        return 'Notification';
    }
  }

  // Helper method to get notification priority
  private getNotificationPriority(priority: string): 'low' | 'medium' | 'high' {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'high';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  }

  updateUnifiedMessages(): void {
    // Only use role-based notifications for admin inbox - remove mock messages
    this.unifiedMessages = [...this.dynamicNotifications].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
    this.applyFilters();
  }

  openModal(): void {
    this.showModal = true;
    this.updateUnifiedMessages();
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedMessage = null;
  }

  selectMessage(message: InboxMessage): void {
    this.selectedMessage = message;
    if (!message.isRead) {
      message.isRead = true;
    }
  }

  applyFilters(): void {
    let filtered = this.unifiedMessages.filter(message => {
      const matchesSearch = message.subject.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        message.sender.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        message.content.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesCategory = this.categoryFilter === 'all' || message.category === this.categoryFilter;
      const matchesPriority = this.priorityFilter === 'all' || message.priority === this.priorityFilter;
      const matchesRead = this.readFilter === 'all' ||
        (this.readFilter === 'read' && message.isRead) ||
        (this.readFilter === 'unread' && !message.isRead);
      return matchesSearch && matchesCategory && matchesPriority && matchesRead;
    });
    this.filteredMessages = filtered;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredMessages.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages) || 1;
  }

  get paginatedMessages(): InboxMessage[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredMessages.slice(startIndex, endIndex);
  }

  get unreadCount(): number {
    return this.unifiedMessages.filter(m => !m.isRead).length;
  }

  get totalMessages(): number {
    return this.filteredMessages.length;
  }

  markAsRead(message: InboxMessage): void {
    message.isRead = true;
  }

  markAsUnread(message: InboxMessage): void {
    message.isRead = false;
  }

  deleteMessage(message: InboxMessage): void {
    // Only handle dynamic notifications since mock messages are not shown in admin inbox
    this.dynamicNotifications = this.dynamicNotifications.filter(m => m.id !== message.id);
    if (this.selectedMessage?.id === message.id) {
      this.selectedMessage = null;
    }
    this.updateUnifiedMessages();
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'support': return 'help-circle';
      case 'order': return 'shopping-bag';
      case 'urgent': return 'alert-triangle';
      case 'general': return 'message-circle';
      default: return 'mail';
    }
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }

  extractIPAddress(content: string): string {
    const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/;
    const match = content.match(ipRegex);
    return match ? match[0] : 'Unknown IP';
  }

  refreshNotifications(): void {
    console.log('Refreshing notifications...');
    this.loadAdminLoginNotifications();
  }

  createSampleNotifications(): void {
    console.log('Creating sample notifications for testing...');
    this.notificationService.createSampleNotifications().subscribe({
      next: (response: any) => {
        console.log('Sample notifications created:', response);
        this.refreshNotifications();
      },
      error: (error: any) => {
        console.error('Failed to create sample notifications:', error);
      }
    });
  }
}