import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LuxUiModule } from '../../shared/ui/lux-ui.module';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LuxUiModule],
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
  captchaInput: string = '';
  captchaQuestion: string = '';
  captchaAnswer: string = '';
  showCaptchaModal: boolean = false;
  isVerifyingCaptcha: boolean = false;
  captchaError: string = '';
  isLoginOtp: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get email from query param or navigation state
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      const reason = params['reason'] || '';
      // Store the reason to determine which endpoint to call
      this.isLoginOtp = reason === 'login';
      
      console.log('Verify OTP Component - Email:', this.email, 'Reason:', reason, 'IsLoginOtp:', this.isLoginOtp); // Debug log
      console.log('All query params:', params); // Debug all params
      
      // Also check navigation state
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras?.state) {
        const state = navigation.extras.state as any;
        if (state['email'] && !this.email) {
          this.email = state['email'];
        }
        if (state['reason'] && !this.isLoginOtp) {
          this.isLoginOtp = state['reason'] === 'login';
        }
        console.log('Navigation state:', state);
      }
      
      if (this.email) {
        this.sendOtp(); // Auto-send OTP on page load if email is present
      } else {
        this.error = 'No email provided.';
      }
    });
    
    // Also try to get params from snapshot as fallback
    const snapshotParams = this.route.snapshot.queryParams;
    if (snapshotParams['email'] && !this.email) {
      this.email = snapshotParams['email'];
    }
    if (snapshotParams['reason'] && !this.isLoginOtp) {
      this.isLoginOtp = snapshotParams['reason'] === 'login';
    }
    console.log('Snapshot params:', snapshotParams);
  }

  sendOtp() {
    if (!this.email) return;
    this.isSending = true;
    this.error = '';
    this.message = '';
    
    console.log('Sending OTP - Email:', this.email, 'IsLoginOtp:', this.isLoginOtp); // Debug log
    
    // Use the appropriate endpoint based on whether this is a login OTP
    const sendOtpObservable = this.isLoginOtp 
      ? this.authService.sendLoginOtp(this.email)
      : this.authService.sendRegisterOtp(this.email);
    
    sendOtpObservable.subscribe({
      next: (res) => {
        this.isSending = false;
        this.otpSent = true;
        this.message = res?.message || 'OTP sent to your email.';
        console.log('OTP sent successfully:', res); // Debug log
      },
      error: (err) => {
        this.isSending = false;
        this.error = err?.error?.message || 'Failed to send OTP.';
        console.error('OTP send error:', err); // Debug log
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
    
    console.log('Verifying OTP - Email:', this.email, 'OTP:', otp, 'IsLoginOtp:', this.isLoginOtp); // Debug log
    
    // Use the appropriate endpoint based on whether this is a login OTP
    const verifyObservable = this.isLoginOtp 
      ? this.authService.verifyLoginOtp(this.email, otp)
      : this.authService.verifyOtp(this.email, otp);
    
    console.log('Using endpoint:', this.isLoginOtp ? 'verify-login-otp' : 'verify-otp'); // Debug log
    
    verifyObservable.subscribe({
      next: (res) => {
        this.isVerifying = false;
        console.log('OTP verification response:', res); // Debug log
        console.log('Is login OTP:', this.isLoginOtp); // Debug log
        console.log('Response has accessToken:', res && res.accessToken); // Debug log
        console.log('Response has refreshToken:', res && res.refreshToken); // Debug log
        
        // If this is a login OTP, show CAPTCHA before redirecting
        if (this.isLoginOtp && res && res.accessToken && res.refreshToken) {
          console.log('Login OTP verified, showing CAPTCHA'); // Debug log
          // Save tokens for login flow
          this.authService.saveToken(res.accessToken);
          localStorage.setItem('refreshToken', res.refreshToken);
          this.showCaptchaModal = true;
          this.generateCaptcha();
        } else if (this.isLoginOtp) {
          // Login OTP but no tokens returned - this shouldn't happen
          console.error('Login OTP verified but no tokens returned:', res);
          console.log('Response keys:', Object.keys(res || {}));
          this.error = 'Login verification failed. Please try again.';
        } else {
          // Regular email verification OTP
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

  generateCaptcha() {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    this.captchaQuestion = `What is ${a} + ${b}?`;
    this.captchaAnswer = (a + b).toString();
    this.captchaInput = '';
    this.captchaError = '';
  }

  verifyCaptcha() {
    this.captchaError = '';
    this.isVerifyingCaptcha = true;
    if (this.captchaInput.trim() === this.captchaAnswer) {
      this.isVerifyingCaptcha = false;
      this.showCaptchaModal = false;
      this.message = 'Login successful! Redirecting...';
      
      // Save tokens and redirect based on user role
      if (this.authService.getDecodedToken()) {
        const decoded = this.authService.getDecodedToken();
        const roles = decoded?.roles ? decoded.roles.split(',') : [];
        this.router.navigate([this.authService.redirectPathForRoles(roles)]);
      } else {
        this.router.navigate(['/']);
      }
    } else {
      this.isVerifyingCaptcha = false;
      this.captchaError = 'Incorrect answer. Please try again.';
      this.generateCaptcha();
    }
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
