import { Component, OnInit } from '@angular/core';
import { DiscountService } from '../services/discount.service';
import { NotificationService } from '../services/notification.service';
import { NotifcationService } from '../notifcation.service';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  constructor(
    private discountService: DiscountService,
    private notificationService: NotificationService,
    private notifcationService: NotifcationService
  ) {}

  ngOnInit(): void {
    this.showActiveDiscountNotification();
  }

  showActiveDiscountNotification() {
    this.discountService.getAllDiscount().subscribe(discounts => {
      const now = new Date();
      const activeDiscount = discounts.find(d =>
        d.status &&
        new Date(d.startDate) <= now &&
        new Date(d.endDate) >= now
      );
      if (activeDiscount) {
        let discountValueText = '';
        if (activeDiscount.discountType === 'PERCENTAGE') {
          const percent = (activeDiscount.discountValue <= 1 && activeDiscount.discountValue !== 0)
            ? activeDiscount.discountValue * 100
            : activeDiscount.discountValue;
          discountValueText = `${percent}% off`;
        } else {
          discountValueText = `${activeDiscount.discountValue} MMK off`;
        }
        
        const notificationMessage = `🔥 "${activeDiscount.name}" is live: ${discountValueText}! Click here to view products.`;
        
        // 1. Show pop-up notification
        this.notificationService.showInfo(
          notificationMessage,
          '/userproductlist'
        );
        
        // 2. Add to user's notification list
        const notificationData = {
          message: notificationMessage,
          timestamp: new Date().toISOString(),
          type: 'discount',
          link: '/userproductlist'
        };
        this.notifcationService.sendNotification(notificationData);
      }
    });
  }
}
