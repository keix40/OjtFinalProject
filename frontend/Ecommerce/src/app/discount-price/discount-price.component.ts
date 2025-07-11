import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-discount-price',
  standalone: false,
  templateUrl: './discount-price.component.html',
  styleUrl: './discount-price.component.css'
})
export class DiscountPriceComponent  {
  @Input() originalPrice!: number;
  @Input() discountedPrice!: number;
  @Input() discountAmount?: number;
  @Input() discountName?: string;
  @Input() quantity: number = 1;
  @Input() showBadge: boolean = true;
}