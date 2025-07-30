import { Component, OnInit } from '@angular/core';
import { UserCouponService, UserCoupon } from '../../services/user-coupon.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-user-coupon-list',
  standalone: false,
  templateUrl: './user-coupon-list.component.html',
  styleUrl: './user-coupon-list.component.css'
})
export class UserCouponListComponent implements OnInit {
  coupons: UserCoupon[] = [];
  loading = false;
  error: string | null = null;
  userId: number | null = null;
  showCopyNotification = false;
  copyNotificationTimeout: any;
  isNotificationVisible = false;

  constructor(
    private userCouponService: UserCouponService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    if (this.userId) {
      this.loadUserCoupons();
    } else {
      this.error = 'User not authenticated';
    }
  }

  loadUserCoupons(): void {
    if (!this.userId) return;
    
    this.loading = true;
    this.error = null;
    
    this.userCouponService.getUserCoupons(this.userId).subscribe({
      next: (coupons) => {
        // Sort coupons: active first, then by status priority
        this.coupons = this.sortCoupons(coupons);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load coupons. Please try again.';
        this.loading = false;
        console.error('Error loading coupons:', err);
      }
    });
  }

  private sortCoupons(coupons: UserCoupon[]): UserCoupon[] {
    return coupons.sort((a, b) => {
      // Define status priority (lower number = higher priority)
      const statusPriority: { [key: string]: number } = {
        'ACTIVE': 1,
        'NOT_STARTED': 2,
        'INACTIVE': 3,
        'ALREADY_USED': 4,
        'EXPIRED': 5
      };

      const priorityA = statusPriority[a.couponStatus] || 6;
      const priorityB = statusPriority[b.couponStatus] || 6;

      return priorityA - priorityB;
    });
  }

  getDiscountDisplayValue(coupon: UserCoupon): string {
    if (coupon.discountType === 'PERCENTAGE') {
      // Backend now sends percentage as whole number (e.g., 10.0 for 10%)
      return `${Math.round(coupon.discountValue)}%`;
    } else {
      return `${coupon.discountValue} MMK`;
    }
  }

  getExpiryDate(coupon: UserCoupon): string {
    return new Date(coupon.endDate).toLocaleDateString();
  }

  isExpiringSoon(coupon: UserCoupon): boolean {
    const endDate = new Date(coupon.endDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  }

  copyCouponCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      // Clear any existing timeout
      if (this.copyNotificationTimeout) {
        clearTimeout(this.copyNotificationTimeout);
      }
      
      // Show notification
      this.showCopyNotification = true;
      this.isNotificationVisible = true;
      
      // Start fade out after 2 seconds
      this.copyNotificationTimeout = setTimeout(() => {
        this.isNotificationVisible = false;
        
        // Hide notification completely after fade out animation
        setTimeout(() => {
          this.showCopyNotification = false;
        }, 300);
      }, 2000);
    });
  }

  getExpiringSoonCount(): number {
    return this.coupons.filter(c => this.isExpiringSoon(c)).length;
  }

  getActiveCount(): number {
    return this.coupons.filter(c => c.couponStatus === 'ACTIVE').length;
  }

  getExpiredCount(): number {
    return this.coupons.filter(c => c.couponStatus === 'EXPIRED').length;
  }

  getUsedCount(): number {
    return this.coupons.filter(c => c.couponStatus === 'ALREADY_USED').length;
  }
}
