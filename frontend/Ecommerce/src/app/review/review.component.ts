import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReviewService } from '../services/review.service';
import { AuthService } from '../auth/auth.service';
import { LuxDialogService } from '../shared/dialog/lux-dialog.service';
import { ReviewMessage } from '../review-message';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { HostListener, ViewChild, ElementRef } from '@angular/core';
// Import your review service and review model as needed

@Component({
  selector: 'app-review',
  standalone: false,
  templateUrl: './review.component.html',
  styleUrl: './review.component.css'
})
export class ReviewComponent implements OnInit, OnDestroy {
  productId: string = '';
  reviews: any[] = [];
  reviewSubscription: any;

  // Modal state for media preview
  mediaModalOpen: boolean = false;
  mediaModalCurrentReview: any = null;
  mediaModalCurrentType: 'image' | 'video' = 'image';
  mediaModalCurrentIndex: number = 0;
  mediaModalCurrentUrl: string = '';

  // For edit/delete
  editModalOpen: boolean = false;
  currentUser: string = '';
  editingReviewId: number | null = null;
  newReview: string = '';
  newRating: number = 5;
  selectedReviewFiles: { file: File, preview: string, type: string }[] = [];
  removedMedia: string[] = [];

  reviewCommentError: string = '';
  reviewFileError: string = '';

  @ViewChild('mediaPreviewModal') mediaPreviewModalTemplate!: ElementRef;
  private mediaModalRef: NgbModalRef | null = null;

  constructor(
    private route: ActivatedRoute,
    private reviewService: ReviewService,
    private authService: AuthService,
    private modalService: NgbModal,
    private luxDialog: LuxDialogService
  ) {}

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.currentUser = this.authService.getUsername() || '';
    this.route.queryParams.subscribe(params => {
      this.productId = params['productId'];
      if (this.productId) {
        this.fetchReviewsForProduct(this.productId);
      }
    });

