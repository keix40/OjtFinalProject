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
  otpForm: FormGroup;
  isOtpStep = false;
  emailForOtp = '';
  errorMessage = '';
  successMessage = '';
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password: ['', Validators.required],
      gender: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      roleId: [2, Validators.required] // Default to 2 for regular user

    });

    this.otpForm = this.fb.group({
      otp: ['', Validators.required]
    });
  }

   get f() {
    return this.registerForm.controls;
  }
  
  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.registerForm.invalid) {
      return;
    }

    const formData = this.registerForm.value;

    this.authService.register(formData).subscribe({
      next: (response: string) => {
        // Since we set responseType to 'text', response will be a string
        this.successMessage = response;
        // After successful registration, automatically log in the user
        this.authService.login({
          email: formData.email,
          password: formData.password
        }).subscribe({
          next: (loginResponse) => {
            this.authService.saveToken(loginResponse.accessToken);
            setTimeout(() => {
              this.router.navigate(['/home']);
            }, 1500);
          },
          error: (loginError) => {
            console.error('Auto-login failed:', loginError);
            // Even if auto-login fails, redirect to login page
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 1500);
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        console.error('Registration error:', error);
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
        this.submitted = false;
    if (this.registerForm.invalid) return;

    this.authService.register(this.registerForm.value).subscribe({
      next: (res: RegisterResponse) => {
        this.emailForOtp = this.registerForm.value.email;
        this.isOtpStep = true;
        this.successMessage = res?.message || 'OTP sent to your email.';
        this.errorMessage = ''; // clear any previous error
      },
      error: (err) => {
        console.error('Registration error:', err);
        this.errorMessage = err?.error?.message || err?.message || 'Registration failed';
        this.successMessage = '';
      }
    });
  }

  verifyOtp(): void {
    if (this.otpForm.invalid) return;

    this.authService.verifyOtp(this.emailForOtp, this.otpForm.value.otp).subscribe({
      next: () => {
        this.successMessage = 'Email verified successfully. You can now login.';
        this.errorMessage = '';
        setTimeout(() => this.router.navigate(['/']), 1500);
      },
      error: (err) => {
        console.error('OTP verification error:', err);
        this.errorMessage = err?.error?.message || err?.message || 'OTP verification failed.';
        this.successMessage = '';
      }
    });
  }

  resendOtp(): void {
    this.authService.resendOtp(this.emailForOtp).subscribe({
      next: () => {
        this.successMessage = 'OTP resent successfully.';
        this.errorMessage = '';
      },
      error: (err) => {
        console.error('Resend OTP error:', err);
        this.errorMessage = err?.error?.message || err?.message || 'Failed to resend OTP.';
        this.successMessage = '';
      }
    });
  }
}
