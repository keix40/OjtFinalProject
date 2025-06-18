import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  isProductsOpen = false;
  isUsersOpen: boolean = false;
  isOrdersOpen: boolean = false;
  isContentOpen: boolean = false;
  isSettingsOpen: boolean = false;
  // Add to your component
  totalCustomers: number = 0;
  vipCount: number = 0;
  blacklistCount: number = 0;
  adminCount: number = 0;
  suspiciousLogins: number = 0;
  recentSecurityEvents: number = 0;

  // Fetch these values from your backend

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
