import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.css']
})
export class VerifyOtpComponent implements OnInit {
  email: string = '';
  otp: string = '';
  message: string = '';
  error: string = '';
  isSending: boolean = false;
  isVerifying: boolean = false;
  otpSent: boolean = false;
  otpBoxes: string[] = ['', '', '', '', '', ''];
  successAnimation: string[] = ['', '', '', '', '', ''];
  errorAnimation = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get email from query param or navigation state
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || history.state.email || '';
      if (this.email) {
        this.sendOtp(); // Auto-send OTP on page load if email is present
      }
    });
    if (!this.email) {
      this.error = 'No email provided.';
    }
  }

  sendOtp() {
    if (!this.email) return;
    this.isSending = true;
    this.error = '';
    this.message = '';
    this.authService.sendLoginOtp(this.email).subscribe({
      next: (res) => {
        this.isSending = false;
        this.otpSent = true;
        this.message = res?.message || 'OTP sent to your email.';
      },
      error: (err) => {
        this.isSending = false;
        this.error = err?.error?.message || 'Failed to send OTP.';
      }
    });
  }

  isOtpComplete(): boolean {
    return this.otpBoxes.every(box => box && box.length === 1);
  }

  onOtpInput(index: number, event: any) {
    const value = event.target.value;
    if (value && value.length === 1 && index < 5) {
      const next = document.querySelectorAll('input[type="text"]')[index + 1] as HTMLElement;
      if (next) next.focus();
    }
    // Auto-submit when 6 digits are filled
    if (this.isOtpComplete()) {
      setTimeout(() => this.autoVerifyOtp(), 100); // slight delay for last digit
    }
  }

  onOtpKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.otpBoxes[index] && index > 0) {
      const prev = document.querySelectorAll('input[type="text"]')[index - 1] as HTMLElement;
      if (prev) prev.focus();
    }
  }

  autoVerifyOtp() {
    if (!this.email || !this.isOtpComplete()) return;
    const otp = this.otpBoxes.join('');
    this.isVerifying = true;
    this.error = '';
    this.message = '';
    this.authService.verifyOtp(this.email, otp).subscribe({
      next: (res) => {
        this.isVerifying = false;
        if (res && res.accessToken && res.refreshToken) {
          localStorage.setItem('accessToken', res.accessToken);
          localStorage.setItem('refreshToken', res.refreshToken);
          this.message = 'Email verified and logged in! Redirecting...';
          this.animateSuccessAndRedirect();
        } else {
          this.message = 'Email verified successfully! You can now log in.';
          setTimeout(() => this.router.navigate(['/login']), 1500);
        }
      },
      error: (err) => {
        this.isVerifying = false;
        this.error = err?.error?.message || 'OTP verification failed.';
        this.animateError();
      }
    });
  }

  animateSuccessAndRedirect() {
    this.successAnimation = ['', '', '', '', '', ''];
    let i = 0;
    const animate = () => {
      if (i < 6) {
        this.successAnimation[i] = 'border-success';
        setTimeout(() => {
          this.successAnimation[i] = '';
          i++;
          animate();
        }, 100);
      } else {
        setTimeout(() => this.router.navigate(['/']), 200);
      }
    };
    animate();
  }

  animateError() {
    this.errorAnimation = true;
    setTimeout(() => {
      this.errorAnimation = false;
      this.otpBoxes = ['', '', '', '', '', ''];
      const first = document.querySelectorAll('input[type="text"]')[0] as HTMLElement;
      if (first) first.focus();
    }, 500);
  }
}
