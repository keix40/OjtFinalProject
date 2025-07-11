import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  showPassword = false

  // Modal control
  showForgotPasswordModal = false;
  showOtpModal = false;
  showResetModal = false;

  // Forgot/reset state
  forgotEmail = '';
  enteredOtp = '';
  newPassword = '';
  confirmPassword = '';

  // Flags to track validation display
  submittedLogin = false;
  submittedForgot = false;
  submittedOtp = false;
  submittedReset = false;

  //Loading states
  isResettingPassword = false;
  isSendingOtp = false;
  isVerifyingOtp=false;

  // Error messages
  forgotError = '';
  otpError = '';
  resetError = '';
  loginError = '';
  forgotEmailError = '';
  resetPasswordError='';
  resetConfirmPasswordError='';
  resetSuccessMessage = '';


  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
  email: ['', [
    Validators.required,
    Validators.pattern(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)
  ]],
  password: ['', Validators.required]
});


    // Live clear login errors
 this.loginForm.get('email')?.valueChanges.subscribe(() => {
  this.loginError = ''; // only clear API error
});

this.loginForm.get('password')?.valueChanges.subscribe(() => {
  this.loginError = ''; // only clear API error
});

}

  // ---------- LOGIN ----------
  submitLogin() {
  this.submittedLogin = true;

  if (this.loginForm.invalid) return;

  this.auth.login(this.loginForm.value).subscribe({
    next: (res) => {
      this.auth.saveToken(res.accessToken);

      const decoded = this.auth.getDecodedToken(); // Only declare once
      const permissionString = decoded?.permissions || '';
      const permissionArray = permissionString.split(',').map((p: string) => p.trim());

      this.permissionService.setPermissions(permissionArray);

      // Role-based redirect
      const roles = decoded?.roles ? decoded.roles.split(',') : [];
      if (roles.includes('CUSTOMER')) {
        this.router.navigate(['/home']);
      } else {
        this.router.navigate(['/dashboard']);
      }

      if (decoded && decoded.sub) {
        localStorage.setItem('email', decoded.sub); // reuse 'decoded'
      }
    },
    error: (err) => {
      console.error(err);
      if (err?.error?.message && err.error.message.toLowerCase().includes('verify your email')) {
        // Redirect to OTP verification page with email
        const email = this.loginForm.get('email')?.value;
        this.router.navigate(['/verify-otp'], { queryParams: { email } });
      } else {
        this.loginError = 'Invalid email or password.';
      }
    }
  });
  }

  // ---------- FORGOT PASSWORD ----------
  openForgotModal() {
    this.forgotEmail = '';
    this.forgotError = '';
    this.submittedForgot = false;
    this.enteredOtp = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.otpError = '';
    this.resetError = '';
    this.showForgotPasswordModal = true;
    this.showOtpModal = false;
    this.showResetModal = false;
  }

 sendForgotPasswordOtp() {
  this.submittedForgot = true;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

  // Revalidate after submit
  if (!this.forgotEmail) {
    this.forgotError = 'Email is required.';
    return;
  }
  if (!emailRegex.test(this.forgotEmail)) {
    this.forgotError = 'Enter a valid Gmail address.';
    return;
  }

  this.isSendingOtp = true;
  this.forgotError = '';

  this.auth.sendResetOtp(this.forgotEmail).subscribe({
    next: () => {
      this.isSendingOtp = false;
      this.showForgotPasswordModal = false;
      this.showOtpModal = true;
    },
    error: (err) => {
      this.forgotError = err.error?.message || 'User not found.';
    }
  });
}


  // ---------- VERIFY OTP ----------
 verifyOtp() {
  this.submittedOtp = true;

  if (!this.enteredOtp) {
    this.otpError = 'OTP is required.';
    return;
  }

  this.otpError = ''; // clear before calling
  this.isVerifyingOtp=true;

  this.auth.verifyOtp(this.forgotEmail, this.enteredOtp).subscribe({
    next: () => {
      this.showOtpModal = false;
      this.showResetModal = true;
      this.isVerifyingOtp = true;
    },
    error: (err) => {
      this.isVerifyingOtp = false;
      this.otpError = err.error?.message || 'Invalid code.';
    }
  });
}

  // ---------- RESET PASSWORD ----------
 resetPassword() {
  this.submittedReset = true;
  this.resetPasswordError = '';
  this.resetConfirmPasswordError='';

  if (!this.newPassword) {
    this.resetPasswordError = 'Password is required.';
    return;
  } else if (this.newPassword.length < 8) {
    this.resetPasswordError = 'Password must be at least 8 characters.';
    return;
  }

  if (!this.confirmPassword) {
    this.resetConfirmPasswordError = 'Confirm password is required.';
    return;
  } else if (this.newPassword !== this.confirmPassword) {
    this.resetConfirmPasswordError = 'Passwords do not match.';
    return;
  }

  this.isResettingPassword = true;
  this.resetError = '';
  this.resetSuccessMessage = '';

  this.auth.resetPassword(this.forgotEmail, this.newPassword).subscribe({
    next: () => {
      this.isResettingPassword = false;
      this.showResetModal = false;
      this.resetSuccessMessage = 'Password reset successfully. Logging you in ...';

     // Automatically log in the user with their new password
      this.auth.login({
        email: this.forgotEmail,
        password: this.newPassword
      }).subscribe({
        next: (loginRes) => {
          this.auth.saveToken(loginRes.accessToken);
          this.router.navigate(['/home']);
          const decoded: any = this.auth.getDecodedToken();
    if (decoded && decoded.sub) {
      localStorage.setItem('email', decoded.sub); // "sub" is the email in your token
    }
        },
        error: (loginErr) => {
          console.error('Auto-login failed after password reset:', loginErr);
          // If auto-login fails, show a success message and redirect to login
          this.loginError = 'Password reset successful! Please log in with your new password.';
          // Clear the reset form
          this.forgotEmail = '';
          this.enteredOtp = '';
          this.newPassword = '';
          this.confirmPassword = '';
        }
      });
    },
    error: (err) => {
      this.isResettingPassword = false;
      console.error('reset error :'+err)
      this.resetError = err.error?.message || 'Reset failed.';
    }
  });
}

  get email() {
  return this.loginForm.get('email');
}

get password() {
  return this.loginForm.get('password');
}

onForgotEmailChange() {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

  // If the user has clicked submit at least once
  if (this.submittedForgot) {
    if (!this.forgotEmail) {
      this.forgotError = 'Email is required.';
    } else if (!emailRegex.test(this.forgotEmail)) {
      this.forgotError = 'Enter a valid Gmail address.';
    } else {
      this.forgotError = '';
    }
  } else {
    // If typing before submit, always clear error
    this.forgotError = '';
  }
}

onOtpChange() {
  if (this.submittedOtp) {
    if (!this.enteredOtp) {
      this.otpError = 'OTP is required.';
    } else {
      this.otpError = '';
    }
  } else {
    this.otpError = '';
  }
}

togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }


}