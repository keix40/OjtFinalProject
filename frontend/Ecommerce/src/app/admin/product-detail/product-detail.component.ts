import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../product.service';
import { CommonModule } from '@angular/common';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';

interface ProductImage {
  id: number;
  url: string;
  isMain: boolean;
  status: string;
}

interface VariantAttribute {
  attributeName: string;
  value: string;
}

interface Variant {
  sku: string;
  price: number;
  stock: number;
  images: ProductImage[];
  attributes: VariantAttribute[];
}

interface Product {
  name: string;
  code: string;
  description: string;
  status: string;
  createdDate: string;
  updatedDate: string;
  brand: string;
  categories: string[];
  images: ProductImage[];
  variants: Variant[];
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, NgbCarouselModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  selectedImage: string | null = null;
  showImageModal = false;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProductDetails(productId);
    }
  }

  loadProductDetails(productId: string): void {
    this.productService.getProductDetailById(productId).subscribe({
      next: (data: any) => {
        // Map backend fields to UI fields
        this.product = {
          name: data.productName,
          code: data.productCode,
          description: data.description,
          status: data.status === 1 ? 'Active' : 'Inactive',
          createdDate: data.createDate || '',
          updatedDate: data.updateDate || '',
          brand: data.categoryBrandPairs?.[0]?.brandName || '',
          categories: data.categoryBrandPairs?.map((cb: any) => cb.cateName) || [],
          images: (data.productImages || []).map((img: any) => ({
            id: img.id,
            url: img.imageUrl.startsWith('http') ? img.imageUrl : `http://localhost:8080${img.imageUrl}`,
            isMain: false,
            status: img.status === 1 ? 'active' : 'inactive'
          })),
          variants: (data.variants || []).map((variant: any, idx: number) => ({
            sku: variant.sku,
            price: variant.price,
            stock: variant.stock,
            images: (data.productImages || [])
              .filter((img: any) => img.variantId === variant.id)
              .map((img: any) => ({
                id: img.id,
                url: img.imageUrl.startsWith('http') ? img.imageUrl : `http://localhost:8080${img.imageUrl}`,
                isMain: false,
                status: img.status === 1 ? 'active' : 'inactive'
              })),
            attributes: (variant.attributes || []).map((attr: any) => ({
              attributeName: attr.attributeName,
              value: attr.valueName || attr.valueId || ''
            }))
          }))
        };
        if (this.product.images.length > 0) {
          this.selectedImage = this.product.images[0].url;
        }
      },
      error: (error: any) => {
        console.error('Error loading product details:', error);
      }
    });
  }

  openImageModal(imageUrl: string): void {
    this.selectedImage = imageUrl;
    this.showImageModal = true;
  }

  closeImageModal(): void {
    this.showImageModal = false;
  }

  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-success';
      case 'inactive':
        return 'bg-danger';
      case 'draft':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  }

  getImageStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bi-check-circle-fill text-success';
      case 'inactive':
        return 'bi-x-circle-fill text-danger';
      case 'pending':
        return 'bi-clock-fill text-warning';
      default:
        return 'bi-question-circle-fill text-secondary';
    }
  }
} 