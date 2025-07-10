// user-product-detail.component.ts
import { Component, OnInit } from '@angular/core';
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

  productId?: number;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private reviewService: ReviewService,
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private router: Router,
    private wishlistService: WishlistService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getUsername() || '';
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      this.productId = idParam ? +idParam : undefined;
      if (this.productId) {
        this.productService.getProductDetailById(this.productId.toString()).subscribe(data => {
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
        });
      }
    });

    if (this.productId) {
      this.reviewService.connect(this.productId, this.currentUser);
    }
    this.loadReviews();
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
      this.displayedImages = this.product.images;
      if (this.displayedImages.length > 0) {
        this.selectedImage = this.displayedImages[0].url;
        this.currentImageIndex = 0;
      }
      return;
    }
    this.selectedAttributes[attrName] = value;

    const matchingVariant = this.product.variants.find((variant: Variant) => {
      return this.attributeNames.every(name => {
        const selectedValue = this.selectedAttributes[name];
        if (!selectedValue) return false;
        const attr = (variant.attributes || []).find(a => a.attributeName === name);
        return attr && attr.value === selectedValue;
      });
    });
    this.selectedVariant = matchingVariant || null;
    this.displayedImages = this.selectedVariant?.images?.length ? this.selectedVariant.images : (this.product?.images || []);
    if (this.displayedImages?.length > 0) {
      this.selectedImage = this.displayedImages[0]?.url;
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
      price: variant?.price || product.price,
      quantity,
      variantAttributes: attributes.map(attr => `${attr.attributeName}: ${attr.value}`),
      color: this.selectedAttributes['Color'],
      size: this.selectedAttributes['Size']
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
    // Add removed media info
    if (isEdit && this.removedMedia.length > 0) {
      formData.append('removedMedia', JSON.stringify(this.removedMedia));
    }
    this.selectedReviewFiles.forEach((item, idx) => {
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
    setTimeout(() => {
      const form = document.getElementById('edit-review-form');
      if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }
  
  deleteReview(review: ReviewMessage) {
    const formData = new FormData();
    formData.append('id', review.id!.toString());
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
      },
      error: () => {
        Swal.fire('Error', 'Failed to delete review.', 'error');
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

  // Open the modal for a review's image or video
  openMediaModal(review: any, type: 'image' | 'video', index: number) {
    this.mediaModalOpen = true;
    this.mediaModalCurrentReview = review;
    this.mediaModalCurrentType = type;
    this.mediaModalCurrentIndex = index;
    this.updateMediaModalUrl();
    document.body.classList.add('modal-open');
  }

  closeMediaModal() {
    this.mediaModalOpen = false;
    this.mediaModalCurrentReview = null;
    this.mediaModalCurrentIndex = 0;
    this.mediaModalCurrentUrl = '';
    document.body.classList.remove('modal-open');
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
}