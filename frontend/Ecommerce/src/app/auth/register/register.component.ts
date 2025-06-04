import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      gender: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      role: ['STUDENT']
    });

    this.otpForm = this.fb.group({
      otp: ['', Validators.required]
    });
  }

  onSubmit(): void {
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
