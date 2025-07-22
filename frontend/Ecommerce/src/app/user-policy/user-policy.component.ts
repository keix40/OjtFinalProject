import { Component, OnInit } from '@angular/core';
import { PolicyService, Policy } from '../services/policy.service';

@Component({
  selector: 'app-user-policy',
  templateUrl: './user-policy.component.html',
  styleUrls: ['./user-policy.component.css'],
  standalone: false
})
export class UserPolicyComponent implements OnInit {
  policies: Policy[] = [];
  loading = false;
  error: string | null = null;

  constructor(private policyService: PolicyService) {}

  ngOnInit(): void {
    this.fetchPolicies();
  }

  fetchPolicies() {
    this.loading = true;
    this.error = null;
    this.policyService.getAllPolicies().subscribe({
      next: (policies) => {
        // Add 'open' property to each policy for accordion
        this.policies = policies.map(p => ({ ...p, open: false }));
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load policies. Please try again later.';
        this.loading = false;
      }
    });
  }
}
