import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router, ActivatedRoute, RouterModule, NavigationEnd } from '@angular/router';
import { UserPersonalInfoComponent } from './user-personal-info/user-personal-info.component';
import { OrderService } from '../services/order.service';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { UserNotificationsComponent } from './user-notifications/user-notifications.component';
import { UserCouponService } from '../services/user-coupon.service';
import { VipTierService, VipTierInfo } from '../services/vip-tier.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { filter, Subscription } from 'rxjs';
import { LuxTabItem } from '../shared/ui/lux-tabs.component';

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
export class UserProfileComponent implements OnInit, OnDestroy {
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
  accountTabs: LuxTabItem[] = [];

  breadcrumbItems = [
    { label: 'Home', link: '/home' },
    { label: 'Profile' }
  ];

  private routerSubscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private orderService: OrderService, // <-- Inject OrderService
    private userCouponService: UserCouponService, // <-- Inject UserCouponService
    private vipTierService: VipTierService, // <-- Inject VipTierService
    private http: HttpClient // <-- Inject HttpClient
  ) { }

  ngOnInit(): void {
    this.refreshAccountTabs();
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

    // Subscribe to router events to refresh data when navigating to user profile
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.url === '/user-profile') {
        console.log('Navigation to user profile detected, refreshing data...');
        this.loadUserDetails();
        this.loadOrderCount();
        this.loadCouponCount();
        this.loadVipTierInfo();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
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

  private refreshAccountTabs(): void {
    this.accountTabs = [
      { id: 'personal-info', label: 'Personal' },
      { id: 'orders', label: 'Orders', badge: this.orderCount || undefined },
      { id: 'payment', label: 'Payment' },
      { id: 'reviews', label: 'Reviews' },
      { id: 'addresses', label: 'Addresses' },
      { id: 'notifications', label: 'Notifications' },
      { id: 'coupons', label: 'Privileges', badge: this.couponCount || undefined },
    ];
  }

  loadOrderCount() {
    const user = this.authService.getDecodedToken();
    const userId = user ? user.id : null;
    if (!userId) {
      this.orderCount = 0;
      this.refreshAccountTabs();
      return;
    }
    this.orderService.getOrderByUserId(userId).subscribe({
      next: (orders) => {
        this.orderCount = Array.isArray(orders) ? orders.length : 0;
        this.refreshAccountTabs();
      },
      error: () => {
        this.orderCount = 0;
        this.refreshAccountTabs();
      }
    });
  }

  loadCouponCount() {
    const user = this.authService.getDecodedToken();
    const userId = user ? user.id : null;
    if (!userId) {
      this.couponCount = 0;
      this.refreshAccountTabs();
      return;
    }
    this.userCouponService.getUserCoupons(userId).subscribe({
      next: (coupons) => {
        this.couponCount = Array.isArray(coupons) ? coupons.length : 0;
        this.refreshAccountTabs();
      },
      error: () => {
        this.couponCount = 0;
        this.refreshAccountTabs();
      }
    });
  }

  loadVipTierInfo() {
    const user = this.authService.getDecodedToken();
    const userId = user ? user.id : null;
    
    console.log('Loading VIP tier info for user:', userId);
    console.log('Full user token:', user);
    
    if (!userId) {
      this.vipTierInfo = null;
      return;
    }

    // First get current total points from database, then get VIP tiers
    this.http.get<any>(`${environment.apiUrl}/auth/user/${userId}/total-points`).subscribe({
      next: (response: any) => {
        const totalPoints = response.totalPoints || 0;
        console.log('Current total points from database:', totalPoints);
        
        // Now get all VIP tiers and calculate tier info
        this.vipTierService.getAllVipTiers().subscribe({
          next: (allTiers) => {
            console.log('Loaded VIP tiers:', allTiers);
            console.log('Number of tiers loaded:', allTiers.length);
            console.log('Tier details:', allTiers.map(tier => ({ name: tier.name, minPoints: tier.minPoints })));
            
            if (allTiers.length === 0) {
              console.error('No VIP tiers loaded from database!');
              this.vipTierInfo = null;
              return;
            }
            
            this.vipTierInfo = this.vipTierService.calculateVipTierInfo(totalPoints, allTiers);
            console.log('Calculated VIP tier info:', this.vipTierInfo);
          },
          error: (error: any) => {
            console.error('Error loading VIP tiers:', error);
            this.vipTierInfo = null;
          }
        });
      },
      error: (error: any) => {
        console.error('Error loading user total points:', error);
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