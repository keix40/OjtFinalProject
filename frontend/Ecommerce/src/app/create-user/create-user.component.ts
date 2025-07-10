import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';

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

  roleInformation: { [key: string]: RoleInfo } = {
    customer: {
      name: 'Customer',
      description: 'Regular customer with basic access to purchase products and manage their account.',
      permissions: ['View products', 'Place orders', 'Manage profile', 'View order history']
    },
    staff: {
      name: 'Staff Member',
      description: 'Staff member with access to basic administrative functions.',
      permissions: ['View customers', 'Process orders', 'Manage inventory', 'Generate reports']
    },
    manager: {
      name: 'Manager',
      description: 'Manager with elevated privileges to oversee operations.',
      permissions: ['Manage staff', 'View analytics', 'Approve refunds', 'Manage promotions', 'All staff permissions']
    },
    admin: {
      name: 'Administrator',
      description: 'Full system administrator with complete access to all features.',
      permissions: ['Full system access', 'Manage users', 'System configuration', 'Security settings', 'All permissions']
    },
    support: {
      name: 'Support Agent',
      description: 'Customer support agent with access to help customers.',
      permissions: ['View customer data', 'Process returns', 'Handle inquiries', 'Access support tools']
    }
  };

  constructor(
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit(): void {
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
      sendWelcomeEmail: [true]
    }, { validators: this.passwordMatchValidator });
  }

  setupFormSubscriptions(): void {
    this.userForm.get('role')?.valueChanges.subscribe(role => {
      // This will trigger the getter for selectedRoleInfo
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

  get selectedRoleInfo(): RoleInfo | null {
    const selectedRole = this.userForm.get('role')?.value;
    return selectedRole ? this.roleInformation[selectedRole] : null;
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
      email: 'john.doe@example.com',
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
      sendWelcomeEmail: true
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
    if (email) {
      // Simulate email validation
      console.log('Validating email:', email);
      // In a real application, you would make an API call here
      alert(`Email validation for ${email} - This would check if the email already exists in the system.`);
    } else {
      alert('Please enter an email address first.');
    }
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.isSubmitting = true;
      
      const formData = this.userForm.value;
      console.log('Creating user:', formData);
      
      // Simulate API call
      setTimeout(() => {
        this.isSubmitting = false;
        alert('User created successfully!');
        this.router.navigate(['/users']);
      }, 2000);
    } else {
      this.markFormGroupTouched();
    }
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
      sendWelcomeEmail: true
    });
  }

  goBack(): void {
    this.router.navigate(['/users']);
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
    if (this.csvData.length === 0) return;
    
    this.isImporting = true;
    
    // Simulate bulk import
    setTimeout(() => {
      this.isImporting = false;
      alert(`Successfully imported ${this.csvData.length} users!`);
      this.closeBulkImport();
    }, 3000);
  }
}