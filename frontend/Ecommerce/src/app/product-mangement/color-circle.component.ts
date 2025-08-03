import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-color-circle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isHexColor" 
         class="inline-block w-4 h-4 rounded-full border border-gray-300 mr-1"
         [style.background-color]="colorValue"
         [title]="colorValue">
    </div>
    <span *ngIf="!isHexColor">{{ colorValue }}</span>
  `,
  styles: [`
    .inline-block {
      display: inline-block;
      vertical-align: middle;
    }
  `]
})
export class ColorCircleComponent {
  @Input() colorValue: string = '';
  @Input() attributeName: string = '';

  get isHexColor(): boolean {
    if (!this.colorValue || !this.attributeName) return false;
    
    const name = this.attributeName.toLowerCase().trim();
    const isColorAttr = ['color', 'colors', 'colour', 'colours'].includes(name);
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    
    return isColorAttr && hexRegex.test(this.colorValue.trim());
  }
} 