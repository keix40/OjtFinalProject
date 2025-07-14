import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CategoryService } from '../services/category.service';
import { Category } from '../category'; // Use the flat Category interface
import { BrandService } from '../services/brand.service';
import { BrandListDTO } from '../brand';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { RouterModule, Router } from '@angular/router';
import { ReviewService } from '../services/review.service';

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

  constructor(
    private categoryService: CategoryService,
    private brandService: BrandService,
    private reviewService: ReviewService,
    private router: Router
  ) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.loadCategory();
    this.loadBrands();
    this.loadReviews();
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

  getAllCategoriesUrl(): string {
    return '/usercategorylist';
  }

  getAllBrandsUrl(): string {
    return '/user-brand-list';
  }

  goToCategory(cat: Category) {
    this.router.navigate(['/uProductlist'], { queryParams: { category: cat.name } });
  }

  goToBrand(brand: BrandListDTO) {
    // You can add query param or route as needed
    this.router.navigate(['/uProductlist'], { queryParams: { brand: brand.name } });
  }
}
