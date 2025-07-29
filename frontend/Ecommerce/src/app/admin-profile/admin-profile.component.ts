import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { UserDetails } from '../user-profile/user-details';
import { ImageService } from '../services/image.service';

declare var bootstrap: any;

@Component({
  selector: 'app-admin-profile',
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.css'],
  standalone: false
})
export class AdminProfileComponent implements OnInit {
  adminDetails: UserDetails | null = null;
  personalInfoForm!: FormGroup;
  isEditing = false;
  originalDetails: UserDetails | null = null;
  selectedAvatarFile: File | null = null;
  previewAvatarUrl: string | null = null;
  originalAvatarUrl: string | null = null;
  showEditAvatarModal = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private imageService: ImageService
  ) { }

  ngOnInit(): void {
    this.buildForm();
    const decoded = this.authService.getDecodedToken();
    if (decoded) {
      this.adminDetails = {
        id: decoded.id || null,
        name: decoded.name || '',
        email: decoded.sub || '',
        gender: decoded.gender || '',
        dateOfBirth: decoded.dateofbirth || '',
        phoneNumber: decoded.phoneNumber || '',
        roles: decoded.roles ? decoded.roles.split(',') : [],
        profileImage: decoded.profileImage || '',
        phoneVerified: false,
      };
      this.originalAvatarUrl = this.adminDetails.profileImage || null;
      this.patchForm(this.adminDetails);
      this.originalDetails = { ...this.adminDetails };
    }
    this.personalInfoForm.disable();
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
    if (this.isEditing) {
      this.originalAvatarUrl = this.adminDetails?.profileImage || '';
    } else {
      this.previewAvatarUrl = null;
    }
    this.isEditing ? this.personalInfoForm.enable() : this.personalInfoForm.disable();
  }

  saveChanges(): void {
    if (!this.personalInfoForm.valid) return;
    const decoded = this.authService.getDecodedToken();
    if (!decoded || !decoded.id) return;

    const updateAdmin = (profileImageUrl: string | null) => {
      const updatedData: UserDetails = {
        id: decoded.id,
        name: this.personalInfoForm.get('name')?.value,
        email: this.personalInfoForm.get('email')?.value,
        gender: this.personalInfoForm.get('gender')?.value,
        dateOfBirth: this.personalInfoForm.get('dateOfBirth')?.value,
        phoneNumber: this.personalInfoForm.get('phoneNumber')?.value,
        roles: decoded.roles ? decoded.roles.split(',') : [],
        profileImage: profileImageUrl || this.adminDetails?.profileImage || '',
      };
      this.authService.updateUserDetails(updatedData).subscribe({
        next: (response: any) => {
          if (response.token) {
            this.authService.saveToken(response.token);
            // Immediately update adminDetails from new JWT
            const newDecoded = this.authService.getDecodedToken();
            if (newDecoded) {
              this.adminDetails = {
                id: newDecoded.id || null,
                name: newDecoded.name || '',
                email: newDecoded.sub || '',
                gender: newDecoded.gender || '',
                dateOfBirth: newDecoded.dateofbirth || '',
                phoneNumber: newDecoded.phoneNumber || '',
                roles: newDecoded.roles ? newDecoded.roles.split(',') : [],
                profileImage: newDecoded.profileImage || '',
                phoneVerified: false,
              };
              this.patchForm(this.adminDetails);
              this.originalDetails = { ...this.adminDetails };
            }
          }
          if (response.user) this.adminDetails = { ...this.adminDetails, ...response.user };
          this.isEditing = false;
          this.originalAvatarUrl = this.adminDetails?.profileImage || null;
          this.previewAvatarUrl = null;
          this.selectedAvatarFile = null;
          this.isEditing = false;
          this.personalInfoForm.disable();
        },
        error: (error) => {
          console.error('Update failed:', error);
          if (error.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      });
    };
    if (this.selectedAvatarFile) {
      this.authService.uploadProfileImage(this.selectedAvatarFile).subscribe({
        next: (response: any) => {
          const newProfileImageUrl = response.profileImage || null;
          if (response.token) this.authService.saveToken(response.token);
          updateAdmin(newProfileImageUrl);
        },
        error: (err) => {
          console.error('Avatar upload failed:', err);
          alert('Failed to upload avatar image.');
        }
      });
    } else {
      updateAdmin(this.adminDetails?.profileImage || null);
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.previewAvatarUrl = null;
    if (this.originalDetails) this.patchForm(this.originalDetails);
    if (this.adminDetails && this.originalAvatarUrl) this.adminDetails.profileImage = this.originalAvatarUrl;
    this.personalInfoForm.disable();
  }

  openEditAvatarModal(): void {
    this.showEditAvatarModal = true;
  }

  closeModal(): void {
    this.showEditAvatarModal = false;
  }

  triggerFileInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed!');
        return;
      }
      this.selectedAvatarFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.previewAvatarUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
      this.closeModal();
    }
  }

  onViewProfile(): void {
    const imageUrl = this.previewAvatarUrl || this.adminDetails?.profileImage;
    if (imageUrl) window.open(imageUrl, '_blank');
  }

  isPhoneEmpty(): boolean {
    const phone = this.personalInfoForm?.get('phoneNumber')?.value;
    return !phone || phone.trim() === '';
  }

  isPhoneUnverified(): boolean {
    return !this.isPhoneEmpty() && this.adminDetails?.phoneVerified === false;
  }

  getUserRolesDisplay(): string {
    if (this.adminDetails && this.adminDetails.roles && this.adminDetails.roles.length > 0) {
      return this.adminDetails.roles.map(role => role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()).join(', ');
    }
    return 'Admin';
  }

  getProfileImageUrl(): string {
    if (this.previewAvatarUrl) {
      return this.previewAvatarUrl;
    }
    if (this.adminDetails) {
      return this.imageService.getAvatarImageUrl(this.adminDetails);
    }
    return this.imageService.getAvatarImageUrl({});
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
