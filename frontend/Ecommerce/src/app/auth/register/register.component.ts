import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { RegisterResponse } from '../auth.types';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  showEmailVerifyModal: boolean = false;
  otpForm: FormGroup;
  emailForOtp: string = '';
  isOtpStep: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  submitted = false;
  selectedFile?: File;
  today: string;
  fileTypeInvalid: boolean = false;
  otpVerified: boolean = false;
  errors: { [key: string]: string } = {};
  showPassword = false;
  showConfirmPassword = false;
  user = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    gender: '',
    role: 2
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      //password: ['', Validators.required],
      gender: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      roleId: [2, Validators.required]
    });

    this.otpForm = this.fb.group({
      otp: ['', Validators.required]
    });

    const now = new Date();
    this.today = now.toISOString().split('T')[0];
  }

  // For easier template access
  get f() {
    return this.registerForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.validate();
  }

  sendOtp(showModal: boolean = false): void {
    this.errors['email'] = '';
    if (!this.user.email) {
      this.errors['email'] = 'Email is required';
      return;
    }
    if (!this.validateEmail(this.user.email)) {
      this.errors['email'] = 'Please enter a valid email address';
      return;
    }

    this.authService.resendOtp(this.user.email).subscribe({
      next: (response) => {
        this.showEmailVerifyModal = showModal;
        this.successMessage = response.message || 'OTP sent successfully';
        this.errorMessage = '';
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to send OTP';
        this.successMessage = '';
      }
    });
  }

  verifyOtp(): void {
    if (this.otpForm.invalid) return;

    this.authService.verifyOtp(this.user.email, this.otpForm.value.otp).subscribe({
      next: (response) => {
        this.otpVerified = true;
        this.showEmailVerifyModal = false;
        this.successMessage = response.message || 'Email verified successfully';
        this.errorMessage = '';
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Invalid OTP';
        this.successMessage = '';
      }
    });
  }

  resendOtp(): void {
    this.sendOtp(false);
  }

  doFinalRegistration() {
    const formData = new FormData();
    const requestPayload = {
      name: this.user.name,
      email: this.user.email,
      password: this.user.password,
      role: this.user.role,
      dateOfBirth: this.user.dob,
      gender: this.user.gender
    };

    formData.append('user', new Blob([JSON.stringify(requestPayload)], { type: 'application/json' }));
    if (this.selectedFile) {
      formData.append('profileImage', this.selectedFile);
    }

    this.authService.register(formData).subscribe({
      next: (response) => {
        console.log('Access Token:', response.accessToken);
        this.authService.saveToken(response.accessToken!);
        this.successMessage = 'Registered successfully. Redirecting to home...';
        setTimeout(() => this.router.navigate(['/home']), 1500);
      },
      error: (error) => {
        this.errorMessage = error.error.message || 'Registration failed';
      }
    });
  }

  validate() {
    this.errors = {};
    let isValid = true;

    // Name validation
    if (!this.user.name) {
      this.errors['name'] = 'Name is required';
      isValid = false;
    }

    // Email validation
    if (!this.user.email) {
      this.errors['email'] = 'Email is required';
      isValid = false;
    } else if (!this.validateEmail(this.user.email)) {
      this.errors['email'] = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation
    if (!this.user.password) {
      this.errors['password'] = 'Password is required';
      isValid = false;
    } else if (this.user.password.length < 6) {
      this.errors['password'] = 'Password must be at least 6 characters long';
      isValid = false;
    }

    // Confirm password validation
    if (!this.user.confirmPassword) {
      this.errors['confirmPassword'] = 'Please confirm your password';
      isValid = false;
    } else if (this.user.password !== this.user.confirmPassword) {
      this.errors['confirmPassword'] = 'Passwords do not match';
      isValid = false;
    }

    // Date of birth validation
    if (!this.user.dob) {
      this.errors['dob'] = 'Date of birth is required';
      isValid = false;
    }

    // Gender validation
    if (!this.user.gender) {
      this.errors['gender'] = 'Please select your gender';
      isValid = false;
    }

    return isValid;
  }

  validateEmail(email: string): boolean {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  }

  onNameChange() {
    this.errors['name'] = '';
  }

  onEmailChange() {
    this.errors['email'] = '';
  }

  onDobChange() {
    this.errors['dob'] = '';
  }

  onGenderChange() {
    this.errors['gender'] = '';
  }

  onPasswordChange() {
    this.errors['password'] = '';
  }

  onConfirmPasswordChange() {
    this.errors['confirmPassword'] = '';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errors['file'] = 'File size should not exceed 5MB';
        return;
      }
      // Check file type
      if (!file.type.startsWith('image/')) {
        this.errors['file'] = 'Please upload an image file';
        return;
      }
      this.selectedFile = file;
      this.errors['file'] = '';
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}