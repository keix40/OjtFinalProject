import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Policy, PolicyService } from '../services/policy.service';
import { Router } from '@angular/router';
import { LuxDialogService } from '../shared/dialog/lux-dialog.service';

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
  activeMenu: number | null = null;
  selectedPolicy: Policy | null = null;
  selectAll = false;
  selectedPolicies: Policy[] = [];

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
    this.loadPolicies();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(_event: MouseEvent) {
    if (this.activeMenu !== null) {
      this.activeMenu = null;
    }
  }

  loadPolicies() {
    this.loading = true;
    this.policyService.getAllPolicies().subscribe({
      next: (policies) => {
        this.policies = policies
          .filter(policy => policy.status !== 2)
          .map(policy => ({ ...policy, checked: false }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading policies:', error);
        this.loading = false;
        this.luxDialog.error('Error', 'Failed to load policies. Please try again.');
      }
    });
  }

  toggleAllCheckboxes() {
    this.policies.forEach(policy => {
      policy.checked = this.selectAll;
    });
    this.updateSelection();
  }

  updateSelection() {
    this.selectedPolicies = this.policies.filter(policy => policy.checked);
    this.selectAll = this.policies.length > 0 && this.policies.every(policy => policy.checked);
  }

  editPolicy(policy: Policy | null) {
    if (!policy) return;
    this.router.navigate(['/admin/policies/edit', policy.id]);
  }

  editPolicyInPage(policy: Policy) {
    this.editingPolicy = policy;
    this.policyForm.patchValue({
      title: policy.title,
      content: policy.content,
      status: policy.status ? policy.status.toString() : '1'
    });
    this.activeMenu = null;
  }

  submitForm() {
    if (this.policyForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const formData = this.policyForm.value;
    const data = {
      title: formData.title,
      content: formData.content,
      status: parseInt(formData.status, 10)
    };

    if (this.editingPolicy) {
      this.policyService.updatePolicy(this.editingPolicy.id, data).subscribe({
        next: () => {
          this.loading = false;
          this.cancelEdit();
          this.loadPolicies();
          this.luxDialog.success('Success', 'Policy updated successfully.');
        },
        error: (error) => {
          this.loading = false;
          console.error('Error updating policy:', error);
          this.luxDialog.error('Error', 'Failed to update policy. Please try again.');
        }
      });
    } else {
      this.policyService.createPolicy(data).subscribe({
        next: () => {
          this.loading = false;
          this.policyForm.reset({ status: '1' });
          this.loadPolicies();
          this.luxDialog.success('Success', 'Policy created successfully.');
        },
        error: (error) => {
          this.loading = false;
          console.error('Error creating policy:', error);
          this.luxDialog.error('Error', 'Failed to create policy. Please try again.');
        }
      });
    }
  }

  cancelEdit() {
    this.editingPolicy = null;
    this.policyForm.reset({ status: '1' });
    this.activeMenu = null;
  }

  async deletePolicy(id: number) {
    const confirmed = await this.luxDialog.confirm({
      title: 'Delete this policy?',
      text: 'This policy will be moved to deleted status and hidden from the list.',
      confirmText: 'Yes, delete it',
      cancelText: 'Cancel',
      destructive: true
    });

    if (!confirmed) return;

    this.policyService.deletePolicy(id).subscribe({
      next: () => {
        this.loadPolicies();
        this.activeMenu = null;
        this.luxDialog.success('Deleted', 'Policy has been moved to deleted status.');
      },
      error: (error) => {
        console.error('Error deleting policy:', error);
        this.luxDialog.error('Error', 'Failed to delete policy. Please try again.');
      }
    });
  }

  togglePolicyMenu(policyId: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.activeMenu = this.activeMenu === policyId ? null : policyId;
  }

  viewPolicyDetail(policy: Policy) {
    this.selectedPolicy = policy;
    this.activeMenu = null;
  }

  closePolicyDetail() {
    this.selectedPolicy = null;
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
