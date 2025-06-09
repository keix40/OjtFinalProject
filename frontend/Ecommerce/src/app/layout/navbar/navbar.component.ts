import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  sidebarVisible: boolean = true;

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('d-none', !this.sidebarVisible);
    }
  }
}
