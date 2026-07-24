import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Policy, PolicyService } from '../services/policy.service';
import { LuxDialogService } from '../shared/dialog/lux-dialog.service';

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
    private router: Router,
    private luxDialog: LuxDialogService
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
        this.luxDialog.error('Error', 'Failed to load policy. Please try again.').then(() => {
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
      this.luxDialog.error('Error', 'Policy ID not found.');
      return;
    }

    this.loading = true;
    const formData = this.policyForm.value;
    const data = {
      title: formData.title,
      content: formData.content,
      status: parseInt(formData.status, 10)
    };

    this.policyService.updatePolicy(this.policyId, data).subscribe({
      next: () => {
        this.loading = false;
        this.luxDialog.success('Success', 'Policy updated successfully.').then(() => {
          this.router.navigate(['/admin/policies']);
        });
      },
      error: (error) => {
        this.loading = false;
        console.error('Error updating policy:', error);
        this.luxDialog.error('Error', 'Failed to update policy. Please try again.');
      }
    });
  }

  cancelEdit() {
    this.router.navigate(['/admin/policies']);
  }

  private markFormGroupTouched() {
    Object.keys(this.policyForm.controls).forEach(key => {
      this.policyForm.get(key)?.markAsTouched();
    });
  }

  getFormControl(controlName: string) {
    return this.policyForm.get(controlName);
  }

  hasError(controlName: string, errorType: string): boolean {
    const control = this.getFormControl(controlName);
    return control ? control.hasError(errorType) && control.touched : false;
  }
}
