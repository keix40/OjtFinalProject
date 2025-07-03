import { Component } from '@angular/core';
import { NotifcationService } from './notifcation.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'final_Prj';
  constructor(private notificationService: NotifcationService) {
  }
}
