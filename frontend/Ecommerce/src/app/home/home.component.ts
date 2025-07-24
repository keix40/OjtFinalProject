import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DiscountService } from '../services/discount.service';
import { NotificationService } from '../services/notification.service';
import { NotifcationService } from '../notifcation.service';
import { CategoryService } from '../services/category.service';
import { Category } from '../category'; // Use the flat Category interface
import { BrandService } from '../services/brand.service';
import { BrandListDTO } from '../brand';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { RouterModule, Router } from '@angular/router';
import { ReviewService } from '../services/review.service';
import { ProductService } from '../services/product.service';
import { ProductDTO } from '../product';
import { ProductList } from '../product';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  @ViewChild('brandRow') brandRow!: ElementRef<HTMLDivElement>;
  categories: Category[] = [];
  brands: BrandListDTO[] = [];
  reviews: any[] = [];
  reviewsLoading = false;
  reviewsError = '';
  loading = false;
  error = '';
  featuredProducts: ProductDTO[] = [];
  trendingProducts: ProductList[] = [];
  firstTimeBuyerNotification: any = null;
  showFirstTimeBuyerAlert = false;

  constructor(
    private categoryService: CategoryService,
    private brandService: BrandService,
    private reviewService: ReviewService,
    private router: Router,
    private productService: ProductService,
    private notificationService : NotificationService,
    private notifcationService : NotifcationService,
    private discountService: DiscountService,
    private http: HttpClient, // Inject HttpClient
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.loadCategory();
    this.loadBrands();
    this.loadReviews();
    this.loadFeaturedProducts();
    this.loadTrendingProducts();
    this.checkFirstTimeBuyerNotification();
  }

  checkFirstTimeBuyerNotification() {
    console.log('[HomeComponent] Checking first time buyer notification...');
    this.http.get<any>('http://localhost:8080/api/notifications/check-first-time-buyer').subscribe({
      next: (notification) => {
        if (notification && notification.message && notification.type === 'first time buyer discount') {
        const lastShown = localStorage.getItem('ftb_discount_last_shown');
        const now = Date.now();
        const sixHours = 6 * 60 * 60 * 1000;
        if (!lastShown || now - parseInt(lastShown, 10) > sixHours) {
          this.firstTimeBuyerNotification = notification;
          this.showFirstTimeBuyerAlert = true;
          localStorage.setItem('ftb_discount_last_shown', now.toString());
          console.log('[HomeComponent] Showing first time buyer discount notification.');
        } else {
          console.log('[HomeComponent] Not showing: shown less than 6 hours ago.');
        } 
      } else {
          console.log('[HomeComponent] User is not eligible or no notification returned:', notification);
        }
      },
      error: (err) => {
        console.error('[HomeComponent] First time buyer check error');
      }
    });
  }

  closeFirstTimeBuyerAlert() {
    this.showFirstTimeBuyerAlert = false;
  }

  loadCategory(){
    this.loading = true;
    this.categoryService.getAllCategory().subscribe({
      next: (data) => {
        this.categories = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load categories.';
        this.loading = false;
      }
    });
  }

  loadBrands() {
    this.brandService.getAllBrand().subscribe({
      next: (data) => {
        this.brands = data;
      },
      error: (err) => {
        // Optionally handle error
      }
    });
  }

  loadReviews() {
    this.reviewsLoading = true;
    this.reviewService.getTop5StarReviews().subscribe({
      next: (data) => {
        this.reviews = data;
        this.reviewsLoading = false;
      },
      error: () => {
        this.reviewsError = 'Failed to load reviews.';
        this.reviewsLoading = false;
      }
    });
  }

  loadFeaturedProducts() {
    this.productService.getLatestProducts().subscribe({
      next: (products) => {
        this.featuredProducts = products;
      },
      error: () => {
        // Optionally handle error
      }
    });
  }

  loadTrendingProducts() {
    this.productService.getTopOrderedProducts().subscribe({
      next: (products) => {
        this.trendingProducts = products;
      },
      error: () => {
        // Optionally handle error
      }
    });
  }

  scrollBrands(direction: 'left' | 'right') {
    const row = this.brandRow?.nativeElement;
    if (!row) return;
    const card = row.querySelector('div.group');
    const cardWidth = card ? (card as HTMLElement).offsetWidth + 24 : 180; // 24px gap
    if (direction === 'left') {
      row.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    } else {
      row.scrollBy({ left: cardWidth, behavior: 'smooth' });
    }
  }

  getCategoryImageUrl(cat: Category): string {
    if (!cat.image || cat.image.includes('null')) return 'assets/images/default-brand.svg';
    if (cat.image.startsWith('http://') || cat.image.startsWith('https://')) return cat.image;
    return `http://localhost:8080${cat.image}`;
  }

  getSafeIconUrl(cat: Category): SafeUrl | string | undefined {
    if (cat.iconUrl) {
      if (cat.iconUrl.startsWith('data:image')) {
        return this.sanitizer.bypassSecurityTrustUrl(cat.iconUrl);
      }
      if (cat.iconUrl.startsWith('http://') || cat.iconUrl.startsWith('https://')) {
        return cat.iconUrl;
      }
      // If it's a relative path (uploaded file)
      return `http://localhost:8080${cat.iconUrl.startsWith('/') ? cat.iconUrl : '/' + cat.iconUrl}`;
    }
    return undefined;
  }

  getBrandImageUrl(brand: BrandListDTO): string {
    if (!brand.image || brand.image.trim() === '') {
      return 'assets/images/default-brand.svg';
    }
    if (brand.image.startsWith('http://') || brand.image.startsWith('https://')) {
      return brand.image;
    }
    if (brand.image.startsWith('/assets/')) {
      return brand.image;
    }
    return `http://localhost:8080${brand.image.startsWith('/') ? brand.image : '/' + brand.image}`;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  getReviewUserImage(review: any): string {
    if (!review.userImage) return '';
    if (review.userImage.startsWith('http://') || review.userImage.startsWith('https://')) {
      return review.userImage;
    }
    // Always ensure a leading slash for local images
    const path = review.userImage.startsWith('/') ? review.userImage : '/' + review.userImage;
    return `http://localhost:8080${path}`;
  }

  getAllCategoriesUrl() {
    return '/usercategorylist';
  }

  getAllBrandsUrl() {
    return '/userbrandlist';
  }

  goToCategory(cat: Category) {
    this.router.navigate(['/userproductlist'], { queryParams: { category: cat.name } });
  }

  goToBrand(brand: BrandListDTO) {
    // You can add query param or route as needed
    this.router.navigate(['/userproductlist'], { queryParams: { brand: brand.name } });
  }

  goToProductDetail(product: ProductDTO) {
    this.router.navigate(['/product', product.id]);
  }

  goToTrendingProductDetail(product: ProductList) {
    this.router.navigate(['/product', product.id]);
  }

  goToAllProducts() {
    this.router.navigate(['/userproductlist']);
  }
   showActiveDiscountNotification() {
    this.discountService.getAllDiscount().subscribe(discounts => {
      const now = new Date();
      const activeDiscount = discounts.find(d =>
        d.status &&
        new Date(d.startDate) <= now &&
        new Date(d.endDate) >= now
      );
      if (activeDiscount) {
        let discountValueText = '';
        if (activeDiscount.discountType === 'PERCENTAGE') {
          const percent = (activeDiscount.discountValue <= 1 && activeDiscount.discountValue !== 0)
            ? activeDiscount.discountValue * 100
            : activeDiscount.discountValue;
          discountValueText = `${percent}% off`;
        } else {
          discountValueText = `${activeDiscount.discountValue} MMK off`;
        }
        
        const notificationMessage = `🔥 "${activeDiscount.name}" is live: ${discountValueText}! Click here to view products.`;
        
        // 1. Show pop-up notification
        this.notificationService.showInfo(
          notificationMessage,
          '/userproductlist'
        );
        
        // 2. Add to user's notification list
        const notificationData = {
          message: notificationMessage,
          timestamp: new Date().toISOString(),
          type: 'discount',
          link: '/userproductlist'
        };
        this.notifcationService.sendNotification(notificationData);
      }
    });
  }
  
}
