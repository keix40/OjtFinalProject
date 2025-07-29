import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Policy, PolicyService } from '../services/policy.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-policy-edit',
  templateUrl: './admin-policy-edit.component.html',
  standalone: false,
  styleUrl: './admin-policy-edit.component.css'
})
export class AdminPolicyEditComponent implements OnInit {
  policyForm: FormGroup;
  loading = false;
  policyId: number | null = null;
  policy: Policy | null = null;

  // Quill configuration
  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'header': [1, 2, 3, false] }],
      ['link'],
      ['clean']
    ]
  };

  quillConfig = {
    placeholder: 'Enter policy content...',
    theme: 'snow',
    modules: this.quillModules
  };

  constructor(
    private policyService: PolicyService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.policyForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      status: ['1', Validators.required]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.policyId = +params['id'];
      if (this.policyId) {
        this.loadPolicy();
      }
    });
  }

  loadPolicy() {
    if (!this.policyId) return;
    
    this.loading = true;
    this.policyService.getPolicyById(this.policyId).subscribe({
      next: (policy) => {
        this.policy = policy;
        this.policyForm.patchValue({
          title: policy.title,
          content: policy.content,
          status: policy.status ? policy.status.toString() : '1'
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading policy:', error);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load policy. Please try again.',
          confirmButtonText: 'OK'
        }).then(() => {
          this.router.navigate(['/admin/policies']);
        });
      }
    });
  }

  submitForm() {
    if (this.policyForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    if (!this.policyId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Policy ID not found.',
        confirmButtonText: 'OK'
      });
      return;
    }

    this.loading = true;
    const formData = this.policyForm.value;
    const data = {
      title: formData.title,
      content: formData.content,
      status: parseInt(formData.status)
    };

    this.policyService.updatePolicy(this.policyId, data).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Policy updated successfully.',
          confirmButtonText: 'OK'
        }).then(() => {
          this.router.navigate(['/admin/policies']);
        });
      },
      error: (error) => {
        this.loading = false;
        console.error('Error updating policy:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update policy. Please try again.',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  cancelEdit() {
    this.router.navigate(['/admin/policies']);
  }

  // Helper method to mark all form controls as touched
  private markFormGroupTouched() {
    Object.keys(this.policyForm.controls).forEach(key => {
      const control = this.policyForm.get(key);
      control?.markAsTouched();
    });
  }

  // Get form control for template access
  getFormControl(controlName: string) {
    return this.policyForm.get(controlName);
  }

  // Check if form control has error
  hasError(controlName: string, errorType: string): boolean {
    const control = this.getFormControl(controlName);
    return control ? control.hasError(errorType) && control.touched : false;
  }
} 