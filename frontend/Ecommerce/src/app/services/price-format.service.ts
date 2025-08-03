import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PriceFormatService {

  constructor() { }

  /**
   * Formats a price with thousand separators and handles decimals
   * @param price - The price to format
   * @param currency - The currency symbol (default: 'MMK')
   * @returns Formatted price string
   */
  formatPrice(price: number, currency: string = 'MMK'): string {
    if (price === null || price === undefined || isNaN(price)) {
      return `0 ${currency}`;
    }

    // Round to whole number if it's a decimal
    const roundedPrice = Math.round(price);
    
    // Format with thousand separators
    const formattedPrice = roundedPrice.toLocaleString('en-US');
    
    return `${formattedPrice} ${currency}`;
  }

  /**
   * Formats a price without currency symbol
   * @param price - The price to format
   * @returns Formatted price string without currency
   */
  formatPriceOnly(price: number): string {
    if (price === null || price === undefined || isNaN(price)) {
      return '0';
    }

    // Round to whole number if it's a decimal
    const roundedPrice = Math.round(price);
    
    // Format with thousand separators
    return roundedPrice.toLocaleString('en-US');
  }

  /**
   * Formats a discounted price calculation
   * @param originalPrice - The original price
   * @param discountValue - The discount value
   * @param discountType - The type of discount ('PERCENTAGE' or 'FIXED')
   * @param currency - The currency symbol (default: 'MMK')
   * @returns Formatted discounted price string
   */
  formatDiscountedPrice(originalPrice: number, discountValue: number, discountType: string, currency: string = 'MMK'): string {
    if (!originalPrice || !discountValue || !discountType) {
      return this.formatPrice(originalPrice, currency);
    }
    
    let discountedPrice: number;
    if (discountType === 'PERCENTAGE') {
      discountedPrice = originalPrice - (originalPrice * discountValue);
    } else {
      discountedPrice = Math.max(0, originalPrice - discountValue);
    }
    
    return this.formatPrice(discountedPrice, currency);
  }

  /**
   * Formats discount text (e.g., "10% OFF" or "1000 MMK OFF")
   * @param discountValue - The discount value
   * @param discountType - The type of discount ('PERCENTAGE' or 'FIXED')
   * @returns Formatted discount text
   */
  formatDiscountText(discountValue: number, discountType: string): string {
    if (!discountValue || !discountType) {
      return '';
    }
    
    if (discountType === 'PERCENTAGE') {
      // Convert decimal to percentage (e.g., 0.1 -> 10%, 0.25 -> 25%)
      const percentage = Math.round(discountValue * 100);
      return `${percentage}% OFF`;
    } else {
      return `${this.formatPriceOnly(discountValue)} MMK OFF`;
    }
  }
} 