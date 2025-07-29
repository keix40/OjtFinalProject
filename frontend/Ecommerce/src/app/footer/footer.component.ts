import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CategoryService } from '../services/category.service';
import { BrandService } from '../services/brand.service';
import { Category } from '../category';
import { BrandListDTO } from '../brand';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class FooterComponent implements OnInit {
  // Company Information
  companyName = 'Gallery';
  companyDescription = 'Your premier destination for quality products and exceptional shopping experience. We curate the best products from around the world to bring you style, quality, and value.';
  currentYear = new Date().getFullYear();

  // Dynamic Data
  categories: Category[] = [];
  brands: BrandListDTO[] = [];
  loading = false;

  // Social Media Links
  socialMediaLinks = [
    {
      name: 'Facebook',
      url: 'https://facebook.com',
      icon: 'M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z'
    },
    {
      name: 'Twitter',
      url: 'https://twitter.com',
      icon: 'M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z'
    },
    {
      name: 'Pinterest',
      url: 'https://pinterest.com',
      icon: 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.222.083.343-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.878-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z'
    },
    {
      name: 'Instagram',
      url: 'https://instagram.com',
      icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z'
    }
  ];

  // Support Links
  supportLinks = [
    { name: 'Help Center', url: '/help-center' },
    { name: 'Contact Us', url: '/contact-us' },
    { name: 'Shipping Info', url: '/shipping-info' },
    { name: 'Returns', url: '/returns' },
    { name: 'Size Guide', url: '/size-guide' },
    { name: 'Track Order', url: '/track-order' }
  ];

  // Company Links
  companyLinks = [
    { name: 'About Us', url: '/about-us' },
    { name: 'Careers', url: '/careers' },
    { name: 'Press', url: '/press' },
    { name: 'Privacy Policy', url: '/privacy-policy' },
    { name: 'Terms of Service', url: '/terms-of-service' },
    { name: 'Accessibility', url: '/accessibility' }
  ];

  // Payment Methods
  paymentMethods = [
    { name: 'VISA', code: 'VISA' },
    { name: 'MasterCard', code: 'MC' },
    { name: 'American Express', code: 'AMEX' },
    { name: 'PayPal', code: 'PP' }
  ];

  constructor(
    private categoryService: CategoryService,
    private brandService: BrandService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFooterData();
  }

  loadFooterData(): void {
    this.loading = true;
    
    // Load categories for Shop section
    this.categoryService.getAllCategory().subscribe({
      next: (categories) => {
        this.categories = categories.slice(0, 6); // Show first 6 categories
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.loading = false;
      }
    });

    // Load brands for additional shop options
    this.brandService.getAllBrand().subscribe({
      next: (brands) => {
        this.brands = brands.slice(0, 4); // Show first 4 brands
      },
      error: (error) => {
        console.error('Error loading brands:', error);
      }
    });
  }

  // Get category image URL
  getCategoryImageUrl(category: Category): string {
    if (!category.image || category.image.includes('null')) {
      return 'assets/images/default-category.svg';
    }
    if (category.image.startsWith('http://') || category.image.startsWith('https://')) {
      return category.image;
    }
    return `http://localhost:8080${category.image}`;
  }

  // Get brand image URL
  getBrandImageUrl(brand: BrandListDTO): string {
    if (!brand.image || brand.image.includes('null')) {
      return 'assets/images/default-brand.svg';
    }
    if (brand.image.startsWith('http://') || brand.image.startsWith('https://')) {
      return brand.image;
    }
    return `http://localhost:8080${brand.image}`;
  }

  // Navigate to category
  navigateToCategory(category: Category): void {
    // Navigate to category list with filter
    this.router.navigate(['/usercategorylist'], { 
      queryParams: { category: category.id } 
    });
  }

  // Navigate to brand
  navigateToBrand(brand: BrandListDTO): void {
    // Navigate to brand list with filter
    this.router.navigate(['/userbrandlist'], { 
      queryParams: { brand: brand.id } 
    });
  }
} 