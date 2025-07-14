import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotifcationService } from './notifcation.service';
import { IpService } from './services/ip.service';
import { LoginAttemptsService } from './services/login-attempts.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Britium Gallary';
  constructor(
    private router: Router,
    private notificationService: NotifcationService,
    private ipService: IpService,
    private loginAttemptsService: LoginAttemptsService
  ) {}

  ngOnInit() {
    this.ipService.getPublicIp().subscribe(ip => {
      if (ip) {
        this.loginAttemptsService.isIPBlocked(ip).subscribe(res => {
          if (res.blocked) {
            this.router.navigate(['/banned'], { queryParams: { until: res.blockedUntil } });
          }
        });
      }
    });
  }
}
