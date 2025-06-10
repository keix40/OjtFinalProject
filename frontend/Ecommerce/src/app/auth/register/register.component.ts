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
export class RegisterComponent  {
  registerForm: FormGroup;
  showEmailVerifyModal: boolean = false;
  otpForm: FormGroup;
  isOtpStep = false;
  emailForOtp = '';
  errorMessage = '';
  successMessage = '';
  submitted = false;
  selectedFile?: File;
  today: string;
  fileTypeInvalid: boolean = false;
  otpVerified: boolean = false;
  otpError: string | null = null;

  user = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
    dob: '',
    gender: ''
  };

  errors: { [key: string]: string } = {};

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

  /*onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.validate();// for validate

    if (this.registerForm.invalid) {
      return;
    }

    const formData = this.registerForm.value;

    this.authService.register(formData).subscribe({
    //   next: (response: string) => {
    //     // Since we set responseType to 'text', response will be a string
    //     this.successMessage = response;
    //     // After successful registration, automatically log in the user
    //     this.authService.login({
    //       email: formData.email,
    //       password: formData.password
    //     }).subscribe({
    //       next: (loginResponse) => {
    //         this.authService.saveToken(loginResponse.accessToken);
    //         setTimeout(() => {
    //           this.router.navigate(['/home']);
    //         }, 1500);
    //       },
    //       error: (loginError) => {
    //         console.error('Auto-login failed:', loginError);
    //         // Even if auto-login fails, redirect to login page
    //         setTimeout(() => {
    //           this.router.navigate(['/login']);
    //         }, 1500);
    //       }
    //     });
    //   },
    //   error: (error: HttpErrorResponse) => {
    //     console.error('Registration error:', error);
    //     this.errorMessage = error.error?.message  'Registration failed. Please try again.';
    //     this.submitted = false;
    // if (this.registerForm.invalid) return;

    // this.authService.register(this.registerForm.value).subscribe({
     next: (res: RegisterResponse) => {
  this.emailForOtp = this.registerForm.value.email;
  this.isOtpStep = true;
  this.showEmailVerifyModal = true; // show otp pop up
  this.successMessage = res?.message || 'OTP sent to your email.';
  this.errorMessage = '';
},

      error: (err) => {
        console.error('Registration error:', err);
        this.errorMessage = err?.error?.message ||  err?.message || 'Registration failed';
        this.successMessage = '';
      }
    });
  }*/
  
    onSubmit() {                          //Change onSubmit method
    this.submitted = true;
    this.validate();

    if (Object.keys(this.errors).length > 0) {
      return; // Form is invalid, do not proceed
    }

    if (!this.otpVerified) {
      this.sendOtp(true); // Try sending OTP and open modal only on success
      return;
    }

    const formData = new FormData();
    const requestPayload = {
      name: this.user.name,
      email: this.user.email,
      password: this.user.password,
      role: this.user.role,
      dateOfBirth: this.user.dob,
      gender: this.user.gender
    };

    formData.append('request', new Blob([JSON.stringify(requestPayload)], { type: 'application/json' }));

    if (this.selectedFile) {
      formData.append('profileImage', this.selectedFile);
    }

    this.authService.register(formData).subscribe({
      next: (response) => {
        this.successMessage = response?.message || 'Registration successful.';
        this.errorMessage = '';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        const msg = error.error?.message || error.message || 'Registration failed';
        this.errorMessage = msg;
        console.error("error :"+error)

        if (msg.toLowerCase().includes('email')) {
          this.errors['email'] = msg;
        } else if (msg.toLowerCase().includes('date')) {
          this.errors['dob'] = msg;
        } else if (msg.toLowerCase().includes('role')) {
          this.errors['role'] = msg;
        } else if (msg.toLowerCase().includes('image')) {
          this.errors['profileImage'] = msg;
        } else {
          this.errors['general'] = msg;
        }
      }
    });
  }

