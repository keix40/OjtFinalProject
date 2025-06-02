import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface WishlistItem {
  id: number;
  title: string;
  price: number;
  image: string;
}

interface Review {
  id: number;
  productName: string;
  productImage: string;
  rating: number;
  comment: string;
  date: string;
}

interface SavedCard {
  id: number;
  last4: string;
  expiry: string;
}

interface OrderItem {
  id: number;
  title: string;
  sku: string;
  quantity: number;
  price: number;
  image: string;
}

interface ShippingAddress {
  street: string;
  apt: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Order {
  id: number;
  orderNumber: string;
  orderDate: Date;
  status: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  tax: number;
  paymentMethod: string;
  shippingMethod: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
}

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
  standalone: false
})
export class UserProfileComponent implements OnInit {
  userDetails: {
    username: string | null;
    email: string | null;
    userId: number | null;
    roles: string[];
  } = {
    username: null,
    email: null,
    userId: null,
    roles: []
  };

  activeSection: string = 'orders';
  wishlistItems: WishlistItem[] = [];
  userReviews: Review[] = [];
  savedCards: SavedCard[] = [];
  personalInfoForm: FormGroup;
  userOrders: Order[] = [];
  expandedOrderId: number | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.personalInfoForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.pattern('^[0-9]{10}$')],
      dateOfBirth: [''],
      gender: ['']
    });
  }

  ngOnInit() {
    this.loadUserDetails();
    this.loadWishlistItems();
    this.loadUserReviews();
    this.loadSavedCards();
    this.initializePersonalInfoForm();
    this.loadUserOrders();
  }

  private loadUserDetails() {
    this.userDetails = {
      username: this.authService.getUsername(),
      email: this.authService.getDecodedToken()?.email || null,
      userId: this.authService.getUserId(),
      roles: this.authService.getRoles()
    };
  }

  private initializePersonalInfoForm() {
    this.personalInfoForm.patchValue({
      fullName: this.userDetails.username,
      email: this.userDetails.email
    });
  }

  selectSection(section: string) {
    this.activeSection = section;
  }

  // Orders Methods
  private loadUserOrders() {
    this.userOrders = [
      {
        id: 1,
        orderNumber: '78A6431D409',
        orderDate: new Date('2025-02-15'),
        status: 'In progress',
        total: 2105.90,
        subtotal: 1929.93,
        shippingCost: 15.99,
        tax: 159.98,
        paymentMethod: 'Credit Card (**** 4589)',
        shippingMethod: 'Express Delivery (2-3 business days)',
        shippingAddress: {
          street: '123 Main Street',
          apt: 'Apt 4B',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'United States'
        },
        items: [
          { id: 101, title: 'Lorem ipsum dolor sit amet', sku: 'PRD-001', quantity: 1, price: 899.99, image: 'assets/images/test.jpg' },
          { id: 102, title: 'Consectetur adipiscing elit', sku: 'PRD-002', quantity: 2, price: 299.98, image: 'assets/images/test.jpg' },
          { id: 103, title: 'Sed do eiusmod tempor', sku: 'PRD-003', quantity: 1, price: 129.99, image: 'assets/images/test.jpg' }
        ]
      },
       {
        id: 2,
        orderNumber: '47H76G09F33',
        orderDate: new Date('2024-12-10'),
        status: 'Delivered',
        total: 360.75,
        subtotal: 320.00,
        shippingCost: 10.75,
        tax: 30.00,
        paymentMethod: 'PayPal',
        shippingMethod: 'Standard Shipping',
        shippingAddress: {
          street: '456 Oak Avenue',
          apt: '',
          city: 'Los Angeles',
          state: 'CA',
          zip: '90001',
          country: 'United States'
        },
        items: [
          { id: 201, title: 'Another Product', sku: 'PRD-004', quantity: 1, price: 320.00, image: 'assets/images/test.jpg' }
        ]
      }
    ];
  }

  toggleOrderDetails(orderId: number) {
    if (this.expandedOrderId === orderId) {
      this.expandedOrderId = null;
    } else {
      this.expandedOrderId = orderId;
    }
  }

  // Wishlist Methods
  private loadWishlistItems() {
    this.wishlistItems = [
      {
        id: 1,
        title: 'Sample Product 1',
        price: 99.99,
        image: 'assets/images/test.jpg'
      },
      {
        id: 2,
        title: 'Sample Product 2',
        price: 149.99,
        image: 'assets/images/test.jpg'
      }
    ];
  }

  addToCart(item: WishlistItem) {
    console.log('Adding to cart:', item);
  }

  removeFromWishlist(item: WishlistItem) {
    this.wishlistItems = this.wishlistItems.filter(i => i.id !== item.id);
  }

  // Reviews Methods
  private loadUserReviews() {
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
    console.log('Editing review:', review);
  }

  deleteReview(review: Review) {
    this.userReviews = this.userReviews.filter(r => r.id !== review.id);
  }

  // Payment Methods
  private loadSavedCards() {
    this.savedCards = [
      {
        id: 1,
        last4: '4242',
        expiry: '12/25'
      }
    ];
  }

  addNewCard() {
    console.log('Adding new card');
  }

  removeCard(card: SavedCard) {
    this.savedCards = this.savedCards.filter(c => c.id !== card.id);
  }

  // Personal Info Methods
  updatePersonalInfo() {
    if (this.personalInfoForm.valid) {
      console.log('Updating personal info:', this.personalInfoForm.value);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
} 