import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../services/category.service';
import { Category } from '../category';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-user-category-list',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './user-category-list.component.html',
  styleUrls: ['./user-category-list.component.css']
})
export class UserCategoryListComponent implements OnInit {
  categories: Category[] = [];
  loading = false;
  error = '';

  constructor(private categoryService: CategoryService, private router: Router, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
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

  goToCategory(cat: Category) {
    // Already navigates with category name as query param
    this.router.navigate(['/userproductlist'], { queryParams: { category: cat.name } });
  }
}