//add Sent OTP 
   sendOtp(showModal: boolean = false): void {
    this.errors['email'] = '';
    this.successMessage = '';
    this.errorMessage = '';
    this.isOtpStep = false;
    this.otpVerified = false;

    if (!this.user.email || !this.isEmailFormatValid()) {
      this.errors['email'] = 'Enter a valid Gmail address.';
      return;
    }

    this.authService.sendRegisterOtp(this.user.email).subscribe({
      next: (res) => {
        this.emailForOtp = this.user.email;
        this.isOtpStep = true;
        this.successMessage = res?.message || 'OTP sent to your email.';
        if (showModal) this.showEmailVerifyModal = true;
        console.log("OPT Sent");
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Failed to send OTP.';
        this.errors['email'] = msg;
        this.showEmailVerifyModal = false;
        console.error('Opt sent error: '+err);
      }
    });
  }
  verifyOtp(): void {
    if (this.otpForm.invalid) return;
  
    this.authService.verifyOtp(this.emailForOtp, this.otpForm.value.otp).subscribe({
      next: () => {
        this.otpVerified = true;  // ✅ Mark OTP as verified
        this.showEmailVerifyModal = false;  // ✅ Optional: close modal
        this.successMessage = 'Email verified successfully. You can now continue.';
        this.errorMessage = '';
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
        this.errorMessage = err?.error?.message ||  err?.message || 'Failed to resend OTP.';
        this.successMessage = '';
      }
    });
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

    formData.append('request', new Blob([JSON.stringify(requestPayload)], { type: 'application/json' }));
    if (this.selectedFile) {
      formData.append('profileImage', this.selectedFile);
    }

//     this.authService.register(formData).subscribe({
//   next: (response) => {
//     console.log('Access Token:', response.accessToken); // ✅ correct property
//     console.log('Refresh Token:', response.refreshToken);

//     this.authService.saveToken(response.accessToken); // ✅ Save to localStorage

//     this.successMessage = 'Registered successfully. Redirecting to home...';
//     setTimeout(() => {
//       this.router.navigate(['/home']);
//     }, 1500);
//   },
//   error: (error) => {
//     this.errorMessage = error.error.message || 'Registration failed';
//   }
// });

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

    if (!this.user.name.trim()) {
      this.errors['name'] = 'Name is required.';
    }

    if (!this.user.email.trim()) {
      this.errors['email'] = 'Email is required.';
    } else if (!this.isEmailFormatValid()) {
      this.errors['email'] = 'Email must be a valid Gmail address.';
    }

    if (!this.user.dob) {
      this.errors['dob'] = 'Date of birth is required.';
    } else {
      const dobDate = new Date(this.user.dob);
      const today = new Date();
      const minAllowedDob = new Date('2010-12-31');

      if (dobDate > today) {
        this.errors['dob'] = 'Date of birth cannot be in the future.';
      } else if (dobDate > minAllowedDob) {
        this.errors['dob'] = 'You must be 15 years or older.';
      }
    }

    if (!this.user.gender) {
      this.errors['gender'] = 'Please select your gender.';
    }

    if (!this.user.password) {
      this.errors['password'] = 'Password is required.';
    } else if (this.user.password.length < 8) {
      this.errors['password'] = 'Password must be at least 8 characters.';
    }

    if (!this.user.confirmPassword) {
      this.errors['confirmPassword'] = 'Confirm password is required.';
    } else if (this.user.confirmPassword !== this.user.password) {
      this.errors['confirmPassword'] = 'Passwords do not match.';
    }

    if (this.selectedFile) {
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validImageTypes.includes(this.selectedFile.type)) {
        this.errors['file'] = 'Invalid image type.';
        this.fileTypeInvalid = true;
      }
    }
  }

  isEmailFormatValid(): boolean {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(this.user.email);
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    this.errors['file'] = '';
    this.fileTypeInvalid = false;

    if (file) {
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validImageTypes.includes(file.type)) {
        this.errors['file'] = 'Invalid image type.';
        this.fileTypeInvalid = true;
        this.selectedFile = undefined;
        return;
      }
      this.selectedFile = file;
      if (this.submitted) this.validate();
    }
  }

  onNameChange(): void {
    if (this.submitted) this.validate();
  }

  onEmailChange(): void {
    if (this.submitted) this.validate();
    this.otpVerified = false;
    this.isOtpStep = false;
    this.otpError = null;
    this.otpForm.reset();
  }

  onDobChange(): void {
    if (this.submitted) this.validate();
  }

  onGenderChange(): void {
    if (this.submitted) this.validate();
  }

  onPasswordChange(): void {
    if (this.submitted) this.validate();
  }

  onConfirmPasswordChange(): void {
    if (this.submitted) this.validate();
  }

  onInputChange(field: string): void {
    if (this.errors[field]) {
      delete this.errors[field];
    }
  }






  }