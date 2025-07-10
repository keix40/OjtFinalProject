import { Injectable } from '@angular/core';

export interface ImageConfig {
  baseUrl: string;
  defaultProductImage: string;
  defaultAvatarImage: string;
  defaultCategoryImage: string;
  defaultBrandImage: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private config: ImageConfig = {
    baseUrl: 'http://localhost:8080',
    defaultProductImage: '/assets/project_img/fashion_store.jpg',
    defaultAvatarImage: '/assets/images/test.jpg',
    defaultCategoryImage: '/assets/project_img/default-category.png',
    defaultBrandImage: '/assets/project_img/default-brand.png'
  };

  constructor() { }

  /**
   * Get full URL for any image path
   * @param imagePath - The relative path from backend
   * @returns Full URL with base URL prepended
   */
  getFullImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) {
      return this.config.defaultProductImage;
    }

    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // If it's an asset path, return as is
    if (imagePath.startsWith('/assets/')) {
      return imagePath;
    }

    // If it's a data URI, return as is
    if (imagePath.startsWith('data:')) {
      return imagePath;
    }

    // Otherwise, prepend the base URL
    return `${this.config.baseUrl}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
  }

  /**
   * Get product image URL with fallback
   * @param product - Product object with image information
   * @returns Full URL for product image
   */
  getProductImageUrl(product: any): string {
    // Handle different product image structures
    if (product.productImages && product.productImages.length > 0) {
      return this.getFullImageUrl(product.productImages[0].imageUrl);
    }
    
    if (product.image) {
      return this.getFullImageUrl(product.image);
    }
    
    if (product.imageUrl) {
      return this.getFullImageUrl(product.imageUrl);
    }

    return this.config.defaultProductImage;
  }

  /**
   * Get avatar image URL with fallback
   * @param user - User object with avatar information
   * @returns Full URL for avatar image
   */
  getAvatarImageUrl(user: any): string {
    if (user.avatar) {
      return this.getFullImageUrl(user.avatar);
    }
    
    if (user.profileImage) {
      return this.getFullImageUrl(user.profileImage);
    }
    
    if (user.image) {
      return this.getFullImageUrl(user.image);
    }

    return this.config.defaultAvatarImage;
  }

  /**
   * Get category image URL with fallback
   * @param category - Category object with image information
   * @returns Full URL for category image
   */
  getCategoryImageUrl(category: any): string {
    if (category.image) {
      return this.getFullImageUrl(category.image);
    }
    
    if (category.imageUrl) {
      return this.getFullImageUrl(category.imageUrl);
    }

    return this.config.defaultCategoryImage;
  }

  /**
   * Get brand image URL with fallback
   * @param brand - Brand object with image information
   * @returns Full URL for brand image
   */
  getBrandImageUrl(brand: any): string {
    if (brand.image) {
      return this.getFullImageUrl(brand.image);
    }
    
    if (brand.imageUrl) {
      return this.getFullImageUrl(brand.imageUrl);
    }

    return this.config.defaultBrandImage;
  }

  /**
   * Handle image loading errors
   * @param event - Error event from img element
   * @param fallbackType - Type of fallback image to use
   * @param fallbackData - Additional data for fallback (e.g., user name for avatar)
   */
  handleImageError(event: any, fallbackType: 'product' | 'avatar' | 'category' | 'brand' | 'custom' = 'product', fallbackData?: any): void {
    let fallbackUrl = this.config.defaultProductImage;

    switch (fallbackType) {
      case 'avatar':
        if (fallbackData && typeof fallbackData === 'string') {
          // Generate avatar with initials
          fallbackUrl = this.generateAvatarWithInitials(fallbackData);
        } else {
          fallbackUrl = this.config.defaultAvatarImage;
        }
        break;
      case 'category':
        fallbackUrl = this.config.defaultCategoryImage;
        break;
      case 'brand':
        fallbackUrl = this.config.defaultBrandImage;
        break;
      case 'custom':
        fallbackUrl = fallbackData || this.config.defaultProductImage;
        break;
      default:
        fallbackUrl = this.config.defaultProductImage;
    }

    event.target.src = fallbackUrl;
  }

  /**
   * Generate avatar with user initials
   * @param name - User's full name
   * @returns Data URI for SVG avatar
   */
  generateAvatarWithInitials(name: string): string {
    if (!name) {
      return this.config.defaultAvatarImage;
    }

    const initials = name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', 
      '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', 
      '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', 
      '#ff5722', '#795548', '#9e9e9e', '#607d8b'
    ];
    
    const charCodeSum = name.charCodeAt(0) + name.charCodeAt(name.length - 1);
    const color = colors[charCodeSum % colors.length];

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="${color}"></rect>
        <text x="50%" y="50%" font-size="40" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" fill="#fff">${initials}</text>
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Check if image URL is valid
   * @param url - Image URL to validate
   * @returns Promise that resolves to boolean
   */
  async isValidImageUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  /**
   * Update configuration
   * @param newConfig - New configuration object
   */
  updateConfig(newConfig: Partial<ImageConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   * @returns Current configuration object
   */
  getConfig(): ImageConfig {
    return { ...this.config };
  }
} 