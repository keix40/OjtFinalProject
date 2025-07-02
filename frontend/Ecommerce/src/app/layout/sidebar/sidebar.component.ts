import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
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
    private authService: AuthService,
    public permissionService: PermissionService
  ) { }

  ngOnInit(): void {
    // Debug: log current permissions
    console.log('[Sidebar] Permissions:', this.permissionService.getPermissions());
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
