import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { UserDetails } from '../user-details';
import { HttpClient } from '@angular/common/http';

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
  otpForm!: FormGroup;
  isEditing = false;
  originalDetails: UserDetails | null = null; // To store original data for canceling edits

  selectedAvatarFile: File | null = null; //add for profile avatar by pmk june 13
  previewAvatarUrl: string | null = null;  //add for profile avatar by pmk june 13
  originalAvatarUrl: string | null = null;  //add for profile avatar by pmk june 13

  // Phone verification properties
  isSendingOtp = false;
  isVerifyingOtp = false;
  isResendingOtp = false;
  hasOtpSent = false;
  otpMessage = '';
  otpSuccess = false;
  currentPhoneNumber = '';

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService, 
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.buildForm();
    this.buildOtpForm();
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

  buildOtpForm(): void {
    this.otpForm = this.fb.group({
      otpCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
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
      this.clearOtpMessage();
    }
    this.isEditing ? this.personalInfoForm.enable() : this.personalInfoForm.disable();
  }

  // Phone verification methods
  sendOTP(): void {
    const phoneNumber = this.personalInfoForm.get('phoneNumber')?.value;
    if (!phoneNumber || phoneNumber.trim() === '') {
      this.showOtpMessage('Please enter a phone number first.', false);
      return;
    }

    this.isSendingOtp = true;
    this.clearOtpMessage();

            this.http.post<any>('http://localhost:8080/api/phone-verification/send-otp', {
          phoneNumber: phoneNumber
        }).subscribe({
          next: (response) => {
            this.isSendingOtp = false;
            if (response.success) {
              this.hasOtpSent = true;
              this.currentPhoneNumber = response.formattedPhoneNumber || phoneNumber;
              
              // Show different message based on whether user is changing phone number
              if (response.isChangingPhoneNumber) {
                this.showOtpMessage('OTP sent to new phone number for verification. Please verify the new number.', true);
              } else {
                this.showOtpMessage(response.message, true);
              }
            } else {
              this.showOtpMessage(response.message, false);
            }
          },
      error: (error) => {
        this.isSendingOtp = false;
        console.error('Error sending OTP:', error);
        this.showOtpMessage('Failed to send OTP. Please try again.', false);
      }
    });
  }

  openVerificationModal(): void {
    const modal = new bootstrap.Modal(document.getElementById('phoneVerificationModal'));
    modal.show();
    setTimeout(() => {
      const otpInput = document.getElementById('otpCode') as HTMLInputElement;
      if (otpInput) {
        otpInput.focus();
      }
    }, 100);
  }

  verifyOTP(): void {
    if (!this.otpForm.valid) {
      return;
    }

    const phoneNumber = this.personalInfoForm.get('phoneNumber')?.value;
    const otpCode = this.otpForm.get('otpCode')?.value;

    this.isVerifyingOtp = true;

    this.http.post<any>('http://localhost:8080/api/phone-verification/verify-otp', {
      phoneNumber: phoneNumber,
      otpCode: otpCode
    }).subscribe({
      next: (response) => {
        this.isVerifyingOtp = false;
        if (response.success) {
          // Close modal
          const modal = bootstrap.Modal.getInstance(document.getElementById('phoneVerificationModal'));
          if (modal) {
            modal.hide();
          }

          // Update user details
          if (this.userDetails) {
            this.userDetails.phoneNumber = response.phoneNumber || phoneNumber;
            this.userDetails.phoneVerified = true;
          }

          // Update form
          this.personalInfoForm.patchValue({ phoneNumber: response.phoneNumber || phoneNumber });

          // Show success message based on whether it was a phone number change
          const successMessage = response.phoneNumber !== this.originalDetails?.phoneNumber ? 
            'Phone number changed and verified successfully!' : 
            'Phone number verified successfully!';
          this.showOtpMessage(successMessage, true);
          this.hasOtpSent = false;
          this.otpForm.reset();
        } else {
          this.showOtpMessage(response.message, false);
        }
      },
      error: (error) => {
        this.isVerifyingOtp = false;
        console.error('Error verifying OTP:', error);
        this.showOtpMessage('Failed to verify OTP. Please try again.', false);
      }
    });
  }

  resendOTP(): void {
    this.isResendingOtp = true;
    this.otpForm.reset();

    this.http.post<any>('http://localhost:8080/api/phone-verification/send-otp', {
      phoneNumber: this.currentPhoneNumber
    }).subscribe({
      next: (response) => {
        this.isResendingOtp = false;
        if (response.success) {
          this.showOtpMessage('OTP resent successfully!', true);
        } else {
          this.showOtpMessage(response.message, false);
        }
      },
      error: (error) => {
        this.isResendingOtp = false;
        console.error('Error resending OTP:', error);
        this.showOtpMessage('Failed to resend OTP. Please try again.', false);
      }
    });
  }

  showOtpMessage(message: string, success: boolean): void {
    this.otpMessage = message;
    this.otpSuccess = success;
    
    // Clear message after 5 seconds
    setTimeout(() => {
      this.clearOtpMessage();
    }, 5000);
  }

  clearOtpMessage(): void {
    this.otpMessage = '';
    this.otpSuccess = false;
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
    this.clearOtpMessage();
    this.hasOtpSent = false;
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

isPhoneVerified(): boolean {
  return !this.isPhoneEmpty() && this.userDetails?.phoneVerified === true;
}

isPhoneNumberChanged(): boolean {
  const currentPhone = this.personalInfoForm.get('phoneNumber')?.value;
  const originalPhone = this.originalDetails?.phoneNumber;
  return currentPhone && originalPhone && currentPhone !== originalPhone;
}
}
