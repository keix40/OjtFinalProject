# Notification System Usage Guide

## Overview
The notification system provides a centralized way to display user-friendly notifications at the top-middle of the website. It can be triggered from anywhere in the application.

## How to Use

### 1. Import the NotificationService
```typescript
import { NotificationService } from '../services/notification.service';
```

### 2. Inject the service in your component
```typescript
constructor(private notificationService: NotificationService) {}
```

### 3. Show notifications

#### Basic usage:
```typescript
// Success notification
this.notificationService.showSuccess('Operation completed successfully!');

// Error notification
this.notificationService.showError('Something went wrong!');

// Info notification
this.notificationService.showInfo('Here is some information.');

// Warning notification
this.notificationService.showWarning('Please check your input.');
```

#### With links:
```typescript
// Success with link
this.notificationService.showSuccess('Order placed! View details', '/orders/123');

// Info with link
this.notificationService.showInfo('New message received', '/messages');
```

#### Custom notification:
```typescript
this.notificationService.show({
  message: 'Custom notification message',
  type: 'success', // 'success', 'error', 'info', 'warning'
  link: '/optional-link' // optional
});
```

## Features

- **Auto-hide**: Notifications automatically disappear after 4 seconds
- **Manual close**: Users can click the × button to close notifications
- **Links**: Clickable links open in new tabs
- **Responsive**: Works on all device sizes
- **Types**: 4 different types with color coding
  - Success (green)
  - Error (red)
  - Info (blue)
  - Warning (orange)

## Examples in Your Code

### Replacing alerts:
```typescript
// Old way
alert('Operation successful');

// New way
this.notificationService.showSuccess('Operation successful');
```

### Error handling:
```typescript
this.someService.doSomething().subscribe({
  next: (result) => {
    this.notificationService.showSuccess('Operation completed successfully!');
  },
  error: (error) => {
    this.notificationService.showError('Failed to complete operation');
  }
});
```

### Form validation:
```typescript
if (this.form.invalid) {
  this.notificationService.showWarning('Please fill in all required fields');
  return;
}
```

## Testing
Visit `/test` route to test all notification types with the provided test buttons. 