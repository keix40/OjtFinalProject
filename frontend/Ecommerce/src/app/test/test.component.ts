import { Component } from '@angular/core';
import { NotificationService } from '../services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent {
  constructor(private notificationService: NotificationService) {}

  testSuccessNotification() {
    this.notificationService.showSuccess('This is a success notification!', '/dashboard');
  }

  testErrorNotification() {
    this.notificationService.showError('This is an error notification!');
  }

  testInfoNotification() {
    this.notificationService.showInfo('This is an info notification!', '/orders');
  }

  testWarningNotification() {
    this.notificationService.showWarning('This is a warning notification!');
  }

  testCustomNotification() {
    this.notificationService.show({
      message: 'This is a custom notification with a link!',
      type: 'success',
      link: '/profile/123'
    });
  }
}
