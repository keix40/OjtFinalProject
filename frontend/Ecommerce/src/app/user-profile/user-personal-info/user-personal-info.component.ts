import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { UserDetails } from '../user-details';

declare var bootstrap: any;
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

  selectedAvatarFile: File | null = null; //add for profile avatar by pmk june 13
  previewAvatarUrl: string | null = null;  //add for profile avatar by pmk june 13
  originalAvatarUrl: string | null = null;  //add for profile avatar by pmk june 13

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
        roles: decoded.roles ? decoded.roles.split(',') : [],
        profileImage: decoded.profileImage || '',
        phoneVerified: false,
      };
    }
    console.log('Details used to patch form:', details);
    if (details) {
      // Map phNumber to phoneNumber if needed
      if ((details as any).phNumber && !(details as any).phoneNumber) {
        (details as any).phoneNumber = (details as any).phNumber;
      }
      details.gender = details.gender?.toUpperCase() || '';
      this.originalAvatarUrl = details?.profileImage || null;
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
    if (this.isEditing) {
      this.originalAvatarUrl = this.userDetails?.profileImage || '';
    } else {
      this.previewAvatarUrl = null;
    }
    this.isEditing ? this.personalInfoForm.enable() : this.personalInfoForm.disable();
  }

  saveChanges(): void {
    if (!this.personalInfoForm.valid) return;
    const decoded = this.authService.getDecodedToken();
    if (!decoded || !decoded.id) return;

    const updateUser = (profileImageUrl: string | null) => {
    const updatedData: UserDetails = {
      id: decoded.id,
      name: this.personalInfoForm.get('name')?.value,
      email: this.personalInfoForm.get('email')?.value,
      gender: this.personalInfoForm.get('gender')?.value,
      dateOfBirth: this.personalInfoForm.get('dateOfBirth')?.value,
      phoneNumber: this.personalInfoForm.get('phoneNumber')?.value,
      roles: decoded.roles ? decoded.roles.split(',') : [],
      profileImage: profileImageUrl || this.userDetails?.profileImage || '',
    };

    // Short debug
    console.log('Updating user:', updatedData);

    this.authService.updateUserDetails(updatedData).subscribe({
      next: (response: any) => {
        if (response.token) this.authService.saveToken(response.token);
        if (response.user) this.userDetails = { ...this.userDetails, ...response.user };
      this.isEditing = false;
      this.originalAvatarUrl = this.userDetails?.profileImage || null;
        this.previewAvatarUrl = null;
        this.selectedAvatarFile = null;
        this.isEditing = false;
        this.originalDetails = { ...this.personalInfoForm.value };
      this.personalInfoForm.disable();
        this.router.navigate(['/profile', updatedData.id]);
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

// Rest of the method remains the same...
  if (this.selectedAvatarFile) {
    this.authService.uploadProfileImage(this.selectedAvatarFile).subscribe({
      next: (response: any) => {
        const newProfileImageUrl = response.profileImage || null;
        if (response.token) this.authService.saveToken(response.token);
        updateUser(newProfileImageUrl);
      },
      error: (err) => {
        console.error('Avatar upload failed:', err);
        alert('Failed to upload avatar image.');
      }
    });
  } else {
    updateUser(this.userDetails?.profileImage ||  null);
  }
}
cancelEdit(): void { //add for profile avatar by pmk june 13
    this.isEditing = false;
    this.previewAvatarUrl = null;
    if (this.originalDetails) this.patchForm(this.originalDetails);
    this.userDetails!.profileImage = this.originalAvatarUrl!;
    this.personalInfoForm.disable();
  }

  openEditAvatarModal(): void {
    const modal = new bootstrap.Modal(document.getElementById('editAvatarModal'));
    modal.show();
    setTimeout(() => {
      const firstButton = document.querySelector('#editAvatarModal .btn-primary');
      if (firstButton instanceof HTMLElement) {
        firstButton.focus();
      }
    }, 100);
  }

  closeModal(): void {
    const modal = bootstrap.Modal.getInstance(document.getElementById('editAvatarModal'));
    if (modal) {
      const focusedElement = document.activeElement as HTMLElement;
      if (focusedElement && focusedElement.closest('#editAvatarModal')) {
        focusedElement.blur();
      }
      modal.hide();
    }
  }

  triggerFileInput(fileInput: HTMLInputElement): void { //add for profile avatar by pmk june 13
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

  onViewProfile(): void { //add for profile avatar by pmk june 13
    const imageUrl = this.previewAvatarUrl || this.userDetails?.profileImage;
    if (imageUrl) window.open(imageUrl, '_blank');
  }

  shouldShowPhoneWarning(): boolean {
  const phoneControl = this.personalInfoForm?.get('phoneNumber');
  return !phoneControl?.value || phoneControl.value.trim() === '';
}

isPhoneEmpty(): boolean {
  const phone = this.personalInfoForm?.get('phoneNumber')?.value;
  return !phone || phone.trim() === '';
}

isPhoneUnverified(): boolean {
  return !this.isPhoneEmpty() && this.userDetails?.phoneVerified === false;
}
}