    // Add click outside handler to close dropdown menus
    document.addEventListener('click', (event) => {
      this.reviews.forEach(review => {
        if (review.showMenu) {
          review.showMenu = false;
        }
      });
    });
  }

  ngOnDestroy() {
    if (this.reviewSubscription) {
      this.reviewSubscription.unsubscribe();
    }
    // Remove the click outside handler
    document.removeEventListener('click', () => {});
  }

  fetchReviewsForProduct(productId: string) {
    const username = localStorage.getItem('username') || 'guest'; // or use AuthService
    this.reviewService.connect(Number(productId), username); // ✅ WebSocket connect
    this.loadReviews(); // ✅ subscribe to reviews$
  }

  loadReviews() {
    this.reviewSubscription = this.reviewService.reviews$.subscribe((reviews: any[]) => {
      this.reviews = reviews.map(r => ({
        ...r,
        timestamp: new Date(r.timestamp || '').toISOString(),
      }));
    });
  }

  // Helper to create an array for ngFor star rendering
  createArray(n: number): number[] {
    return Array(n).fill(0);
  }

  // Open the modal for a review's image or video
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

  closeMediaModal() {
    if (this.mediaModalRef) {
      this.mediaModalRef.close();
    }
  }

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

  get mediaModalTotalItems(): number {
    if (!this.mediaModalCurrentReview) return 0;
    return this.getMediaModalArray().length;
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
    formData.append('productId', this.productId);
    formData.append('username', this.currentUser);
    formData.append('action', isEdit ? 'update' : 'create');
  
    if (isEdit && this.editingReviewId) {
      formData.append('id', this.editingReviewId.toString());
    }
  
    // ✅ New files to upload
    this.selectedReviewFiles.forEach(({ file }) => {
      formData.append('media', file);
    });
  
    // ✅ Marked-for-deletion media
    this.removedMedia.forEach(url => {
      formData.append('removedMedia', url);
    });
  
    this.reviewService.sendReview(formData).subscribe({
      next: () => {
        this.newReview = '';
        this.newRating = 5;
        this.editingReviewId = null;
        this.selectedReviewFiles = [];
        this.removedMedia = [];
        this.mediaModalCurrentReview = null;
        this.editModalOpen = false;
  
        this.luxDialog.toast(isEdit ? 'Review updated!' : 'Review added!');
      },
      error: () => {
        this.luxDialog.error('Error', 'Failed to submit review.');
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
    this.editModalOpen = true;
  }
  
  removeSelectedFile(index: number): void {
    this.selectedReviewFiles.splice(index, 1);
  }  

  deleteReview(review: any) {
    const formData = new FormData();
    formData.append('id', review.id.toString());
    formData.append('productId', review.productId.toString());
    formData.append('username', review.username);
    formData.append('action', 'delete');
    this.reviewService.sendReview(formData).subscribe({
      next: () => {
        this.luxDialog.toast('Review deleted!');
        this.loadReviews();
      },
      error: () => {
        this.luxDialog.error('Error', 'Failed to delete review.');
      }
    });
  }

  async confirmDeleteReview(review?: any) {
    // Store the review ID for deletion without changing edit mode
    const reviewIdToDelete = review?.id || this.editingReviewId;
    if (!reviewIdToDelete) return;
    
    const confirmed = await this.luxDialog.confirm({
      title: 'Delete review',
      text: 'Are you sure you want to delete this review?',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;
    const reviewToDelete = this.reviews.find(r => r.id === reviewIdToDelete);
    if (reviewToDelete) {
      this.deleteReview(reviewToDelete);
    }
  }

  onFilesSelected(event: Event): void {
    this.reviewFileError = '';
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    const filePreviews: { file: File, preview: string, type: string }[] = [];
    let loaded = 0;
    files.forEach((file, idx) => {
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

  cancelEdit() {
    this.editingReviewId = null;
    this.newReview = '';
    this.newRating = 5;
    this.mediaModalCurrentReview = null;
    this.selectedReviewFiles = [];
    this.removedMedia = [];
    this.editModalOpen = false;
  }

  removeExistingMedia(url: string, type: 'image' | 'video') {
    this.removedMedia.push(url); // Track this for removal
    // Remove from preview list (only visually)
    if (type === 'image') {
      this.mediaModalCurrentReview.imageUrls =
        this.mediaModalCurrentReview.imageUrls.filter((u: string) => u !== url);
    } else {
      this.mediaModalCurrentReview.videoUrls =
        this.mediaModalCurrentReview.videoUrls.filter((u: string) => u !== url);
    }
  }  

  getAllMedia(review: any): { type: 'image' | 'video', url: string }[] {
    const images = (review.imageUrls || []).map((url: string) => ({ type: 'image' as const, url: 'http://localhost:8080' + url }));
    const videos = (review.videoUrls || []).map((url: string) => ({ type: 'video' as const, url: 'http://localhost:8080' + url }));
    return [...images, ...videos];
  }

  // Calculate the average rating from reviews
  getAverageRating(): string {
    if (!this.reviews.length) return '0.0';
    const sum = this.reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / this.reviews.length).toFixed(1);
  }

  // Placeholder for marking a review as read (no-op for now)
  markAsRead(review: any): void {
    // No-op: Implement if you want to track read/unread reviews
  }

  // Toggle the dropdown menu for a review
  toggleMenu(review: any, event: MouseEvent): void {
    event.stopPropagation();
    this.reviews.forEach(r => {
      if (r !== review) r.showMenu = false;
    });
    review.showMenu = !review.showMenu;
  }

  // Get user image URL with proper prefix
  getReviewUserImage(review: any): string {
    if (!review.userImage) return '';
    if (review.userImage.startsWith('http://') || review.userImage.startsWith('https://')) {
      return review.userImage;
    }
    // Always ensure a leading slash for local images
    const path = review.userImage.startsWith('/') ? review.userImage : '/' + review.userImage;
    return `http://localhost:8080${path}`;
  }
}
