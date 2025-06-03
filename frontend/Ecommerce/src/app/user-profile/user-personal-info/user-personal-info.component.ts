import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { UserDetails } from '../user-details';

@Component({
  selector: 'app-user-personal-info',
  standalone: false,
  templateUrl: './user-personal-info.component.html',
  styleUrl: './user-personal-info.component.css'
})
export class UserPersonalInfoComponent implements OnInit, OnChanges {
  @Input() userDetails: UserDetails | null = null;

  personalInfoForm!: FormGroup;
  isEditing = false;
  originalDetails: UserDetails | null = null; // To store original data for canceling edits

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.buildForm();
    let details = this.userDetails;
    const decoded = this.authService.getDecodedToken();
    console.log('Decoded JWT:', decoded);
    if (!details && decoded) {
      details = {
        name: decoded.name || '',
        email: decoded.sub || '',
        gender: decoded.gender || '',
        dateOfBirth: decoded.dateofbirth || '',
        phoneNumber: decoded.phoneNumber || '',
        roles: decoded.roles ? decoded.roles.split(',') : []
      };
    }
    console.log('Details used to patch form:', details);
    if (details) {
      // Map phNumber to phoneNumber if needed
      if ((details as any).phNumber && !(details as any).phoneNumber) {
        (details as any).phoneNumber = (details as any).phNumber;
      }
      this.patchForm(details);
      this.originalDetails = { ...details };
    }
    this.personalInfoForm.disable(); // Always disable after patching so fields are read-only
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.personalInfoForm) {
      this.buildForm();
    }
    if (changes['userDetails'] && this.userDetails) {
      if ((this.userDetails as any).phNumber && !(this.userDetails as any).phoneNumber) {
        (this.userDetails as any).phoneNumber = (this.userDetails as any).phNumber;
      }
      this.patchForm(this.userDetails);
      this.originalDetails = { ...this.userDetails };
    }
  }

  buildForm(): void {
    this.personalInfoForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      gender: [''],
      dateOfBirth: [''],
      phoneNumber: ['']
    });
  }

  patchForm(details: UserDetails): void {
    this.personalInfoForm.patchValue(details);
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    this.isEditing ? this.personalInfoForm.enable() : this.personalInfoForm.disable();
  }

  saveChanges(): void {
    if (!this.personalInfoForm.valid) return;
    const decoded = this.authService.getDecodedToken();
    if (!decoded || !decoded.id) return;

    const updatedData: UserDetails = {
      id: decoded.id,
      name: this.personalInfoForm.get('name')?.value,
      email: this.personalInfoForm.get('email')?.value,
      gender: this.personalInfoForm.get('gender')?.value,
      dateOfBirth: this.personalInfoForm.get('dateOfBirth')?.value,
      phoneNumber: this.personalInfoForm.get('phoneNumber')?.value,
      roles: decoded.roles ? decoded.roles.split(',') : []
    };

    // Short debug
    console.log('Updating user:', updatedData);

    this.authService.updateUserDetails(updatedData).subscribe({
      next: (response: any) => {
        if (response.token) this.authService.saveToken(response.token);
        if (response.user) this.userDetails = { ...this.userDetails, ...response.user };
        this.isEditing = false;
        this.originalDetails = { ...this.personalInfoForm.value };
        this.personalInfoForm.disable();
        this.router.navigate(['/profile', updatedData.id]).then(() => {
           window.location.reload();
         });
      },
      error: (error) => {
        console.error('Update failed:', error);
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    if (this.originalDetails) {
      this.patchForm(this.originalDetails); // Reset form to original values
    }
    this.personalInfoForm.disable();
  }
}

  
 

