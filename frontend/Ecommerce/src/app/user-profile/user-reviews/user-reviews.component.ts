import { Component, OnInit, ViewChild, TemplateRef, HostListener } from '@angular/core';
import { ReviewService } from '../../services/review.service';
import { AuthService } from '../../auth/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

interface Review {
  id: number;
  productId: number; // Ensure this is present for backend contract
  productName: string;
  rating: number;
  comment: string;
  date: string;
  username: string;
  mediaList: { type: string; url: string }[];
}

@Component({
  selector: 'app-user-reviews',
  standalone: false,
  templateUrl: './user-reviews.component.html',
  styleUrl: './user-reviews.component.css'
})
export class UserReviewsComponent implements OnInit {
  @ViewChild('mediaPreviewModal', { static: false }) mediaPreviewModal!: TemplateRef<any>;
  @ViewChild('editModalTemplate', { static: false }) editModalTemplate!: TemplateRef<any>;

  userReviews: Review[] = [];

  // Media modal state
  mediaModalCurrentReview: Review | null = null;
  mediaModalCurrentType: 'image' | 'video' = 'image';
  mediaModalCurrentIndex: number = 0;
  mediaModalCurrentUrl: string = '';
  mediaModalRef: any = null; // Store modal reference for keyboard events

  editingReview: Review | null = null;
  editComment: string = '';
  editRating: number = 5;
  newRating: number = 5;
  newReview: string = '';
  reviewCommentError: string = '';
  reviewFileError: string = '';
  selectedReviewFiles: { file: File, preview: string, type: string }[] = [];
  removedMedia: string[] = [];
  editMediaList: { type: string; url: string }[] = [];

  constructor(
    private reviewService: ReviewService, 
    private authService: AuthService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.loadUserReviews();
  }

