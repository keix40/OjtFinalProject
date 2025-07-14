import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';

declare var lucide: any;

interface RoleInfo {
  name: string;
  description: string;
  permissions: string[];
}

interface CSVUser {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  addressType?: string;
  emailVerified?: boolean;
}

@Component({
  selector: 'app-create-user',
  standalone: false,
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css']
})
export class CreateUserComponent implements OnInit, AfterViewInit {
  userForm: FormGroup;
  isSubmitting = false;
  showPassword = false;
  showBulkImport = false;
  isDragOver = false;
  csvData: CSVUser[] = [];
  isImporting = false;
  errorMessages: { [key: string]: string } = {};
  createdUser: any = null;
  roles: any[] = [];
  selectedRoleDetails: any = null;
  emailCheckMessage: string = '';
  emailCheckSuccess: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private userService: UserService
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit(): void {
    this.userService.getAllRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (err) => {
        console.error('Failed to fetch roles', err);
      }
    });
    this.setupFormSubscriptions();
  }

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    } else if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  createForm(): FormGroup {
    return this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]],
      dateOfBirth: [''],
      gender: [''],
      username: ['', [Validators.minLength(3)]],
      role: ['', [Validators.required]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      ]],
      confirmPassword: ['', [Validators.required]],
      street: [''],
      city: [''],
      state: [''],
      zipCode: [''],
      country: [''],
      isActive: [true],
      emailVerified: [false],
      sendWelcomeEmail: [true],
      addressType: ['HOME']
    }, { validators: this.passwordMatchValidator });
  }

  setupFormSubscriptions(): void {
    this.userForm.get('role')?.valueChanges.subscribe(roleId => {
      this.selectedRoleDetails = this.roles.find(r => r.id == roleId) || null;
    });
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  get selectedRoleInfo(): any {
    return this.selectedRoleDetails;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  fillSampleData(): void {
    this.userForm.patchValue({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@gmail.com',
      phone: '+1234567890',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      username: 'johndoe',
      role: 'customer',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'US',
      isActive: true,
      emailVerified: true,
      sendWelcomeEmail: true,
      addressType: 'HOME'
    });
  }

  generatePassword(): void {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special character
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    this.userForm.patchValue({
      password: password,
      confirmPassword: password
    });
  }

  validateEmail(): void {
    const email = this.userForm.get('email')?.value;
    if (!email) {
      this.emailCheckMessage = 'Please enter an email address first.';
      this.emailCheckSuccess = false;
      return;
    }
    this.userService.checkEmailExists(email).subscribe({
      next: (res) => {
        if (res.exists) {
          this.errorMessages['email'] = 'Email already exists.';
          this.emailCheckMessage = 'Email already exists.';
          this.emailCheckSuccess = false;
          this.userForm.get('email')?.setErrors({ exists: true });
    } else {
          this.errorMessages['email'] = '';
          this.emailCheckMessage = 'Email is available!';
          this.emailCheckSuccess = true;
          this.userForm.get('email')?.setErrors(null);
        }
      },
      error: () => {
        this.emailCheckMessage = 'Failed to validate email.';
        this.emailCheckSuccess = false;
      }
    });
  }

  checkRealEmail(): void {
    const email = this.userForm.get('email')?.value;
    if (!email) {
      this.emailCheckMessage = 'Please enter an email address first.';
      this.emailCheckSuccess = false;
      return;
    }
    this.userService.validateRealEmail(email).subscribe({
      next: (res) => {
        this.emailCheckMessage = res.message;
        this.emailCheckSuccess = res.real;
      },
      error: () => {
        this.emailCheckMessage = 'Failed to validate real email.';
        this.emailCheckSuccess = false;
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (this.userForm.invalid) {
      this.markFormGroupTouched();
      return;
    }
    this.isSubmitting = true;
    this.errorMessages = {};
    this.emailCheckMessage = '';
    this.emailCheckSuccess = false;
    const formValue = this.userForm.value;
    // Check if email is real before proceeding
    try {
      const realEmailRes = await this.userService.validateRealEmail(formValue.email).toPromise();
      if (!realEmailRes || !realEmailRes.real) {
        this.errorMessages['email'] = (realEmailRes && realEmailRes.message) ? realEmailRes.message : 'Email does not exist or is not active.';
        this.userForm.get('email')?.setErrors({ real: true });
        this.isSubmitting = false;
        return;
      }
    } catch (e) {
      this.errorMessages['email'] = 'Failed to validate real email.';
      this.userForm.get('email')?.setErrors({ real: true });
      this.isSubmitting = false;
      return;
    }
    // Map form values to backend DTO
    const selectedRole = this.roles.find(r => r.id == formValue.role);
    const payload = {
      name: `${formValue.firstName} ${formValue.lastName}`.trim(),
      email: formValue.email,
      password: formValue.password,
      gender: formValue.gender,
      dateOfBirth: formValue.dateOfBirth,
      phoneNumber: formValue.phone,
      role: selectedRole ? selectedRole.name : '',
      address: formValue.street,
      city: formValue.city,
      state: formValue.state,
      postalCode: formValue.zipCode,
      country: formValue.country,
      addressType: formValue.addressType || 'HOME',
      emailVerified: formValue.emailVerified,
      sendWelcomeEmail: formValue.sendWelcomeEmail
    };
    this.userService.createUserByAdmin(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.createdUser = res;
        // Optionally reset form
        this.userForm.reset();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.log('User creation error:', err); // Debug error structure
        if (err?.error?.message) {
          if (err.error.message.toLowerCase().includes('email')) {
            this.errorMessages['email'] = err.error.message;
            this.userForm.get('email')?.setErrors({ backend: true });
          } else if (err.error.message.toLowerCase().includes('password')) {
            this.errorMessages['password'] = err.error.message;
            this.userForm.get('password')?.setErrors({ backend: true });
          } else {
            this.errorMessages['general'] = err.error.message;
          }
        } else {
          this.errorMessages['general'] = 'Failed to create user: Unknown error';
        }
      }
    });
  }

  closeUserModal(): void {
    this.createdUser = null;
  }

  markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  resetForm(): void {
    this.userForm.reset();
    this.userForm.patchValue({
      isActive: true,
      emailVerified: false,
      sendWelcomeEmail: true,
      addressType: 'HOME'
    });
  }

  goBack(): void {
    this.router.navigate(['/admin-users']); // or your actual user list route
  }

  // Bulk Import Methods
  toggleBulkImport(): void {
    this.showBulkImport = !this.showBulkImport;
  }

  closeBulkImport(): void {
    this.showBulkImport = false;
    this.csvData = [];
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  processFile(file: File): void {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      alert('Please select a CSV file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      this.parseCsv(csv);
    };
    reader.readAsText(file);
  }

  parseCsv(csv: string): void {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    this.csvData = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim());
        const user: any = {};
        
        headers.forEach((header, index) => {
          user[header] = values[index] || '';
        });
        
        // Convert isActive to boolean
        user.isActive = user.isActive?.toLowerCase() === 'true';
        
        this.csvData.push(user);
      }
    }
  }

  downloadTemplate(): void {
    const csvContent = 'firstName,lastName,email,phone,role,isActive\n' +
                      'John,Doe,john.doe@example.com,+1234567890,customer,true\n' +
                      'Jane,Smith,jane.smith@example.com,+1234567891,staff,true';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user-import-template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  importUsers(): void {
    if (!this.csvData.length) return;
    this.isImporting = true;
    const results: { user: any, success: boolean, error?: string }[] = [];
    let completed = 0;
    for (const csvUser of this.csvData) {
      // Map CSV fields to backend DTO
      const selectedRole = this.roles.find(r => r.name.toLowerCase() === (csvUser.role || '').toLowerCase());
      const payload = {
        name: `${csvUser.firstName} ${csvUser.lastName}`.trim(),
        email: csvUser.email,
        password: 'Password123!', // Default or random password, or add to CSV
        gender: '',
        dateOfBirth: '',
        phoneNumber: csvUser.phone || '',
        role: selectedRole ? selectedRole.name : '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        addressType: csvUser.addressType || 'HOME',
        emailVerified: csvUser.emailVerified || false,
        sendWelcomeEmail: true // Assuming sendWelcomeEmail is true for bulk import
      };
      this.userService.createUserByAdmin(payload).subscribe({
        next: (res) => {
          results.push({ user: csvUser, success: true });
          checkDone();
        },
        error: (err) => {
          results.push({ user: csvUser, success: false, error: err?.error?.message || 'Unknown error' });
          checkDone();
        }
      });
    }
    const checkDone = () => {
      completed++;
      if (completed === this.csvData.length) {
        this.isImporting = false;
        // Show summary (could be a modal, alert, or UI section)
        const successCount = results.filter(r => r.success).length;
        const failCount = results.length - successCount;
        alert(`Bulk import complete. Success: ${successCount}, Failed: ${failCount}`);
        // Optionally, show details in the UI
      }
    };
  }
}