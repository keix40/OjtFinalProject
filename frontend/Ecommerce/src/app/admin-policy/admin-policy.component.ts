import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Policy, PolicyService } from '../services/policy.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

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

  // Simple Quill configuration matching the design
  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'header': [1, 2, 3, false] }],
      ['link'],
      ['clean']
    ]
  };

  // Quill editor configuration
  quillConfig = {
    placeholder: 'Enter policy content...',
    theme: 'snow',
    modules: this.quillModules
  };

  constructor(
    private policyService: PolicyService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.policyForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      status: ['1', Validators.required]
    });
  }

  ngOnInit() {
    this.loadPolicies();
    // Test Quill editor initialization
    setTimeout(() => {
      console.log('Quill editor should be initialized now');
    }, 1000);
  }

  // Close dropdown menus when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.activeMenu !== null) {
      this.activeMenu = null;
    }
  }

  loadPolicies() {
    this.loading = true;
    this.policyService.getAllPolicies().subscribe({
      next: (policies) => {
        // Filter out deleted policies (status = 2) and add checked property
        this.policies = policies
          .filter(policy => policy.status !== 2) // Exclude deleted policies
          .map(policy => ({ ...policy, checked: false }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading policies:', error);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load policies. Please try again.',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  // Checkbox functionality
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

  // Edit policy functionality
  editPolicy(policy: Policy) {
    // Navigate to edit page with policy ID
    this.router.navigate(['/admin/policies/edit', policy.id]);
  }

  // Edit policy in current page (fallback)
  editPolicyInPage(policy: Policy) {
    this.editingPolicy = policy;
    this.policyForm.patchValue({
      title: policy.title,
      content: policy.content,
      status: policy.status ? policy.status.toString() : '1'
    });
    this.activeMenu = null;
    
    // Scroll to form
    setTimeout(() => {
      const formElement = document.querySelector('.bg-white.rounded-xl');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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
      status: parseInt(formData.status)
    };

    if (this.editingPolicy) {
      this.policyService.updatePolicy(this.editingPolicy.id, data).subscribe({
        next: () => {
          this.loading = false;
          this.cancelEdit();
          this.loadPolicies();
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Policy updated successfully.',
            confirmButtonText: 'OK'
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
    } else {
      this.policyService.createPolicy(data).subscribe({
        next: () => {
          this.loading = false;
          this.policyForm.reset({
            status: '1'
          });
          this.loadPolicies();
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Policy created successfully.',
            confirmButtonText: 'OK'
          });
        },
        error: (error) => {
          this.loading = false;
          console.error('Error creating policy:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to create policy. Please try again.',
            confirmButtonText: 'OK'
          });
        }
      });
    }
  }

  cancelEdit() {
    this.editingPolicy = null;
    this.policyForm.reset({
      status: '1'
    });
    this.activeMenu = null;
  }

  deletePolicy(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This policy will be moved to deleted status and hidden from the list.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.policyService.deletePolicy(id).subscribe({
          next: () => {
            this.loadPolicies();
            this.activeMenu = null;
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Policy has been moved to deleted status and hidden from the list.',
              confirmButtonText: 'OK'
            });
          },
          error: (error) => {
            console.error('Error deleting policy:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to delete policy. Please try again.',
              confirmButtonText: 'OK'
            });
          }
        });
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
