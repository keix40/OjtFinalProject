// user-product-detail.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../services/product.service';
import { CartService } from '../services/cart.service';
import Swal from 'sweetalert2';
import { trigger, transition, style, animate } from '@angular/animations';
import { ReviewService} from '../services/review.service';
import { DomSanitizer } from '@angular/platform-browser';
import { ReviewMessage } from '../review-message';
import { AuthService } from '../auth/auth.service';
import { Subscription } from 'rxjs';
import { WishlistService } from '../services/wishlist.service';
import { BreadcrumbComponent } from '../breadcrumb.component';
import { DiscountService } from '../services/discount.service';
import { HttpClient } from '@angular/common/http';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { HostListener } from '@angular/core';

interface ProductImage {
  id: number;
  url: string;
  isMain: boolean;
  status: string;
  variantId?: number | null;
}

interface VariantAttribute {
  attributeId: number;
  attributeName: string;
  valueId: number;
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

@Component({
  selector: 'app-user-product-detail',
  standalone: false,
  templateUrl: './user-product-detail.component.html',
  styleUrl: './user-product-detail.component.css',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class UserProductDetailComponent implements OnInit {
  product: any = null;
  selectedImage: string | null = null;
  selectedVariant: Variant | null = null;
  displayedImages: ProductImage[] = [];
  currentImageIndex: number = 0;
  quantity: number = 1;
  selectedAttributes: { [key: string]: string } = {};

  currentUser: string = '';
  newReview: string = '';
  newRating: number = 5;
  editingReviewId: number | null = null;
  reviews: ReviewMessage[] = [];

  overallRating: number = 0;
  totalReviews: number = 0;
  ratingBreakdown: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  mostHelpfulReview: ReviewMessage | null = null;

  private reviewSubscription?: Subscription;
  userImageUrl: string = '';

  userImageMap: { [username: string]: string } = {};

  selectedReviewFiles: { file: File, preview: string, type: string }[] = [];
  existingReviewMedia: { url: string, type: string, id?: number }[] = [];
  removedExistingMedia: number[] = [];

  // Add modal state for media preview
  mediaModalOpen: boolean = false;
  mediaModalCurrentReview: any = null;
  mediaModalCurrentType: 'image' | 'video' = 'image';
  mediaModalCurrentIndex: number = 0;
  mediaModalCurrentUrl: string = '';

  removedMedia: string[] = [];

  reviewCommentError: string = '';
  reviewFileError: string = '';

  wishlist: Set<number> = new Set<number>();

  breadcrumbItems: { label: string, link?: string }[] = [];
  
  activeDropdown: number | null = null;

  // Magnifier properties
  showMagnifier = false;
  magnifierSize = 180;
  magnifierX = 0;
  magnifierY = 0;
  mainImageWidth = 0;
  mainImageHeight = 0;
  zoomLevel = 2;
  zoomX = 0;
  zoomY = 0;

  // Discount properties
  activeDiscounts: any[] = [];
  productDiscounts: Map<number, any> = new Map(); // productId -> discount info
  isFirstTimeBuyerDiscount: boolean = false;

  @ViewChild('mainImage', { static: false }) mainImageRef!: ElementRef<HTMLImageElement>;
  @ViewChild('mediaPreviewModal') mediaPreviewModalTemplate!: ElementRef;
  private mediaModalRef: NgbModalRef | null = null;

  wishlistPulse = false;
  wishlistFeedback = '';
  showRipple = false;
  rippleX = 0;
  rippleY = 0;
  rippleSize = 0;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private reviewService: ReviewService,
    private sanitizer: DomSanitizer,
    public authService: AuthService,
    private router: Router,
    private wishlistService: WishlistService,
    private discountService: DiscountService,
    private http:HttpClient,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getUsername() || '';
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.productService.getProductDetailById(productId).subscribe(data => {
        this.product = {
          ...data,
          categoryBrandPairs: data.categoryBrandArray || [],
          images: (data.productImages || []).map((img: any) => ({
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
              variantId: img.variantId || null
            })),
            attributes: (variant.attributes || []).map((attr: any) => ({
              attributeId: attr.attributeId,
              attributeName: attr.attributeName,
              valueId: attr.valueId,
              value: attr.value
            }))
          }))
        };

        this.selectedVariant = null;
        this.displayedImages = this.product.images;
        if (this.displayedImages.length > 0) {
          this.selectedImage = this.displayedImages[0].url;
        }
        // Set breadcrumbs dynamically
        this.breadcrumbItems = [
          { label: 'Home', link: '/home' },
          { label: 'Products', link: '/products' },
          { label: this.product.name || 'Product Detail' }
        ];

        // Load discounts after product is set
        this.loadProductDiscounts();
      });
    } else {
      // Fallback if no productId
      this.breadcrumbItems = [
        { label: 'Home', link: '/home' },
        { label: 'Products', link: '/products' },
        { label: 'Product Detail' }
      ];
    }

    if (productId) {
      this.reviewService.connect(+productId, this.currentUser); // ADD THIS LINE
    }
    this.loadReviews();
    this.checkFirstTimeBuyerDiscount();
    // Removed: this.loadProductDiscounts();
  }

  loadProductDiscounts() {
  // Load all active discounts (including VIP tier)
  this.discountService.getActiveDiscount().subscribe({
    next: (discounts) => {
      this.activeDiscounts = discounts;
      this.calculateProductDiscounts();
      console.log('Active discounts loaded:', discounts);
    },
    error: (error) => {
      console.error('Failed to load active discounts:', error);
    }
  });
}

   getDiscountDisplayText(discount?: any): string {
  // If no argument, use the current product's discount
  if (!discount) discount = this.getProductDiscount();
  if (!discount) return '';
  
  if (discount.discountType === 'PERCENTAGE') {
    return `${discount.discount_percent}% OFF`;
  } else {
    return `Save ${discount.discount_amount} MMK`;
  }
}

  calculateProductDiscounts() {
  this.productDiscounts.clear();
  if (!this.activeDiscounts || this.activeDiscounts.length === 0) {
    return;
  }
  // Find the best applicable discount for this product
  const discount = this.findApplicableDiscount(this.product, this.authService.getUserId());
  if (discount) {
    this.productDiscounts.set(this.product.id, discount);
  }
}

  getProductDiscount(): any {
    return this.productDiscounts.get(this.product?.id);
  }

  getFinalDiscountedPrice(): number {
    let price = this.selectedVariant?.price || this.product?.price || 0;
    const discount = this.getProductDiscount();

    // 1. Apply product-based discount (if any)
    if (discount) {
      if (discount.discountType === 'PERCENTAGE') {
        const percent = discount.discount_percent > 1 ? discount.discount_percent / 100 : discount.discount_percent;
        price = price * (1 - percent);
      } else if (discount.discountType === 'FIXED') {
        price = price - discount.discount_amount;
      }
    }

    // 2. Apply VIP tier discount (if any)
    const userVipTier = this.authService.getUserVipTier && this.authService.getUserVipTier();
    if (userVipTier && this.activeDiscounts && this.activeDiscounts.length > 0) {
      // Find VIP_TIER discount for this tier
      const vipDiscount = this.activeDiscounts.find(d =>
        (d.rules || []).some((r: any) => r.targetType === 'VIP_TIER' && r.vipTierName === userVipTier)
      );
      if (vipDiscount) {
        price = price - (price * vipDiscount.discount_percent / 100);
      }
    }

    return Math.round(price);
  }

  hasVipDiscount(): boolean {
    const userVipTier = this.authService.getUserVipTier && this.authService.getUserVipTier();
    return this.activeDiscounts && this.activeDiscounts.some(d =>
      (d.rules || []).some((r: any) => r.targetType === 'VIP_TIER' && r.vipTierName === userVipTier)
    );
  }

