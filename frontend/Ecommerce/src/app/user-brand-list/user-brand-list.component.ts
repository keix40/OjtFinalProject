import { Component, OnInit } from '@angular/core';
import { BrandService } from '../services/brand.service';
import { BrandListDTO } from '../brand';
import { Router, RouterModule } from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { LuxUiModule } from '../shared/ui/lux-ui.module';

@Component({
  selector: 'app-user-brand-list',
  standalone: true,
  imports: [CommonModule, RouterModule, LuxUiModule, HeaderComponent, FooterComponent],
  templateUrl: './user-brand-list.component.html',
  styleUrl: './user-brand-list.component.css'
})
export class UserBrandListComponent implements OnInit {
  brands: BrandListDTO[] = [];
  loading = false;
  error = '';

  constructor(private brandService: BrandService, private router: Router) {}

  ngOnInit(): void {
    this.loadBrands();
  }

  loadBrands(): void {
    this.loading = true;
    this.error = '';
    this.brandService.getAllBrand().subscribe({
      next: (data) => {
        this.brands = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load brands.';
        this.loading = false;
      }
    });
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

  goToBrand(brand: BrandListDTO) {
    this.router.navigate(['/userproductlist'], { queryParams: { brand: brand.name } });
  }
}

