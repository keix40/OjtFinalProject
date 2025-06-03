import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

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
}

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
  standalone: false
})
export class UserProfileComponent implements OnInit {
  userDetails: UserDetails = {
    id: null, // Changed from userId to id
    name: null, // Changed from username to name
    email: null,
    gender: null, // Added gender
    dateOfBirth: null, // Added dateOfBirth (renamed from dateofbirth)
    phoneNumber: null, // Added missing property
    roles: []
  };

  activeSection: string = 'orders';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadUserDetails();
  }

  private loadUserDetails() {
    const decodedToken = this.authService.getDecodedToken();

    this.userDetails = {
      id: decodedToken?.id || null, // Changed from userId to id
      name: decodedToken?.name || null, // Get name from token
      email: decodedToken?.sub || null, // Assuming email is in 'sub'
      gender: decodedToken?.gender || null, // Get gender from token
      dateOfBirth: decodedToken?.dateofbirth || null, // Get dateofbirth from token (using token key name)
      phoneNumber: decodedToken?.phoneNumber || null, // Get phoneNumber from token
      roles: this.authService.getRoles()
    };
  }

  selectSection(section: string) {
    this.activeSection = section;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
} 