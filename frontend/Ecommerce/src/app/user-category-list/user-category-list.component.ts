import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../services/category.service';
import { Category } from '../category';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { Router } from '@angular/router';

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

  constructor(private categoryService: CategoryService, private router: Router) {}

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

  goToCategory(cat: Category) {
    this.router.navigate(['/uProductlist'], { queryParams: { category: cat.name } });
  }
}