  // Keyboard event handler for arrow keys
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Only handle keyboard events when media modal is open
    if (this.mediaModalCurrentReview && this.mediaModalRef) {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          if (this.mediaModalCanGoLeft) {
            this.mediaModalPrev();
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (this.mediaModalCanGoRight) {
            this.mediaModalNext();
          }
          break;
        case 'Escape':
          event.preventDefault();
          this.closeMediaModal();
          break;
      }
    }
  }

  // Reviews Methods
  private loadUserReviews() {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.userReviews = [];
      return;
    }
    this.reviewService.getUserReviews(userId).subscribe({
      next: (reviews) => {
        this.userReviews = (reviews || []).map(r => ({
          id: r.id,
          productId: (r as any).productId !== undefined ? (r as any).productId : 0, // fallback to 0 if not present
          productName: r.productName,
          rating: r.rating,
          comment: r.comment,
          date: r.timestamp || '',
          username: r.userName,
          mediaList: r.mediaList || []
        }));
      },
      error: () => {
        this.userReviews = [];
      }
    });
  }

  openMediaModal(review: Review, type: 'image' | 'video', index: number) {
    this.mediaModalCurrentReview = review;
    this.mediaModalCurrentType = type;
    this.mediaModalCurrentIndex = index;
    this.updateMediaModalUrl();
    this.mediaModalRef = this.modalService.open(this.mediaPreviewModal, { 
      centered: true, 
      backdrop: 'static',
      keyboard: false,
      size: 'xl'
    });
  }

  closeMediaModal() {
    this.modalService.dismissAll();
    this.mediaModalCurrentReview = null;
    this.mediaModalCurrentIndex = 0;
    this.mediaModalCurrentUrl = '';
    this.mediaModalRef = null;
  }

  get mediaModalCanGoLeft(): boolean {
    if (!this.mediaModalCurrentReview) return false;
    const arr = this.getAllMedia(this.mediaModalCurrentReview);
    return this.mediaModalCurrentIndex > 0 && arr.length > 1;
  }

  get mediaModalCanGoRight(): boolean {
    if (!this.mediaModalCurrentReview) return false;
    const arr = this.getAllMedia(this.mediaModalCurrentReview);
    return this.mediaModalCurrentIndex < arr.length - 1 && arr.length > 1;
  }

  get mediaModalTotalItems(): number {
    if (!this.mediaModalCurrentReview) return 0;
    return this.getAllMedia(this.mediaModalCurrentReview).length;
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

  updateMediaModalTypeAndUrl() {
    const arr = this.getAllMedia(this.mediaModalCurrentReview!);
    if (arr[this.mediaModalCurrentIndex]) {
      this.mediaModalCurrentType = arr[this.mediaModalCurrentIndex].type as 'image' | 'video';
      this.mediaModalCurrentUrl = arr[this.mediaModalCurrentIndex].url;
    }
  }

  updateMediaModalUrl() {
    const arr = this.getAllMedia(this.mediaModalCurrentReview!);
    if (arr[this.mediaModalCurrentIndex]) {
      this.mediaModalCurrentUrl = arr[this.mediaModalCurrentIndex].url;
    }
  }

  getAllMedia(review: Review): { type: 'image' | 'video', url: string }[] {
    return (review.mediaList || []).map(m => ({
      type: m.type === 'IMAGE' ? 'image' : 'video',
      url: m.url.startsWith('http') ? m.url : 'http://localhost:8080' + m.url
    }));
  }

  editReview(review: Review) {
    this.editingReview = review;
    this.newReview = review.comment;
    this.newRating = review.rating;
    this.editMediaList = [...(review.mediaList || [])];
    this.modalService.open(this.editModalTemplate, { 
      centered: true, 
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    });
  }

  closeEditModal() {
    this.modalService.dismissAll();
    this.editingReview = null;
    this.editComment = '';
    this.editRating = 5;
  }

  submitEditReview() {
    // Validate comment
    this.reviewCommentError = '';
    if (!this.newReview || !this.newReview.trim()) {
      this.reviewCommentError = 'Review comment cannot be empty.';
      return;
    }
    // Prepare FormData for backend update
    const formData = new FormData();
    formData.append('comment', this.newReview);
    formData.append('rating', this.newRating.toString());
    if (this.editingReview) {
      formData.append('id', this.editingReview.id.toString());
      formData.append('username', this.editingReview.username);
      formData.append('action', 'update');
      formData.append('productId', this.editingReview.productId.toString()); // Will be '0' if not present
    }
    // Add new files
    this.selectedReviewFiles.forEach(({ file }) => {
      formData.append('media', file);
    });
    // Add removed media URLs (as multiple fields)
    this.removedMedia.forEach(url => {
      formData.append('removedMedia', url);
    });
    // Call backend to update review
    this.reviewService.sendReview(formData).subscribe({
      next: (updatedReview) => {
        this.closeEditModal();
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Review updated successfully!',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
          customClass: { popup: 'swal2-toast' }
        });
        // Optionally reload reviews to show update
        this.loadUserReviews();
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Failed to update review',
          showConfirmButton: true,
          confirmButtonText: 'OK'
        });
      }
    });
  }

  deleteReview(review: Review) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this review?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        // Actually delete the review
        this.userReviews = this.userReviews.filter(r => r.id !== review.id);
        Swal.fire('Deleted!', 'Your review has been deleted.', 'success');
      }
    });
  }

  getAverageRating(): string {
    if (!this.userReviews.length) return '0.0';
    const sum = this.userReviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / this.userReviews.length).toFixed(1);
  }

  cancelEdit() {
    this.modalService.dismissAll();
    this.editingReview = null;
    this.newReview = '';
    this.newRating = 5;
    this.selectedReviewFiles = [];
    this.removedMedia = [];
    this.reviewCommentError = '';
    this.reviewFileError = '';
  }

  removeSelectedFile(index: number): void {
    this.selectedReviewFiles.splice(index, 1);
  }

  removeExistingMedia(url: string, type: 'image' | 'video') {
    this.removedMedia.push(url);
    this.editMediaList = this.editMediaList.filter(m => !(m.url === url && m.type === (type === 'image' ? 'IMAGE' : 'VIDEO')));
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

}
