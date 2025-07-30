import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { UserPersonalInfoComponent } from './user-personal-info/user-personal-info.component';
import { OrderService } from '../services/order.service';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { UserNotificationsComponent } from './user-notifications/user-notifications.component';
import { UserCouponService } from '../services/user-coupon.service';
import { VipTierService, VipTierInfo } from '../services/vip-tier.service';
import { HttpClient } from '@angular/common/http';

// Updated interface to match UserPersonalInfoComponent's expected type
interface UserDetails {
  id?: number | null;
  name: string | null;
  email: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  phoneNumber: string | null;
  password?: string | null;
  roles?: string[];
  profileImage?: string|null;
  totalPoints?: number;
}

@Component({
  selector: 'app-user-profile',
  standalone: false,
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  userDetails: UserDetails = {
    id: null, // Changed from userId to id
    name: null, // Changed from username to name
    email: null,
    gender: null, // Added gender
    dateOfBirth: null, // Added dateOfBirth (renamed from dateofbirth)
    phoneNumber: null, // Added missing property
    roles: [],
    profileImage: null,
  };

  activeSection: string = 'orders';
  orderCount: number = 0; // <-- Add this
  couponCount: number = 0; // <-- Add this
  vipTierInfo: VipTierInfo | null = null;

  breadcrumbItems = [
    { label: 'Home', link: '/home' },
    { label: 'Profile' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private orderService: OrderService, // <-- Inject OrderService
    private userCouponService: UserCouponService, // <-- Inject UserCouponService
    private vipTierService: VipTierService, // <-- Inject VipTierService
  ) { }

  ngOnInit(): void {
    this.loadUserDetails();
    this.loadOrderCount(); // <-- Load order count on init
    this.loadCouponCount(); // <-- Load coupon count on init
    this.loadVipTierInfo(); // <-- Load VIP tier info on init
    // Get section from query params
    this.route.queryParams.subscribe(params => {
      if (params['section']) {
        this.activeSection = params['section'];
      }
    });
  }

  private loadUserDetails() {
    const decodedToken = this.authService.getDecodedToken();
    const backendBaseUrl = 'http://localhost:8080';                     //add For profile by PMK (June 11)
const rawImagePath = decodedToken?.profileImage || '/upload/defaultProfile.png';
const fullImageUrl = backendBaseUrl + rawImagePath;

    this.userDetails = {
      id: decodedToken?.id || null, // Changed from userId to id
      name: decodedToken?.name || null, // Get name from token
      email: decodedToken?.sub || null, // Assuming email is in 'sub'
      gender: decodedToken?.gender || null, // Get gender from token
      dateOfBirth: decodedToken?.dateofbirth || null, // Get dateofbirth from token (using token key name)
      phoneNumber: decodedToken?.phoneNumber || null, // Get phoneNumber from token
      profileImage: fullImageUrl,
      roles: this.authService.getRoles(),
      totalPoints: decodedToken?.totalPoints || 0
    };
  }

  loadOrderCount() {
    const user = this.authService.getDecodedToken();
    const userId = user ? user.id : null;
    if (!userId) {
      this.orderCount = 0;
      return;
    }
    this.orderService.getOrderByUserId(userId).subscribe({
      next: (orders) => {
        this.orderCount = Array.isArray(orders) ? orders.length : 0;
      },
      error: () => {
        this.orderCount = 0;
      }
    });
  }

  loadCouponCount() {
    const user = this.authService.getDecodedToken();
    const userId = user ? user.id : null;
    if (!userId) {
      this.couponCount = 0;
      return;
    }
    this.userCouponService.getUserCoupons(userId).subscribe({
      next: (coupons) => {
        this.couponCount = Array.isArray(coupons) ? coupons.length : 0;
      },
      error: () => {
        this.couponCount = 0;
      }
    });
  }

  loadVipTierInfo() {
    const user = this.authService.getDecodedToken();
    const userId = user ? user.id : null;
    const totalPoints = user ? (user.totalPoints || 0) : 0;
    
    console.log('Loading VIP tier info for user:', userId, 'with points:', totalPoints);
    console.log('Full user token:', user);
    
    if (!userId) {
      this.vipTierInfo = null;
      return;
    }

    // First get all VIP tiers, then calculate the user's tier info
    this.vipTierService.getAllVipTiers().subscribe({
      next: (allTiers) => {
        console.log('Loaded VIP tiers:', allTiers);
        this.vipTierInfo = this.vipTierService.calculateVipTierInfo(totalPoints, allTiers);
        console.log('Calculated VIP tier info:', this.vipTierInfo);
      },
      error: (error) => {
        console.error('Error loading VIP tiers:', error);
        this.vipTierInfo = null;
      }
    });
  }

  selectSection(section: string) {
    this.activeSection = section;
    // Update URL with the selected section
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { section: section },
      queryParamsHandling: 'merge'
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}