import { Component } from '@angular/core';
import { BreadcrumbService } from '../breadcrumb.service';

@Component({
  selector: 'app-layout',
  standalone: false,
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
  constructor(public breadcrumbService: BreadcrumbService) {}
}
