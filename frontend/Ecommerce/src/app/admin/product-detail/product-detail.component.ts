// Updated ProductDetailComponent with variant attribute selection logic
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CommonModule } from '@angular/common';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';

interface ProductImage {
  id: number;
  url: string;
  isMain: boolean;
  status: string;
  variantId : string | null;
}

interface VariantAttribute {
  attributeName: string;
  value: string;
}

interface Variant {
  id: number;
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
  price: number;
  stock: number;
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
  selectedVariant: Variant | null = null;
  showImageModal = false;
  displayedImages: ProductImage[] = [];
  currentImageIndex: number = 0;
  selectedAttributes: Record<string, string> = {};
  attributeValuesMap: Record<string, string[]> = {};
  public attributeNames: string[] = [];

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

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  loadProductDetails(productId: string): void {
    this.productService.getProductDetailById(productId).subscribe({
      next: (data: any) => {
        console.log('API response:', data);
        console.log('Variants from response:', data.variants);
        // Find valid brand pair
        const validBrandPair = (data.categoryBrandArray || []).find((cb: any) => cb.brandId != null && cb.brandName != null);
        const brand = validBrandPair ? validBrandPair.brandName : '-';
        const categories = (data.categoryBrandArray || [])
          .map((cb: any) => cb.cateName)
          .filter((name: string) => !!name);
  
        this.product = {
          name: data.productName,
          code: data.productCode,
          description: data.description || '',
          status: data.status === 1 ? 'Active' : 'Inactive',
          createdDate: data.createDate || '',
          updatedDate: data.updateDate || '',
          brand: brand,
          categories: categories,
          images: (data.productImages || []).filter((img: any) => !img.variantId).map((img: any) => ({
            id: img.id,
            url: img.imageUrl.startsWith('http') ? img.imageUrl : `http://localhost:8080${img.imageUrl}`,
            isMain: false,
            status: img.status === 1 ? 'active' : 'inactive',
            variantId: img.variantId || null
          })),
          variants: (data.variants || []).map((variant: any) => ({
            id: variant.id,
            sku: variant.sku,
            price: variant.price,
            stock: variant.stock,
            images: (data.productImages || []).filter((img: any) => img.variantId === variant.id).map((img: any) => ({
              id: img.id,
              url: img.imageUrl.startsWith('http') ? img.imageUrl : `http://localhost:8080${img.imageUrl}`,
              isMain: false,
              status: img.status === 1 ? 'active' : 'inactive',
              variantId: img.variantId
            })),
            attributes: (variant.attributes || []).map((attr: any) => ({
              attributeName: attr.attributeName,
              value: attr.value || ''
            }))
          })),
          price: data.price,
          stock: data.quantity
        };
  
        console.log('Mapped product variants:', this.product.variants);
        
        this.processAttributeOptions();
  
        if (this.product.images.length > 0) {
          this.selectedImage = this.product.images[0].url;
        }
        this.updateDisplayedImages();
      },
      error: (error: any) => console.error('Error loading product details:', error)
    });
  }  

  processAttributeOptions(): void {
    const attrMap: Record<string, Set<string>> = {};

    for (const variant of this.product?.variants || []) {
      for (const attr of variant.attributes || []) {
        if (!attrMap[attr.attributeName]) {
          attrMap[attr.attributeName] = new Set();
        }
        attrMap[attr.attributeName].add(attr.value);
      }
    }

    this.attributeValuesMap = {};
    Object.keys(attrMap).forEach(attr => {
      this.attributeValuesMap[attr] = Array.from(attrMap[attr]);
    });
  }

  onSelectAttribute(attrName: string, value: string): void {
    if (this.selectedAttributes[attrName] === value) {
      delete this.selectedAttributes[attrName];
    } else {
      this.selectedAttributes[attrName] = value;
    }

    const matchingVariant = this.product?.variants.find(variant =>
      Object.entries(this.selectedAttributes).every(([k, v]) =>
        variant.attributes.some(attr => attr.attributeName === k && attr.value === v)
      )
    );
    this.onSelectVariant(matchingVariant || null);
  }

  onSelectVariant(variant: Variant | null) {
    this.selectedVariant = variant;
    this.updateDisplayedImages();
    this.selectedImage = this.displayedImages[0]?.url || this.product?.images[0]?.url || null;
  }

  updateDisplayedImages() {
    this.displayedImages = this.selectedVariant?.images?.length ? this.selectedVariant.images : this.product?.images || [];
    this.selectedImage = this.displayedImages[0]?.url || null;
    this.currentImageIndex = 0;
  }
  

  selectImageByIndex(index: number) {
    if (this.displayedImages[index]) {
      this.selectedImage = this.displayedImages[index].url;
      this.currentImageIndex = index;
    }
  }

  showPrevImage(event: Event) {
    event.stopPropagation();
    if (this.currentImageIndex > 0) {
      this.selectImageByIndex(this.currentImageIndex - 1);
    }
  }

  showNextImage(event: Event) {
    event.stopPropagation();
    if (this.currentImageIndex < this.displayedImages.length - 1) {
      this.selectImageByIndex(this.currentImageIndex + 1);
    }
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
      case 'active': return 'bg-success';
      case 'inactive': return 'bg-danger';
      case 'draft': return 'bg-warning';
      default: return 'bg-secondary';
    }
  }

  getAttributeValues(attrName: string): string[] {
    if (!this.product?.variants?.length) return [];
    const values = new Set<string>();
    this.product.variants.forEach((variant: Variant) => {
      (variant.attributes || []).forEach(attr => {
        if (attr.attributeName === attrName && attr.value) {
          values.add(attr.value);
        }
      });
    });
    return Array.from(values);
  }

  toggleAttribute(attrName: string, value: string): void {
  if (this.selectedAttributes[attrName] === value) {
    delete this.selectedAttributes[attrName];
    this.selectedVariant = null;
    this.displayedImages = this.product?.images || [];
    this.selectedImage = this.displayedImages[0]?.url || null;
    this.currentImageIndex = 0;
    return;
  }

  this.selectedAttributes[attrName] = value;

  const matchingVariant = this.product?.variants?.find(variant =>
    Object.entries(this.selectedAttributes).every(([k, v]) =>
      variant.attributes.some(attr => attr.attributeName === k && attr.value === v)
    )
  );

  this.selectedVariant = matchingVariant || null;
  this.displayedImages = this.selectedVariant?.images?.length
    ? this.selectedVariant.images
    : (this.product?.images || []);

  this.selectedImage = this.displayedImages[0]?.url || null;
  this.currentImageIndex = 0;
}

}
