import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

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
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['STUDENT', Validators.required] // Default role
    });
  }

  // For easier template access
  get f() {
    return this.registerForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.registerForm.invalid) {
      return;
    }

    const formData = this.registerForm.value;

    this.authService.register(formData).subscribe({
  next: (response) => {
    console.log('Access Token:', response.accessToken); // ✅ correct property
    console.log('Refresh Token:', response.refreshToken);

    this.authService.saveToken(response.accessToken); // ✅ Save to localStorage

    this.successMessage = 'Registered successfully. Redirecting to home...';
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 1500);
  },
  error: (error) => {
    this.errorMessage = error.error.message || 'Registration failed';
  }
});


  }
}