checkFirstTimeBuyerDiscount(): void {
    const token = localStorage.getItem('token');
    let userId: number | null = null;
    if (token) {
      try {
        userId = JSON.parse(atob(token.split('.')[1])).id;
      } catch (e) {
        userId = null;
      }
    }
    if (!userId) {
      this.isFirstTimeBuyerDiscount = false;
      return;
    }
    // For preview, we need a cart. On home page, just check with empty cart to get discount eligibility
    const userOrderDto = {
      userId: userId,
      cartItem: []
    };
    this.http.post<any>('http://localhost:8080/order/preview', userOrderDto).subscribe({
      next: (preview: any) => {
        this.isFirstTimeBuyerDiscount = preview.discountReason && preview.discountReason.toLowerCase().includes('first time buyer');
      },
      error: () => {
        this.isFirstTimeBuyerDiscount = false;
      }
    });
  }


  get attributeNames(): string[] {
    if (!this.product?.variants?.length) return [];
    const names = new Set<string>();
    this.product.variants.forEach((variant: Variant) => {
      (variant.attributes || []).forEach(attr => {
        names.add(attr.attributeName);
      });
    });
    return Array.from(names);
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

  toggleAttribute(attrName: string, value: string) {
    if (this.selectedAttributes[attrName] === value) {
      delete this.selectedAttributes[attrName];
      this.selectedVariant = null;
      this.selectedImage = this.product.images[0]?.url;
      this.currentImageIndex = 0;
      return;
    }
    this.selectedAttributes[attrName] = value;
    const matchingVariant = this.product.variants.find((variant: any) => {
      return (variant.attributes || []).every((attr: any) => {
        return this.selectedAttributes[attr.attributeName] === attr.value;
      });
    });
    if (matchingVariant) {
      this.selectedVariant = matchingVariant;
      const variantImage = this.product.images.find((img: any) => img.variantId === matchingVariant.id);
      if (variantImage) {
        this.selectedImage = variantImage.url;
        this.currentImageIndex = this.product.images.findIndex((img: any) => img.url === variantImage.url);
      } else {
        this.selectedImage = this.product.images[0]?.url;
        this.currentImageIndex = 0;
      }
    } else {
      this.selectedVariant = null;
      this.selectedImage = this.product.images[0]?.url;
      this.currentImageIndex = 0;
    }
  }

  addToCart() {
    const variant = this.selectedVariant;
    const product = this.product;
    const quantity = this.quantity;
    const image = this.selectedImage || (variant?.images?.[0]?.url) || product.images?.[0]?.url || '';
    const attributes = variant?.attributes || [];

    const cartItem = {
      id: variant ? variant.id : product.id,
      productId: product.id,
      variantId: variant?.id,
      title: product.productName,
      image,
      price: this.getFinalDiscountedPrice(), // Use discounted price
      originalPrice: variant?.price || product.price, // Keep original price for reference
      quantity,
      variantAttributes: attributes.map(attr => `${attr.attributeName}: ${attr.value}`),
      color: this.selectedAttributes['Color'],
      size: this.selectedAttributes['Size'],
      discount: this.getProductDiscount() // Include discount info
    };

    this.cartService.addToCart(cartItem);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Added to cart',
      showConfirmButton: false,
      timer: 1200,
      timerProgressBar: true,
      customClass: { popup: 'swal2-toast' }
    });
  }

  increaseQty() {
    const maxQty = this.selectedVariant ? this.selectedVariant.stock : this.product.quantity;
    if (this.quantity < maxQty) this.quantity++;
  }

  decreaseQty() {
    if (this.quantity > 1) this.quantity--;
  }

  selectImageByIndex(index: number) {
    if (this.displayedImages[index]) {
      this.selectedImage = this.displayedImages[index].url;
      this.currentImageIndex = index;
    }
  }

  previousImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.selectedImage = this.displayedImages[this.currentImageIndex].url;
    }
  }

  nextImage() {
    if (this.currentImageIndex < this.displayedImages.length - 1) {
      this.currentImageIndex++;
      this.selectedImage = this.displayedImages[this.currentImageIndex].url;
    }
  }

  selectVariantByThumbnail(variant: Variant) {
    this.selectedAttributes = {};
    (variant.attributes || []).forEach(attr => {
      this.selectedAttributes[attr.attributeName] = attr.value;
    });
    this.selectedVariant = variant;
    this.displayedImages = variant.images.length > 0 ? variant.images : this.product.images;
    if (this.displayedImages.length > 0) {
      this.selectedImage = this.displayedImages[0].url;
      this.currentImageIndex = 0;
    }
  }

  getBrandName(): string {
    if (!this.product?.categoryBrandPairs?.length) return '-';
  
    // Loop through pairs to find the first non-null brand
    for (let pair of this.product.categoryBrandPairs) {
      if (pair.brandName && pair.brandName.trim() !== '') {
        return pair.brandName;
      }
    }
    return '-';
  }
  
  get categoryNames(): string {
    if (!this.product?.categoryBrandPairs?.length) return '-';

    // Get all unique, non-empty category names
    const names = this.product.categoryBrandPairs
      .map((cb: any) => cb.cateName)
      .filter((name: string | null) => !!name && name.trim() !== '');

    return names.length > 0 ? names.join(', ') : '-';
  }

  getVariantAttributesText(variant: Variant): string {
    if (!variant?.attributes) return '';
    return variant.attributes.map(attr => attr.value).join(' / ');
  }

  addToWishlist() {
    const userId = this.authService.getUserId && this.authService.getUserId();
    if (!userId) {
      alert('You must be logged in to use the wishlist.');
      return;
    }

    if (!this.product || !this.product.id) return;

    if (!this.wishlist) this.wishlist = new Set<number>();

    if (this.wishlist.has(this.product.id)) {
      this.wishlist.delete(this.product.id);
      this.wishlistService.removeWishlist(userId, this.product.id).subscribe({
        next: () => {
          this.wishlistService.notifyWishlistUpdated();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Removed from wishlist',
            showConfirmButton: false,
            timer: 1200,
            timerProgressBar: true,
            customClass: { popup: 'swal2-toast' }
          });
        },
        error: err => {
          console.error('Failed to remove wishlist');
          alert(`Error: ${err.status} - ${err.error?.message || err.message}`);
          this.wishlist.add(this.product.id);
        }
      });
    } else {
      this.wishlist.add(this.product.id);
      this.wishlistService.saveWishlist(userId, this.product.id).subscribe({
        next: () => {
          this.wishlistService.notifyWishlistUpdated();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Added to wishlist',
            showConfirmButton: false,
            timer: 1200,
            timerProgressBar: true,
            customClass: { popup: 'swal2-toast' }
          });
        },
        error: err => {
          console.error('Failed to save wishlist');
          alert(`Error: ${err.status} - ${err.error?.message || err.message}`);
          this.wishlist.delete(this.product.id);
        }
      });
    }
  }

  // getUserImage(username: string): string {
  //   return this.userImageMap[username] || '/assets/project_img/fashion_store.jpg'; // fallback
  // }

  loadReviews() {
    this.reviewSubscription = this.reviewService.reviews$.subscribe((reviews: ReviewMessage[]) => {
      this.reviews = reviews.map(r => ({
        ...r,
        timestamp: new Date(r.timestamp || '').toISOString(),
      }));

      this.computeReviewStats();
    });
  }
  
  computeReviewStats() {
    if (!this.reviews.length) {
      this.overallRating = 0;
      this.totalReviews = 0;
      this.ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      this.mostHelpfulReview = null;
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
    // Most helpful: highest rating, then most recent
    this.mostHelpfulReview = [...this.reviews].sort((a, b) => 
      b.rating - a.rating || 
      new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime()
    )[0];
  }
  
  ngOnDestroy() {
    this.reviewSubscription?.unsubscribe();
  }

  submitReview() {
    this.reviewCommentError = '';
    // Validate comment
    if (!this.newReview || !this.newReview.trim()) {
      this.reviewCommentError = 'Review comment cannot be empty.';
      return;
    }
    if (!this.newRating) return;
  
    const isEdit = !!this.editingReviewId;
  
    const formData = new FormData();
    formData.append('comment', this.newReview);
    formData.append('rating', this.newRating.toString());
    formData.append('productId', this.product.id);
    formData.append('username', this.currentUser);
    formData.append('action', isEdit ? 'update' : 'create');
    if (this.editingReviewId) {
      formData.append('id', this.editingReviewId.toString());
    }
    // Add removed media info (send each as a separate field)
    if (isEdit && this.removedMedia.length > 0) {
      this.removedMedia.forEach(url => {
        formData.append('removedMedia', url);
      });
    }
    this.selectedReviewFiles.forEach((item) => {
      formData.append('media', item.file);
    });
  
    this.reviewService.sendReview(formData).subscribe({
      next: () => {
        this.newReview = '';
        this.newRating = 5;
        this.editingReviewId = null;
        this.selectedReviewFiles = [];
        this.mediaModalCurrentReview = null;
        this.removedMedia = [];
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: isEdit ? 'Review updated!' : 'Review added!',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
          customClass: { popup: 'swal2-toast' }
        });
      },
      error: () => {
        Swal.fire('Error', 'Failed to submit review.', 'error');
      }
    });
  }
  
  editReview(review: ReviewMessage) {
    this.newReview = review.comment;
    this.newRating = review.rating;
    this.editingReviewId = review.id!;
    this.mediaModalCurrentReview = review;
    this.selectedReviewFiles = [];
    this.removedMedia = [];
  }

  cancelEdit() {
    this.editingReviewId = null;
    this.newReview = '';
    this.newRating = 5;
    this.mediaModalCurrentReview = null;
    this.selectedReviewFiles = [];
    this.removedMedia = [];
  }
  
  deleteReview(review: any) {
    const formData = new FormData();
    formData.append('id', review.id.toString());
    formData.append('productId', review.productId.toString());
    formData.append('username', review.username);
    formData.append('action', 'delete');
    this.reviewService.sendReview(formData).subscribe({
      next: () => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Review deleted!',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
          customClass: { popup: 'swal2-toast' }
        });
        this.loadReviews();
      },
      error: () => {
        Swal.fire('Error', 'Failed to delete review.', 'error');
      }
    });
  }

  confirmDeleteReview(review?: any) {
    // Store the review ID for deletion without changing edit mode
    const reviewIdToDelete = review?.id || this.editingReviewId;
    if (!reviewIdToDelete) return;
    
    Swal.fire({
      title: 'Delete Review',
      text: 'Are you sure you want to delete this review?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        const reviewToDelete = this.reviews.find(r => r.id === reviewIdToDelete);
        if (reviewToDelete) {
          this.deleteReview(reviewToDelete);
        }
      }
    });
  }
  
  createArray(n: number): number[] {
    return Array(n).fill(0);
  }
  
  round(value: number): number {
    return Math.round(value);
  }

  onFilesSelected(event: Event): void {
    this.reviewFileError = '';
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      const filePreviews: { file: File, preview: string, type: string }[] = [];
      let loaded = 0;

      files.forEach((file, idx) => {
        // Validate file size (1000MB = 1,000,000,000 bytes)
        if (file.size > 1000000000) {
          this.reviewFileError = 'Each image or video must be less than 1000MB.';
          loaded++;
          if (loaded === files.length) {
            this.selectedReviewFiles = filePreviews.filter(Boolean);
          }
          return;
        }
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            filePreviews[idx] = {
              file,
              preview: e.target.result,
              type: file.type
            };
            loaded++;
            if (loaded === files.length) {
              // Only update when all previews are ready, preserving order
              this.selectedReviewFiles = filePreviews.filter(Boolean);
            }
          };
          reader.readAsDataURL(file);
        } else {
          this.reviewFileError = 'Only image or video files are allowed.';
          loaded++;
          if (loaded === files.length) {
            this.selectedReviewFiles = filePreviews.filter(Boolean);
          }
        }
      });
      input.value = '';
    }
  }

  removeSelectedFile(index: number): void {
    this.selectedReviewFiles.splice(index, 1);
  }

  // Remove old openMediaModal and closeMediaModal, replace with NgbModal logic
  openMediaModal(review: any, type: 'image' | 'video', index: number) {
    this.mediaModalCurrentReview = review;
    this.mediaModalCurrentType = type;
    this.mediaModalCurrentIndex = index;
    this.updateMediaModalTypeAndUrl();
    if (this.mediaModalRef) {
      this.mediaModalRef.close();
    }
    this.mediaModalRef = this.modalService.open(this.mediaPreviewModalTemplate, {
      centered: true,
      backdrop: 'static',
      keyboard: true,
      // size: 'lg',
      windowClass: 'media-preview-modal',
      scrollable: false
    });
    this.mediaModalRef.result.finally(() => {
      this.mediaModalRef = null;
    this.mediaModalCurrentReview = null;
    this.mediaModalCurrentIndex = 0;
    this.mediaModalCurrentUrl = '';
    });
  }

  // Close modal via code
  closeMediaModal() {
    if (this.mediaModalRef) {
      this.mediaModalRef.close();
    }
  }

  // Keyboard navigation for modal
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (!this.mediaModalRef) return;
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

  // Helper to get the combined media array for the review
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

  updateMediaModalUrl() {
    const arr = this.getMediaModalArray();
    if (arr[this.mediaModalCurrentIndex]) {
      this.mediaModalCurrentUrl = arr[this.mediaModalCurrentIndex].url;
    }
  }

  goToAllReviews() {
    this.router.navigate(['/review'], { queryParams: { productId: this.product.id } });
  }

  navigateToBrandProducts(brandName: string) {
    this.router.navigate(['/userproductlist'], { 
      queryParams: { 
        brand: brandName 
      } 
    });
  }

  removeExistingMedia(url: string, type: 'image' | 'video') {
    this.removedMedia.push(url);
    // Remove from preview
    if (type === 'image') {
      this.mediaModalCurrentReview.imageUrls = this.mediaModalCurrentReview.imageUrls.filter((u: string) => u !== url);
    } else {
      this.mediaModalCurrentReview.videoUrls = this.mediaModalCurrentReview.videoUrls.filter((u: string) => u !== url);
    }
  }

  getAllMedia(review: any): { type: 'image' | 'video', url: string }[] {
    const images = (review.imageUrls || []).map((url: string) => ({ type: 'image' as const, url: 'http://localhost:8080' + url }));
    const videos = (review.videoUrls || []).map((url: string) => ({ type: 'video' as const, url: 'http://localhost:8080' + url }));
    return [...images, ...videos];
  }

  getMediaPreview(review: any): { type: 'image' | 'video', url: string }[] {
    return this.getAllMedia(review).slice(0, 4);
  }

  getMediaRemainingCount(review: any): number {
    const all = this.getAllMedia(review);
    return all.length > 4 ? all.length - 4 : 0;
  }

  toggleDropdown(reviewId: number) {
    this.activeDropdown = this.activeDropdown === reviewId ? null : reviewId;
  }

  onImageMouseMove(event: MouseEvent) {
    if (!this.mainImageRef) return;
    const rect = this.mainImageRef.nativeElement.getBoundingClientRect();
    this.mainImageWidth = this.mainImageRef.nativeElement.width;
    this.mainImageHeight = this.mainImageRef.nativeElement.height;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.zoomX = Math.max(0, Math.min(x, this.mainImageWidth));
    this.zoomY = Math.max(0, Math.min(y, this.mainImageHeight));
    this.magnifierX = this.zoomX - this.magnifierSize / 2;
    this.magnifierY = this.zoomY - this.magnifierSize / 2;
    // Clamp the magnifier within the image
    this.magnifierX = Math.max(0, Math.min(this.magnifierX, this.mainImageWidth - this.magnifierSize));
    this.magnifierY = Math.max(0, Math.min(this.magnifierY, this.mainImageHeight - this.magnifierSize));
    this.showMagnifier = true;
  }

  onImageMouseLeave() {
    this.showMagnifier = false;
  }

  // Add this method for improved image/variant sync
  onThumbnailClick(image: any, i: number) {
    this.selectedImage = image.url;
    this.currentImageIndex = i;
    // If the image is associated with a variant, auto-select that variant
    if (image.variantId) {
      const variant = this.product.variants.find((v: any) => v.id === image.variantId);
      if (variant) {
        this.selectedVariant = variant;
        // Auto-select all attributes for this variant
        this.selectedAttributes = {};
        (variant.attributes || []).forEach((attr: any) => {
          this.selectedAttributes[attr.attributeName] = attr.value;
        });
      }
    }
  }

  toggleWishlistWithPulse() {
    this.addToWishlist();
    this.wishlistPulse = true;
    this.wishlistFeedback = this.wishlist.has(this.product.id) ? 'Added to wishlist' : 'Removed from wishlist';
    setTimeout(() => {
      this.wishlistPulse = false;
      this.wishlistFeedback = '';
    }, 400);
  }

  addToCartWithRipple(event: MouseEvent) {
    const button = (event.currentTarget as HTMLElement);
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    this.rippleSize = size;
    this.rippleX = event.clientX - rect.left - size / 2;
    this.rippleY = event.clientY - rect.top - size / 2;
    this.showRipple = true;
    setTimeout(() => {
      this.showRipple = false;
    }, 500);
    this.addToCart();
  }

  findApplicableDiscount(product: any, userId: number | null): any {
    if (!this.activeDiscounts || this.activeDiscounts.length === 0) {
      return null;
    }
  
    // 1. USER_PRODUCT
    if (userId) {
      for (const discount of this.activeDiscounts) {
        for (const rule of discount.rules || []) {
          if (rule.targetType === 'USER_PRODUCT' && rule.userId === userId && rule.productId === product.id) {
            return { ...discount, ...rule, eventName: discount.name };
          }
        }
      }
    }
    // 2. USER_BRAND_CATEGORY
    if (userId && product.categoryBrandArray) {
      for (const discount of this.activeDiscounts) {
        for (const pair of product.categoryBrandArray) {
          for (const rule of discount.rules || []) {
            if (
              rule.targetType === 'USER_BRAND_CATEGORY' &&
              rule.userId === userId &&
              rule.brandId === pair.brandId &&
              rule.categoryId === pair.categoryId
            ) {
              return { ...discount, ...rule, eventName: discount.name };
            }
          }
        }
      }
    }
    // ... (continue with the rest of the logic from your list page)
    // 3. USER_CATEGORY, 4. USER_BRAND, 5. PRODUCT, 6. BRAND_CATEGORY, 7. CATEGORY, 8. BRAND
  
    // 8. BRAND
    if (product.categoryBrandArray) {
      for (const discount of this.activeDiscounts) {
        for (const pair of product.categoryBrandArray) {
          for (const rule of discount.rules || []) {
            if (
              rule.targetType === 'BRAND' &&
              rule.brandId === pair.brandId
            ) {
              return { ...discount, ...rule, eventName: discount.name };
            }
          }
        }
      }
    }
    return null;
  }

  getVipDiscountPercent(): number | null {
    const userVipTier = this.authService.getUserVipTier && this.authService.getUserVipTier();
    if (!userVipTier) return null;
    const vipDiscount = this.activeDiscounts.find(d =>
      (d.rules || []).some((r: any) => r.targetType === 'VIP_TIER' && r.vipTierName === userVipTier)
    );
    return vipDiscount ? vipDiscount.discount_percent : null;
  }
  
}