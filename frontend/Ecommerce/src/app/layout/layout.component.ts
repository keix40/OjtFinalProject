import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { BreadcrumbService } from '../breadcrumb.service';
import { AdminUserService } from '../services/admin-user.service';
import { AuthService } from '../auth/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AdminInboxComponent } from '../admin-inbox/admin-inbox.component';

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit, OnDestroy {
  @ViewChild(SidebarComponent) sidebarComponent!: SidebarComponent;
  @ViewChild(AdminInboxComponent) adminInboxComponent!: AdminInboxComponent;
  
  sidebarCollapsed: boolean = false;
  private lastActivityLog = 0;
  private activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
  private activityHandler = this.handleActivity.bind(this);
  private beforeUnloadHandler = this.handleBeforeUnload.bind(this);
  private navSub: any;

  constructor(
    public breadcrumbService: BreadcrumbService,
    private adminUserService: AdminUserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.activityEvents.forEach(event => window.addEventListener(event, this.activityHandler));
    this.navSub = this.router.events.subscribe(evt => {
      if (evt instanceof NavigationEnd) {
        this.handleActivity();
      }
    });
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  ngAfterViewInit(): void {
    // Listen to sidebar state changes
    if (this.sidebarComponent) {
      // Use a simple interval to check sidebar state
      setInterval(() => {
        if (this.sidebarComponent && this.sidebarCollapsed !== this.sidebarComponent.sidebarCollapsed) {
          this.sidebarCollapsed = this.sidebarComponent.sidebarCollapsed;
        }
      }, 100);
    }
  }

  ngOnDestroy(): void {
    this.activityEvents.forEach(event => window.removeEventListener(event, this.activityHandler));
    if (this.navSub) this.navSub.unsubscribe();
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);
  }

  handleActivity(): void {
    const now = Date.now();
    if (now - this.lastActivityLog > 30000) { // 30 seconds debounce
      const userId = this.authService.getUserId();
      if (userId) {
        this.adminUserService.logAdminActivity(userId, 'active').subscribe();
        this.lastActivityLog = now;
      }
    }
  }

  handleBeforeUnload(event: BeforeUnloadEvent): void {
    const userId = this.authService.getUserId();
    if (userId) {
      // Use navigator.sendBeacon for reliability on unload
      const url = 'http://localhost:8080/api/admin-users/activity';
      const data = JSON.stringify({ userId, type: 'logout' });
      navigator.sendBeacon(url, data);
    }
  }
}