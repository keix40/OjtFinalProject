import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class BreadcrumbComponent {
  private _items: { label: string, link?: string }[] = [];
  @Input() set items(val: { label: string, link?: string }[] | null | undefined) {
    this._items = val ?? [];
  }
  get items() {
    return this._items;
  }
} 