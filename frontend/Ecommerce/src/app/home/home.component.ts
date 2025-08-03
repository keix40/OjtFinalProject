import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { VerifyOtpComponent } from '../auth/verify-otp/verify-otp.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { EventService } from '../services/event.service';
import { EventDTO } from '../event-dto';
import { PriceFormatService } from '../services/price-format.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, RouterModule, FormsModule],
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
  featuredProducts: any[] = [];
  trendingProducts: any[] = [];
  firstTimeBuyerNotification: any = null;
  showFirstTimeBuyerAlert = false;
  newsletterEmail = '';
  // Removed: showOtpModal, newsletterEmailForOtp
  events: EventDTO[] = [];
  currentSlide = 0;
  private slideInterval: any;

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
    private sanitizer: DomSanitizer,
    private eventService: EventService,
    private priceFormatService: PriceFormatService
  ) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.loadCategory();
    this.loadBrands();
    this.loadReviews();
    this.loadFeaturedProducts();
    this.loadTrendingProducts();
    this.checkFirstTimeBuyerNotification();
    this.loadEvents();
  }

  ngOnDestroy() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
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
    // TODO: Get actual user ID from auth service
    const userId = undefined; // For now, use undefined to get latest products
    this.productService.getFeaturedProducts(userId).subscribe({
      next: (products) => {
        // Limit to 5 products to ensure they fit in one row
        this.featuredProducts = products.slice(0, 5);
        console.log('Featured products loaded:', this.featuredProducts);
        
        // Debug discount information
        this.featuredProducts.forEach((product, index) => {
          console.log(`Featured Product ${index + 1}:`, {
            id: product.id,
            name: product.productName,
            hasDiscount: product.hasDiscount,
            discountName: product.discountName,
            discountValue: product.discountValue,
            discountType: product.discountType,
            hasEvent: product.hasEvent,
            eventName: product.eventName,
            price: product.price
          });
        });
        
        // Check if any products have discounts
        const productsWithDiscounts = this.featuredProducts.filter(p => p.hasDiscount);
        const productsWithEvents = this.featuredProducts.filter(p => p.hasEvent);
        console.log(`Products with discounts: ${productsWithDiscounts.length}/${this.featuredProducts.length}`);
        console.log(`Products with events: ${productsWithEvents.length}/${this.featuredProducts.length}`);
        
        if (productsWithDiscounts.length === 0) {
          console.warn('No products with discounts found in featured products!');
        }
        if (productsWithEvents.length === 0) {
          console.warn('No products with events found in featured products!');
        }
      },
      error: (error) => {
        console.error('Error loading featured products:', error);
      }
    });
  }

  loadTrendingProducts() {
    this.productService.getTrendingProducts().subscribe({
      next: (products) => {
        // Limit to 5 products to ensure they fit in one row
        this.trendingProducts = products.slice(0, 5);
        console.log('Trending products loaded:', this.trendingProducts);
        // Log each product's event and discount status
        this.trendingProducts.forEach((product, index) => {
          console.log(`Trending Product ${index + 1}:`, {
            id: product.id,
            name: product.productName,
            hasEvent: product.hasEvent,
            eventName: product.eventName,
            hasDiscount: product.hasDiscount,
            discountName: product.discountName,
            discountValue: product.discountValue,
            discountType: product.discountType,
            price: product.price
          });
        });
        
        // Check if any products have discounts or events
        const productsWithDiscounts = this.trendingProducts.filter(p => p.hasDiscount);
        const productsWithEvents = this.trendingProducts.filter(p => p.hasEvent);
        console.log(`Trending products with discounts: ${productsWithDiscounts.length}/${this.trendingProducts.length}`);
        console.log(`Trending products with events: ${productsWithEvents.length}/${this.trendingProducts.length}`);
        
        if (productsWithDiscounts.length === 0) {
          console.warn('No products with discounts found in trending products!');
        }
        if (productsWithEvents.length === 0) {
          console.warn('No products with events found in trending products!');
        }
      },
      error: (error) => {
        console.error('Error loading trending products:', error);
      }
    });
  }

  loadEvents() {
    this.eventService.getActiveEventsForHero().subscribe({
      next: (events) => {
        this.events = Array.isArray(events) ? events.filter(e => !!e) : [];
        if (this.events.length > 1) {
          this.startAutoSlide();
        }
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.events = [];
      }
    });
  }

  startAutoSlide() {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000); // Change slide every 5 seconds
  }

  setSlide(index: number) {
    this.currentSlide = index;
    // Reset auto-slide timer
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
    if (this.events.length > 1) {
      this.startAutoSlide();
    }
  }

  nextSlide() {
    if (this.events.length > 1) {
      this.currentSlide = (this.currentSlide + 1) % this.events.length;
    }
  }

  prevSlide() {
    if (this.events.length > 1) {
      this.currentSlide = this.currentSlide === 0 ? this.events.length - 1 : this.currentSlide - 1;
    }
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

  goToTrendingProductDetail(product: any) {
    this.router.navigate(['/product', product.id]);
  }

  getTrendingProductImageUrl(product: any): string {
    if (product.productImages && product.productImages.length > 0) {
      return 'http://localhost:8080' + product.productImages[0].imageUrl;
    }
    return 'assets/images/default-brand.svg';
  }

  getStarRating(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars);
  }

  getDiscountText(product: any): string {
    if (!product.hasDiscount || !product.discountValue || !product.discountType) {
      return '';
    }
    
    return this.priceFormatService.formatDiscountText(product.discountValue, product.discountType);
  }

  getDiscountedPrice(product: any): number {
    if (!product.hasDiscount || !product.discountValue || !product.discountType) {
      return product.price;
    }
    
    let discountedPrice: number;
    if (product.discountType === 'PERCENTAGE') {
      discountedPrice = product.price - (product.price * product.discountValue);
    } else {
      discountedPrice = Math.max(0, product.price - product.discountValue);
    }
    
    // Round to whole number (no decimals)
    return Math.round(discountedPrice);
  }

  formatPrice(price: number): string {
    return this.priceFormatService.formatPrice(price);
  }

  formatPriceOnly(price: number): string {
    return this.priceFormatService.formatPriceOnly(price);
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
        const discountValueText = this.priceFormatService.formatDiscountText(
          activeDiscount.discountValue, 
          activeDiscount.discountType
        );
        
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
  
  subscribeToNewsletter() {
    if (!this.newsletterEmail) return;
    // Directly subscribe without OTP modal
    this.http.post('http://localhost:8080/api/newsletter/subscribe?email=' + encodeURIComponent(this.newsletterEmail), {})
      .subscribe({
        next: (res: any) => {
          alert(res); // Or show a nice toast
          this.newsletterEmail = '';
        },
        error: () => {
          alert('Subscription failed.');
        }
      });
  }

  getEventImageUrl(event: EventDTO): string {
    if (!event.eventImage) return '/assets/images/no-image.png';
    if (event.eventImage.startsWith('http') || event.eventImage.startsWith('data:')) {
      return event.eventImage;
    }
    return 'http://localhost:8080' + event.eventImage;
  }

  getButtonText(event: EventDTO): string {
    if (event.discountId) {
      return 'Shop with Discount →';
    } else if (event.productIds && Array.isArray(event.productIds) && event.productIds.length > 0) {
      return 'View Products →';
    } else {
      return 'Learn More →';
    }
  }

  goToEventProducts(event: EventDTO) {
    // Navigate to user product list with event ID
    this.router.navigate(['/userproductlist'], { 
      queryParams: { 
        eventId: event.id,
        eventName: event.name 
      } 
    });
  }

  addToWishlist(product: any) {
    // TODO: Implement wishlist functionality
    console.log('Adding to wishlist:', product.productName);
    // You can add the actual wishlist service call here
    // this.wishlistService.addToWishlist(product.id).subscribe(...)
  }

  // Debug method to test discount functionality
  testDiscountFunctionality() {
    console.log('=== Testing Discount Functionality ===');
    
    // Test trending products
    this.productService.getTrendingProducts().subscribe({
      next: (products) => {
        console.log('Trending products test:', products);
        const withDiscounts = products.filter(p => p.hasDiscount);
        console.log('Trending products with discounts:', withDiscounts.length);
      },
      error: (error) => {
        console.error('Error testing trending products:', error);
      }
    });
    
    // Test featured products
    this.productService.getFeaturedProducts().subscribe({
      next: (products) => {
        console.log('Featured products test:', products);
        const withDiscounts = products.filter(p => p.hasDiscount);
        console.log('Featured products with discounts:', withDiscounts.length);
      },
      error: (error) => {
        console.error('Error testing featured products:', error);
      }
    });
  }
}
