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
  sidebarVisible: boolean = true;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Navbar initialization
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
    window.dispatchEvent(new CustomEvent('admin-rail-toggle'));
  }
}
