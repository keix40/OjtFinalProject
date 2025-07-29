import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { UserPersonalInfoComponent } from './user-personal-info/user-personal-info.component';
import { OrderService } from '../services/order.service';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { UserNotificationsComponent } from './user-notifications/user-notifications.component';

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

  breadcrumbItems = [
    { label: 'Home', link: '/home' },
    { label: 'Profile' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private orderService: OrderService // <-- Inject OrderService
  ) { }

  ngOnInit(): void {
    this.loadUserDetails();
    this.loadOrderCount(); // <-- Load order count on init
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
      roles: this.authService.getRoles()
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