import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Policy, PolicyService } from '../services/policy.service';

@Component({
  selector: 'app-admin-policy',
  templateUrl: './admin-policy.component.html',
  standalone: false,
  styleUrl: './admin-policy.component.css'
})
export class AdminPolicyComponent implements OnInit {
  policies: Policy[] = [];
  policyForm: FormGroup;
  editingPolicy: Policy | null = null;
  loading = false;

  quillModules = {
    toolbar: [
      ['bold', 'italic']
    ]
  };

  constructor(
    private policyService: PolicyService,
    private fb: FormBuilder
  ) {
    this.policyForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadPolicies();
  }

  loadPolicies() {
    this.loading = true;
    this.policyService.getAllPolicies().subscribe({
      next: (policies) => {
        this.policies = policies;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  submitForm() {
    if (this.policyForm.invalid) return;
    const data = this.policyForm.value;
    if (this.editingPolicy) {
      this.policyService.updatePolicy(this.editingPolicy.id, data).subscribe(() => {
        this.cancelEdit();
        this.loadPolicies();
      });
    } else {
      this.policyService.createPolicy(data).subscribe(() => {
        this.policyForm.reset();
        this.loadPolicies();
      });
    }
  }

  editPolicy(policy: Policy) {
    this.editingPolicy = policy;
    this.policyForm.patchValue({
      title: policy.title,
      content: policy.content
    });
  }

  cancelEdit() {
    this.editingPolicy = null;
    this.policyForm.reset();
  }

  deletePolicy(id: number) {
    if (confirm('Are you sure you want to delete this policy?')) {
      this.policyService.deletePolicy(id).subscribe(() => {
        this.loadPolicies();
      });
    }
  }
}
