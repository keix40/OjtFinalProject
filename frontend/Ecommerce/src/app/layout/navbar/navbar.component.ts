import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  userName: string | null = null;
  userRoles: string[] = [];
  isLoggedIn: boolean = false;
  sidebarVisible: boolean = true;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserInfo();
  }

  private loadUserInfo() {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.userName = this.authService.getUsername();
      this.userRoles = this.authService.getRoles();
    }
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('d-none', !this.sidebarVisible);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateToProfile() {
    const userId = this.authService.getUserId();
    if (userId) {
      this.router.navigate(['/profile', userId], { queryParams: { section: 'personal-info' } });
    }
  }
}
