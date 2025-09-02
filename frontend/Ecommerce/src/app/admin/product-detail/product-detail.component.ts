// Updated ProductDetailComponent with variant attribute selection logic
import { Component, OnInit, ViewChild, HostListener, AfterViewInit, ElementRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CommonModule } from '@angular/common';
import { NgbCarouselModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { ReviewService } from '../../services/review.service';
import { PermissionService } from '../../services/permission.service';
import { PermissionConstants } from '../../constants/permission.constants';
import { ColorUtilityService } from '../../services/color-utility.service';
import { PriceFormatService } from '../../services/price-format.service';
import { animate, style, transition, trigger } from '@angular/animations';

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
export class ProductDetailComponent implements OnInit, AfterViewInit {
  product: Product | null = null;
  selectedImage: string | null = null;
  selectedVariant: Variant | null = null;
  displayedImages: ProductImage[] = [];
  currentImageIndex: number = 0;
  selectedAttributes: Record<string, string> = {};
  attributeValuesMap: Record<string, string[]> = {};
  public attributeNames: string[] = [];
  reviews: any[] = [];
  overallRating: number = 0;
  totalReviews: number = 0;
  ratingBreakdown: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  @ViewChild('imagePreviewModal') imagePreviewModalTemplate: any;
  @ViewChild('mediaPreviewModal') mediaPreviewModalTemplate!: ElementRef;
  isModalOpen = false;
  public PermissionConstants = PermissionConstants;
  public permissionService: PermissionService;  mediaModalRef: any;
  mediaModalCurrentReview: any;
  mediaModalCurrentType: 'image' | 'video' = 'image';
  mediaModalCurrentIndex: number = 0;
  mediaModalCurrentUrl: string = '';
  currentUser: string = '';
  activeDropdown: number | null = null;

  // Add a stable media preview map to cache arrays per review
  private mediaPreviewCache = new WeakMap<any, { type: 'image' | 'video', url: string }[]>();

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private modalService: NgbModal,
    private router: Router,
    private reviewService: ReviewService,
    private cdr: ChangeDetectorRef,
    permissionService: PermissionService,
    private colorUtilityService: ColorUtilityService,
    private priceFormatService: PriceFormatService
  ) {
    this.permissionService = permissionService;
  }

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProductDetails(productId);
      this.loadReview();
    }
  }

  loadReview(){
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProductDetails(productId);
      this.reviewService.connect(+productId, 'admin');
      this.reviewService.reviews$.subscribe((reviews: any[]) => {
        // Filter reviews for this productId if needed
        this.reviews = reviews.filter(r => r.productId == productId);
        this.computeReviewStats();
      });
    }
    // Set currentUser (example: from localStorage or a service)
    this.currentUser = localStorage.getItem('username') || '';
  }

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    } else if (typeof lucide !== 'undefined') {
      lucide.createIcons();
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
        setTimeout(() => {
          if (typeof window !== 'undefined' && (window as any).lucide) {
            (window as any).lucide.createIcons();
          } else if (typeof lucide !== 'undefined') {
            lucide.createIcons();
          }
        }, 0);
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
    this.isModalOpen = true;
    const modalRef = this.modalService.open(this.imagePreviewModalTemplate, {
      centered: true,
      backdrop: 'static',
      windowClass: 'p-0',
      scrollable: true
    });
    modalRef.result.finally(() => {
      this.isModalOpen = false;
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-success';
      case 'inactive': return 'bg-danger';
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

  /**
   * Check if an attribute name represents a color
   */
  isColorAttribute(attrName: string): boolean {
    return this.colorUtilityService.isColorAttribute(attrName);
  }

  /**
   * Get hex color code for a color name
   */
  getColorHex(colorName: string): string {
    return this.colorUtilityService.getColorHex(colorName);
  }

  /**
   * Get display name for a color
   */
  getColorDisplayName(colorName: string): string {
    return this.colorUtilityService.getColorDisplayName(colorName);
  }

  toggleAttribute(attrName: string, value: string): void {
    const attrNames = Object.keys(this.attributeValuesMap);
    const attrIndex = attrNames.indexOf(attrName);
    if (this.selectedAttributes[attrName] === value) {
      // Unselect this attribute and all subsequent attributes
      for (let i = attrIndex; i < attrNames.length; i++) {
        delete this.selectedAttributes[attrNames[i]];
      }
      this.selectedVariant = null;
      this.displayedImages = this.product?.images || [];
      this.selectedImage = this.displayedImages[0]?.url || null;
      this.currentImageIndex = 0;
      return;
    }

    // Select this value
    this.selectedAttributes[attrName] = value;

    // For all subsequent attributes, check if their selected value is still connected; if not, unselect
    for (let i = attrIndex + 1; i < attrNames.length; i++) {
      const nextAttr = attrNames[i];
      const selectedNextValue = this.selectedAttributes[nextAttr];
      if (selectedNextValue) {
        // Is there a variant with all selected up to this point?
        const isConnected = (this.product?.variants || []).some(variant =>
          attrNames.slice(0, i + 1).every((an, idx) => {
            const selVal = this.selectedAttributes[an];
            if (!selVal) return false;
            return variant.attributes.some(attr => attr.attributeName === an && attr.value === selVal);
          })
        );
        if (!isConnected) {
          // Unselect if not connected
          delete this.selectedAttributes[nextAttr];
        }
      }
    }

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

  // Add this method for attribute value disabling logic
  isAttributeValueDisabled(attrName: string, value: string): boolean {
    const attrNames = Object.keys(this.attributeValuesMap);
    const attrIndex = attrNames.indexOf(attrName);
    if (attrIndex === 0) {
      // First attribute: always enabled
      return false;
    }
    // For second and later attributes, check previous attribute selection
    const prevAttrName = attrNames[attrIndex - 1];
    const prevValue = this.selectedAttributes[prevAttrName];
    if (!prevValue) {
      // If previous attribute not selected, disable all
      return true;
    }
    // Find all variants with prevAttr=prevValue and this attr=value
    const connectedVariants = (this.product?.variants || []).filter(variant =>
      variant.attributes.some(attr => attr.attributeName === prevAttrName && attr.value === prevValue) &&
      variant.attributes.some(attr => attr.attributeName === attrName && attr.value === value)
    );
    // If no connected variants, disable
    if (connectedVariants.length === 0) return true;
    // If all connected variants have stock 0, disable
    if (connectedVariants.every(v => v.stock === 0)) return true;
    return false;
  }

  computeReviewStats() {
    if (!this.reviews.length) {
      this.overallRating = 0;
      this.totalReviews = 0;
      this.ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      return;
    }
    this.totalReviews = this.reviews.length;
    let sum = 0;
    this.ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    this.reviews.forEach(r => {
      sum += r.rating;
      this.ratingBreakdown[r.rating] = (this.ratingBreakdown[r.rating] || 0) + 1;
    });
    this.overallRating = Math.round((sum / this.totalReviews) * 10) / 10;
  }

  round(value: number): number {
    return Math.round(value);
  }

  createArray(n: number): number[] {
    return Array(n).fill(0);
  }

  getAllMedia(review: any): { type: 'image' | 'video', url: string }[] {
    const images = (review.imageUrls || []).map((url: string) => ({ type: 'image' as const, url: 'http://localhost:8080' + url }));
    const videos = (review.videoUrls || []).map((url: string) => ({ type: 'video' as const, url: 'http://localhost:8080' + url }));
    return [...images, ...videos];
  }

  getMediaPreviewStable(review: any): { type: 'image' | 'video', url: string }[] {
    if (this.mediaPreviewCache.has(review)) {
      return this.mediaPreviewCache.get(review)!;
    }
    const arr = this.getAllMedia(review).slice(0, 4);
    this.mediaPreviewCache.set(review, arr);
    return arr;
  }

  trackByMediaUrl(index: number, media: { type: 'image' | 'video', url: string }) {
    return media.url + '-' + media.type;
  }

  getMediaPreview(review: any): { type: 'image' | 'video', url: string }[] {
    return this.getAllMedia(review).slice(0, 4);
  }

  getMediaRemainingCount(review: any): number {
    const all = this.getAllMedia(review);
    return all.length > 4 ? all.length - 4 : 0;
  }

  openMediaModal(review: any, type: 'image' | 'video', index: number) {
    this.mediaModalCurrentReview = review;
    this.mediaModalCurrentType = type;
    this.mediaModalCurrentIndex = index;
    this.updateMediaModalTypeAndUrl();
    if (this.mediaModalRef) {
      this.mediaModalRef.close();
    }
    // Ensure DOM is updated before opening modal
    this.cdr.detectChanges();
    setTimeout(() => {
      this.mediaModalRef = this.modalService.open(this.mediaPreviewModalTemplate, {
        centered: true,
        backdrop: 'static',
        keyboard: true,
        windowClass: 'media-preview-modal',
        scrollable: false
      });
      this.mediaModalRef.result.finally(() => {
        this.mediaModalRef = null;
        this.mediaModalCurrentReview = null;
        this.mediaModalCurrentIndex = 0;
        this.mediaModalCurrentUrl = '';
      });
    }, 0);
  }

  closeMediaModal() {
    if (this.mediaModalRef) {
      this.mediaModalRef.close();
    }
  }

  getMediaModalArray(): { type: 'image' | 'video', url: string }[] {
    if (!this.mediaModalCurrentReview) return [];
    const images = (this.mediaModalCurrentReview.imageUrls || []).map((url: string) => ({ type: 'image' as const, url: 'http://localhost:8080' + url }));
    const videos = (this.mediaModalCurrentReview.videoUrls || []).map((url: string) => ({ type: 'video' as const, url: 'http://localhost:8080' + url }));
    return [...images, ...videos];
  }
  
  updateMediaModalTypeAndUrl() {
    const arr = this.getMediaModalArray();
    if (arr[this.mediaModalCurrentIndex]) {
      this.mediaModalCurrentType = arr[this.mediaModalCurrentIndex].type;
      this.mediaModalCurrentUrl = arr[this.mediaModalCurrentIndex].url;
    }
  }
  
  get mediaModalCanGoLeft(): boolean {
    if (!this.mediaModalCurrentReview) return false;
    const arr = this.getMediaModalArray();
    return this.mediaModalCurrentIndex > 0 && arr.length > 1;
  }
  
  get mediaModalCanGoRight(): boolean {
    if (!this.mediaModalCurrentReview) return false;
    const arr = this.getMediaModalArray();
    return this.mediaModalCurrentIndex < arr.length - 1 && arr.length > 1;
  }
  
  mediaModalPrev() {
    if (!this.mediaModalCanGoLeft) return;
    this.mediaModalCurrentIndex--;
    this.updateMediaModalTypeAndUrl();
  }
  
  mediaModalNext() {
    if (!this.mediaModalCanGoRight) return;
    this.mediaModalCurrentIndex++;
    this.updateMediaModalTypeAndUrl();
  }

  toggleDropdown(reviewId: number): void {
    this.activeDropdown = this.activeDropdown === reviewId ? null : reviewId;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.isModalOpen && this.displayedImages.length > 1) {
      if (event.key === 'ArrowLeft' && this.currentImageIndex > 0) {
        this.selectImageByIndex(this.currentImageIndex - 1);
      } else if (event.key === 'ArrowRight' && this.currentImageIndex < this.displayedImages.length - 1) {
        this.selectImageByIndex(this.currentImageIndex + 1);
      }
    }
    if (this.mediaModalRef) {
      if (event.key === 'ArrowLeft' && this.mediaModalCanGoLeft) {
        event.preventDefault();
        this.mediaModalPrev();
      } else if (event.key === 'ArrowRight' && this.mediaModalCanGoRight) {
        event.preventDefault();
        this.mediaModalNext();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.closeMediaModal();
      }
    }
  }

  goToEditProduct(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.router.navigate(['/product-edit', productId]);
    }
  }

  /**
   * Formats a price with thousand separators and currency
   * @param price - The price to format
   * @param currency - The currency symbol (default: 'MMK')
   * @returns Formatted price string
   */
  formatPrice(price: number, currency: string = 'MMK'): string {
    return this.priceFormatService.formatPrice(price, currency);
  }

  /**
   * Formats a price without currency symbol
   * @param price - The price to format
   * @returns Formatted price string without currency
   */
  formatPriceOnly(price: number): string {
    return this.priceFormatService.formatPriceOnly(price);
  }
}

declare var lucide: any;
