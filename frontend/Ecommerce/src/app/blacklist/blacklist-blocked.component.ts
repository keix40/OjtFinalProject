import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BlacklistService } from '../services/blacklist.service';
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-blacklist-blocked',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './blacklist-blocked.component.html',
  styleUrls: ['./blacklist-blocked.component.css']
})
export class BlacklistBlockedComponent implements OnInit, OnDestroy {
  @Input() reason: string = '';
  @Input() expiryDate: Date | string | null = null;
  @Input() banType: string = 'Temporary';
  @Input() isPermanent: boolean = false;
  
  countdown: string = '';
  showAppealForm: boolean = false;
  submittingAppeal: boolean = false;
  appealForm: FormGroup;
  
  private timer: any;
  private blacklistCheckSubscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blacklistService: BlacklistService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.appealForm = this.fb.group({
      appealReason: ['', Validators.required],
      appealDetails: ['', [Validators.required, Validators.minLength(20)]],
      contactEmail: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (!this.reason && params['reason']) {
        this.reason = params['reason'];
      }
      if (!this.expiryDate && params['expiryDate']) {
        this.expiryDate = params['expiryDate'];
      }
      if (!this.banType && params['banType']) {
        this.banType = params['banType'];
      }
      if (params['isPermanent']) {
        this.isPermanent = params['isPermanent'] === 'true';
      }
      this.startCountdown();
    });
    this.startCountdown();
    
    // Start periodic blacklist status checking
    this.startBlacklistCheck();
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    if (this.blacklistCheckSubscription) {
      this.blacklistCheckSubscription.unsubscribe();
    }
  }

  startCountdown() {
    // Don't start countdown for permanent bans
    if (this.isPermanent || !this.expiryDate) return;
    
    if (this.timer) clearInterval(this.timer);
    this.updateCountdown();
    this.timer = setInterval(() => this.updateCountdown(), 1000);
  }

  updateCountdown() {
    if (this.isPermanent || !this.expiryDate) {
      this.countdown = '';
      return;
    }
    
    const now = new Date();
    const expiry = new Date(this.expiryDate);
    let diff = Math.max(0, expiry.getTime() - now.getTime());
    if (diff === 0) {
      this.countdown = 'Blacklist expired';
      clearInterval(this.timer);
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * 1000 * 60 * 60 * 24;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * 1000 * 60 * 60;
    const minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * 1000 * 60;
    const seconds = Math.floor(diff / 1000);
    this.countdown =
      (days > 0 ? days + ' day' + (days > 1 ? 's ' : ' ') : '') +
      (hours > 0 ? hours + ' hour' + (hours > 1 ? 's ' : ' ') : '') +
      (minutes > 0 ? minutes + ' minute' + (minutes > 1 ? 's ' : ' ') : '') +
      seconds + ' second' + (seconds !== 1 ? 's' : '');
  }

  private startBlacklistCheck() {
    // Check every 10 seconds if user is still blacklisted
    this.blacklistCheckSubscription = interval(10000)
      .subscribe(() => {
        console.log('[BlacklistBlockedComponent] Checking if user is still blacklisted...');
        this.blacklistService.checkCurrentUserBlacklistStatus().subscribe(isBlacklisted => {
          if (!isBlacklisted) {
            console.log('[BlacklistBlockedComponent] User is no longer blacklisted, redirecting to home');
            // Clear localStorage flags
            localStorage.removeItem('blacklisted');
            localStorage.removeItem('blacklistReason');
            localStorage.removeItem('blacklistExpiryDate');
            localStorage.removeItem('banType');
            localStorage.removeItem('isPermanent');
            
            // Redirect to home page
            this.router.navigate(['/']);
          }
        });
      });
  }

  submitAppeal(): void {
    if (this.appealForm.valid) {
      this.submittingAppeal = true;
      
      const appealData = {
        ...this.appealForm.value,
        blacklistReason: this.reason,
        banType: this.banType,
        isPermanent: this.isPermanent,
        submittedAt: new Date().toISOString()
      };

      console.log('[BlacklistBlockedComponent] Submitting appeal:', appealData);
      
      // Call backend API to submit appeal
      this.blacklistService.submitAppeal(appealData).subscribe({
        next: (response) => {
          console.log('[BlacklistBlockedComponent] Appeal submitted successfully:', response);
          this.toastr.success('Your appeal has been submitted successfully. We will review it within 24-48 hours.');
          this.showAppealForm = false;
          this.appealForm.reset();
          this.submittingAppeal = false;
        },
        error: (error) => {
          console.error('[BlacklistBlockedComponent] Error submitting appeal:', error);
          this.toastr.error('Failed to submit appeal. Please try again later.');
          this.submittingAppeal = false;
        }
      });
    }
  }
} 