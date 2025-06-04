import { Component, OnInit } from '@angular/core';

interface Review {
  id: number;
  productName: string;
  productImage: string;
  rating: number;
  comment: string;
  date: string;
}

@Component({
  selector: 'app-user-reviews',
  standalone: false,
  templateUrl: './user-reviews.component.html',
  styleUrl: './user-reviews.component.css'
})
export class UserReviewsComponent implements OnInit {

  userReviews: Review[] = [];

  constructor() { }

  ngOnInit(): void {
    this.loadUserReviews();
  }

  // Reviews Methods
  private loadUserReviews() {
    // TODO: Implement API call to load user reviews
    this.userReviews = [
      {
        id: 1,
        productName: 'Sample Product',
        productImage: 'assets/images/test.jpg',
        rating: 4,
        comment: 'Great product, very satisfied with the purchase!',
        date: '2024-02-15'
      }
    ];
  }

  editReview(review: Review) {
    // TODO: Implement edit review functionality
    console.log('Editing review:', review);
  }

  deleteReview(review: Review) {
    // TODO: Implement delete review functionality
    this.userReviews = this.userReviews.filter(r => r.id !== review.id);
  }

}
