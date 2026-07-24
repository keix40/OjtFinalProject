import { Component, OnInit } from '@angular/core';
import { PolicyService, Policy } from '../services/policy.service';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-user-policy',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './user-policy.component.html',
  styleUrls: ['./user-policy.component.css']
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
        // Filter policies with status not equal to 2 and add 'open' property for accordion
        this.policies = policies
          .filter(p => p.status !== 2)
          .map(p => ({ ...p, open: false }));
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load policies. Please try again later.';
        this.loading = false;
      }
    });
  }

  getFilteredPolicies(): Policy[] {
    return this.policies.filter(p => p.status !== 2);
  }
}
