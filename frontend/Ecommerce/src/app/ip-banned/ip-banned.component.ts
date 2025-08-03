import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ip-banned',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
            IP Address Banned
          </h2>
          <p class="mt-2 text-sm text-gray-600">
            Your IP address has been temporarily banned due to suspicious activity.
          </p>
        </div>
        
        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <dl>
              <div class="sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 sm:py-4">
                <dt class="text-sm font-medium text-gray-500">
                  IP Address
                </dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {{ bannedIP }}
                </dd>
              </div>
              <div class="sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 sm:py-4">
                <dt class="text-sm font-medium text-gray-500">
                  Reason
                </dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {{ banMessage }}
                </dd>
              </div>
              <div class="sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 sm:py-4">
                <dt class="text-sm font-medium text-gray-500">
                  Duration
                </dt>
                <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  Temporary ban (usually 15 minutes)
                </dd>
              </div>
            </dl>
          </div>
        </div>
        
        <div class="text-center">
          <p class="text-sm text-gray-600 mb-4">
            If you believe this is an error, please contact support or try again later.
          </p>
          <button 
            (click)="checkBanStatus()"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Check Ban Status
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class IpBannedComponent implements OnInit {
  bannedIP: string = '';
  banMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Get ban details from route parameters or localStorage
    this.route.queryParams.subscribe(params => {
      this.bannedIP = params['ip'] || localStorage.getItem('ipBanIP') || 'Unknown';
      this.banMessage = params['message'] || localStorage.getItem('ipBanMessage') || 'IP address banned due to suspicious activity';
    });
  }

  checkBanStatus() {
    // Clear ban flags and try to access the app again
    localStorage.removeItem('ipBanned');
    localStorage.removeItem('ipBanMessage');
    localStorage.removeItem('ipBanIP');
    
    // Redirect to home page
    this.router.navigate(['/']);
  }
} 