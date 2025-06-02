import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  submitted = false;
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
      password: ['', [Validators.required, Validators.minLength(6)]],
      gender: [''],
      dateOfBirth: [''],
      phoneNumber: [''],
      roleId: [2, Validators.required] // Default to 2 for regular user
    });
  }

  // For easier template access
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
      }
    });
  }
}
