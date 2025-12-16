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
import { CartItem } from '../services/cart.service';
import { HttpClient } from '@angular/common/http';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { HostListener } from '@angular/core';
import { ColorUtilityService } from '../services/color-utility.service';
import { PriceFormatService } from '../services/price-format.service';

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
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(20px)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.8)' }))
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
  attributeValuesMap: { [key: string]: string[] } = {};

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
  private routeSubscription?: Subscription;
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

  // Related products properties
  relatedProducts: any[] = [];
  isLoadingRelatedProducts: boolean = false;

  activeTab: 'description' | 'specs' | 'reviews' = 'description';
  showReviewForm: boolean = true;

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
    private modalService: NgbModal,
    private colorUtilityService: ColorUtilityService,
    private priceFormatService: PriceFormatService
  ) {}

  ngOnInit(): void {
    // Subscribe to route parameter changes
    this.routeSubscription = this.route.params.subscribe(params => {
      const productId = params['id'];
      if (productId) {
        // Reset component state
        this.resetComponentState();
        // Load new product data
        this.loadProductDetail();
        this.loadReviews();
        this.checkFirstTimeBuyerDiscount();
        this.loadProductDiscounts();
      }
    });

    // Add document click listener for dropdown menus
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  initializeRatingData() {
    // Ensure rating data is properly initialized from product data
    if (this.product) {
      // Set rating data from product (server data)
      this.overallRating = this.product.averageRating || 0;
      this.totalReviews = this.product.reviewCount || 0;
      
      // Ensure product data is preserved
      if (this.product.averageRating === undefined) {
        this.product.averageRating = this.overallRating;
      }
      if (this.product.reviewCount === undefined) {
        this.product.reviewCount = this.totalReviews;
      }
    }
  }

  synchronizeRatingData() {
    // Ensure rating data is consistent between product and component
    if (this.product) {
      // Use product data as source of truth
      this.overallRating = this.product.averageRating || 0;
      this.totalReviews = this.product.reviewCount || 0;
      
      // If no reviews loaded yet, preserve product data
      if (this.reviews.length === 0) {
        // Keep the product data as is
        return;
      }
      
              // If reviews are loaded, use review data but preserve product data as fallback
        if (this.reviews.length > 0) {
          // Calculate from reviews but don't override product data unnecessarily
          const calculatedRating = this.calculateRatingFromReviews();
          const calculatedCount = this.reviews.length;
          
          // Always use calculated rating from reviews when available
          this.overallRating = calculatedRating;
          this.product.averageRating = calculatedRating;
          
          if (calculatedCount !== this.product.reviewCount) {
            this.totalReviews = calculatedCount;
            this.product.reviewCount = calculatedCount;
          }
        }
    }
  }

  calculateRatingFromReviews(): number {
    if (!this.reviews.length) return 0;
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / this.reviews.length) * 10) / 10;
  }

  getDisplayRating(): number {
    // Return a consistent rating for display purposes
    return Math.round(this.overallRating * 10) / 10;
  }

  resetComponentState() {
    // Reset all component state when navigating to a new product
    this.product = null;
    this.selectedImage = null;
    this.selectedVariant = null;
    this.displayedImages = [];
    this.currentImageIndex = 0;
    this.quantity = 1;
    this.selectedAttributes = {};
    this.reviews = [];
    // Don't reset rating data - it will be set from product data
    this.ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    this.relatedProducts = [];
    this.isLoadingRelatedProducts = false;
    this.newReview = '';
    this.newRating = 5;
    this.editingReviewId = null;
    this.selectedReviewFiles = [];
    this.removedMedia = [];
    this.existingReviewMedia = [];
    this.showReviewForm = false;
    this.activeDropdown = null;
    this.wishlistPulse = false;
    this.wishlistFeedback = '';
    this.showRipple = false;
  }

  loadProductDetail(){
    this.currentUser = this.authService.getUsername() || '';
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      const userId = this.authService.getUserId();
      this.productService.getProductDetailById(productId, userId || undefined).subscribe(data => {
        this.product = {
          ...data,
          categoryBrandPairs: data.categoryBrandArray || [],
          hasDiscount: data.hasDiscount || false,
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountName: data.discountName,
          // Ensure rating data is properly set
          averageRating: data.averageRating || 0,
          reviewCount: data.reviewCount || 0,
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

        // Initialize rating data from product if available
        this.initializeRatingData();

        // Ensure rating data is synchronized
        this.synchronizeRatingData();

        this.selectedVariant = null;
        this.displayedImages = this.product.images;
        if (this.displayedImages.length > 0) {
          this.selectedImage = this.displayedImages[0].url;
        } else {
          // Fallback to default image if no product images
          this.selectedImage = '/assets/images/default-brand.svg';
        }
        // Set breadcrumbs dynamically
        this.breadcrumbItems = [
          { label: 'Home', link: '/home' },
          { label: 'Products', link: '/userproductlist' },
          { label: this.product.productName || 'Product Detail' }
        ];

        // Process attribute options for variant selection
        this.processAttributeOptions();
        
        // Load discounts after product is set
        this.loadProductDiscounts();
        
        // Load related products
        this.loadRelatedProducts();
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
      this.reviewService.connect(+productId, this.currentUser);
    }
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
    // Convert decimal to percentage (e.g., 0.2 -> 20)
    const percentageValue = discount.discount_percent <= 1 ? discount.discount_percent * 100 : discount.discount_percent;
    return `${Math.round(percentageValue)}% OFF`;
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
  // Exclude if first-time buyer discount is active
  if (this.isFirstTimeBuyerDiscount) return null;

  const discount = this.productDiscounts.get(this.product?.id);

  // If no dynamic discount found, fallback to product-level discount
  const effectiveDiscount = discount || (this.product?.hasDiscount ? {
    discountType: this.product.discountType,
    discountValue: this.product.discountValue,
    discountName: this.product.discountName,
  } : null);

  if (!effectiveDiscount) return null;

  // Check minimum spend condition
  if (effectiveDiscount.minimumSpend && effectiveDiscount.minimumSpend > 0) {
    const productPrice = this.selectedVariant?.price || this.product?.price || 0;
    if (productPrice < effectiveDiscount.minimumSpend) {
      return null;
    }
  }

  // Add computed fields for UI
  return {
    ...effectiveDiscount,
    discount_percent: effectiveDiscount.discountType === 'PERCENTAGE' 
      ? effectiveDiscount.discountValue * 100 
      : null,
    discount_amount: effectiveDiscount.discountType === 'FIXED' 
      ? effectiveDiscount.discountValue 
      : null
  };
}


  

  getFinalDiscountedPrice(): number {
    let price = this.selectedVariant?.price || this.product?.price || 0;
    const discount = this.getProductDiscount();

    // Apply product-based discount (if any)
    if (discount) {
      if (discount.discountType === 'PERCENTAGE') {
        // Convert decimal to percentage if needed (e.g., 0.2 -> 20)
        const discountPercent = discount.discountValue <= 1 ? discount.discountValue * 100 : discount.discountValue;
        price = price - (price * discountPercent / 100);
      } else if (discount.discountType === 'FIXED') {
        price = price - discount.discountValue;
      }
    }

    // Apply VIP tier discount (if any)
    const userVipTier = this.authService.getUserVipTier && this.authService.getUserVipTier();
    if (userVipTier && this.activeDiscounts && this.activeDiscounts.length > 0) {
      const vipDiscount = this.activeDiscounts.find(d =>
        (d.rules || []).some((r: any) => r.targetType === 'VIP_TIER' && r.vipTierName === userVipTier)
      );
      if (vipDiscount) {
        // Convert decimal to percentage if needed
        const vipDiscountPercent = vipDiscount.discount_percent <= 1 ? vipDiscount.discount_percent * 100 : vipDiscount.discount_percent;
        price = price - (price * vipDiscountPercent / 100);
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

  // Attribute value disabling logic for user product detail
  isAttributeValueDisabled(attrName: string, value: string): boolean {
    const attrNames = this.attributeNames;
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
    const connectedVariants = (this.product?.variants || []).filter((variant: any) =>
      (variant.attributes || []).some((attr: any) => attr.attributeName === prevAttrName && attr.value === prevValue) &&
      (variant.attributes || []).some((attr: any) => attr.attributeName === attrName && attr.value === value)
    );
    // If no connected variants, disable
    if (connectedVariants.length === 0) return true;
    // If all connected variants have stock 0, disable
    if (connectedVariants.every((v: any) => v.stock === 0)) return true;
    return false;
  }

  toggleAttribute(attrName: string, value: string) {
    const attrNames = Object.keys(this.attributeValuesMap);
    const attrIndex = attrNames.indexOf(attrName);
    
    if (this.selectedAttributes[attrName] === value) {
      // Unselect this attribute and all subsequent attributes
      for (let i = attrIndex; i < attrNames.length; i++) {
        delete this.selectedAttributes[attrNames[i]];
      }
      this.selectedVariant = null;
      this.selectedImage = this.product.images[0]?.url || '/assets/images/default-brand.svg';
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
        const isConnected = (this.product?.variants || []).some((variant: any) =>
          attrNames.slice(0, i + 1).every((an, idx) => {
            const selVal = this.selectedAttributes[an];
            if (!selVal) return false;
            return variant.attributes.some((attr: any) => attr.attributeName === an && attr.value === selVal);
          })
        );
        if (!isConnected) {
          // Unselect if not connected
          delete this.selectedAttributes[nextAttr];
        }
      }
    }
    
    // Find matching variant based on selected attributes
    const matchingVariant = this.product?.variants?.find((variant: any) =>
      Object.entries(this.selectedAttributes).every(([k, v]) =>
        variant.attributes.some((attr: any) => attr.attributeName === k && attr.value === v)
      )
    );
    
    this.selectedVariant = matchingVariant || null;
    
    // Update displayed images based on selected variant
    if (this.selectedVariant) {
      this.updateImagesForVariant(this.selectedVariant);
    } else {
      this.selectedImage = this.product.images[0]?.url || '/assets/images/default-brand.svg';
      this.currentImageIndex = 0;
    }
  }

  updateImagesForVariant(variant: any) {
    // First, try to find images specifically associated with this variant
    const variantImages = this.product.images.filter((img: any) => img.variantId === variant.id);
    
    if (variantImages.length > 0) {
      // Use the first variant-specific image
      this.selectedImage = variantImages[0].url;
      this.currentImageIndex = this.product.images.findIndex((img: any) => img.url === variantImages[0].url);
    } else {
      // If no variant-specific images, try to find images that match the variant's attributes
      const variantAttributeValues = variant.attributes.map((attr: any) => attr.value);
      
      // Look for images that might be associated with this variant through attribute matching
      const matchingImage = this.product.images.find((img: any) => {
        // Check if image has any metadata that matches variant attributes
        // This is a fallback for when variantId is not set but images are still variant-specific
        return img.attributes && img.attributes.some((imgAttr: any) => 
          variantAttributeValues.includes(imgAttr.value)
        );
      });
      
      if (matchingImage) {
        this.selectedImage = matchingImage.url;
        this.currentImageIndex = this.product.images.findIndex((img: any) => img.url === matchingImage.url);
      } else {
        // Fallback to first product image
        this.selectedImage = this.product.images[0]?.url || '/assets/images/default-brand.svg';
        this.currentImageIndex = 0;
      }
    }
  }

  getVariantImages(variant: any): any[] {
    if (!variant || !this.product?.images) return [];
    
    // Get images specifically associated with this variant
    const variantImages = this.product.images.filter((img: any) => img.variantId === variant.id);
    
    if (variantImages.length > 0) {
      return variantImages;
    }
    
    // If no direct variant images, try to find images that match the variant's attributes
    const variantAttributeValues = variant.attributes.map((attr: any) => attr.value);
    
    return this.product.images.filter((img: any) => {
      return img.attributes && img.attributes.some((imgAttr: any) => 
        variantAttributeValues.includes(imgAttr.value)
      );
    });
  }

  getCurrentVariantImages(): any[] {
    // If a variant is selected, show variant-specific images
    if (this.selectedVariant) {
      const variantImages = this.getVariantImages(this.selectedVariant);
      if (variantImages.length > 0) {
        return variantImages;
      }
    }
    
    // If no variant is selected or no variant-specific images, show all product images
    return this.product?.images || [];
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

  processAttributeOptions(): void {
    const attrMap: { [key: string]: Set<string> } = {};

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
    const currentImages = this.getCurrentVariantImages();
    if (currentImages[index]) {
      this.selectedImage = currentImages[index].url;
      this.currentImageIndex = index;
    }
  }

  previousImage() {
    const currentImages = this.getCurrentVariantImages();
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.selectedImage = currentImages[this.currentImageIndex].url;
    }
  }

  nextImage() {
    const currentImages = this.getCurrentVariantImages();
    if (this.currentImageIndex < currentImages.length - 1) {
      this.currentImageIndex++;
      this.selectedImage = currentImages[this.currentImageIndex].url;
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

  getVariantDisplayText(variant: Variant): string {
    if (!variant?.attributes) return '';
    return variant.attributes.map(attr => {
      // Check if this is a color attribute
      if (this.isColorAttribute(attr.attributeName)) {
        return this.getColorDisplayName(attr.value);
      }
      return attr.value;
    }).join(' / ');
  }

  /**
   * Resolve the currently selected color value (can be name or hex)
   */
  getSelectedColorValue(): string {
    // Prefer explicitly selected attributes first (common keys: color/Color)
    const explicit = (this.selectedAttributes &&
      (this.selectedAttributes['color'] || this.selectedAttributes['Color'])) as string | undefined;
    if (explicit) return explicit;

    // Fallback to the selected variant's color attribute, if any
    const variant = this.selectedVariant as Variant | undefined;
    if (variant && (variant as any).attributes) {
      const colorAttr = (variant as any).attributes.find((a: any) => this.isColorAttribute(a.attributeName));
      if (colorAttr) return colorAttr.value as string;
    }

    return '';
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
      
      // Only refresh product data if we have actual reviews
      if (this.product && this.product.id && reviews.length > 0) {
        this.refreshProductReviewCount();
      }
    });
  }

  refreshProductReviewCount() {
    // Only update product data if we have actual reviews
    if (this.product && this.reviews.length > 0) {
      this.product.reviewCount = this.totalReviews;
      this.product.averageRating = this.overallRating;
    }
    // Always ensure overallRating is synchronized with product data
    if (this.product?.averageRating !== undefined) {
      this.overallRating = this.product.averageRating;
    }
  }

  refreshProductData() {
    // Refresh product data from server to get latest review count
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      const userId = this.authService.getUserId();
      this.productService.getProductDetailById(productId, userId || undefined).subscribe(data => {
        // Update only the review-related fields to avoid disrupting user interactions
        if (this.product) {
          this.product.reviewCount = data.reviewCount || 0;
          this.product.averageRating = data.averageRating || 0;
        }
      });
    }
  }
  
  computeReviewStats() {
    // Always preserve product rating data as fallback
    const productRating = this.product?.averageRating || 0;
    const productReviewCount = this.product?.reviewCount || 0;
    
    if (!this.reviews.length) {
      // If no reviews loaded yet, use product data
      this.overallRating = productRating;
      this.totalReviews = productReviewCount;
      this.ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      this.mostHelpfulReview = null;
      return;
    }
    
    // Calculate from actual reviews
    this.totalReviews = this.reviews.length;
    let sum = 0;
    this.ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    this.reviews.forEach(r => {
      sum += r.rating;
      this.ratingBreakdown[r.rating] = (this.ratingBreakdown[r.rating] || 0) + 1;
    });
    this.overallRating = this.calculateRatingFromReviews();
    
    // Update product review count and average rating
    if (this.product) {
      this.product.reviewCount = this.totalReviews;
      this.product.averageRating = this.overallRating;
    }
    
    // Most helpful: highest rating, then most recent
    this.mostHelpfulReview = [...this.reviews].sort((a, b) => 
      b.rating - a.rating || 
      new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime()
    )[0];
  }
  
  ngOnDestroy() {
    this.reviewSubscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
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
        this.existingReviewMedia = [];
        this.showReviewForm = false;
        
        // Refresh reviews to update count immediately
        this.loadReviews();
        
        // Refresh product data to ensure review count is updated
        setTimeout(() => {
          this.refreshProductData();
        }, 500);
        
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
    this.showReviewForm = true;
    
    // Populate existingReviewMedia with current review media
    this.existingReviewMedia = [];
    if (review.imageUrls && review.imageUrls.length > 0) {
      review.imageUrls.forEach((url: string) => {
        this.existingReviewMedia.push({ url: 'http://localhost:8080' + url, type: 'image' });
      });
    }
    if (review.videoUrls && review.videoUrls.length > 0) {
      review.videoUrls.forEach((url: string) => {
        this.existingReviewMedia.push({ url: 'http://localhost:8080' + url, type: 'video' });
      });
    }
    
    // Switch to reviews tab and scroll to form
    this.activeTab = 'reviews';
    setTimeout(() => {
      this.scrollToReviewForm();
    }, 100);
  }

  cancelEdit() {
    this.editingReviewId = null;
    this.newReview = '';
    this.newRating = 5;
    this.mediaModalCurrentReview = null;
    this.selectedReviewFiles = [];
    this.removedMedia = [];
    this.existingReviewMedia = [];
    this.showReviewForm = false;
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
        // Refresh product data to ensure review count is updated
        setTimeout(() => {
          this.refreshProductData();
        }, 500);
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
    return Array.from({length: n}, (_, i) => i + 1);
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
  openMediaModal(review: any, type: string, index: number) {
    this.mediaModalCurrentReview = review;
    this.mediaModalCurrentType = type as 'image' | 'video';
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

  removeExistingMedia(url: string, type: string) {
    this.removedMedia.push(url);
    // Remove from existingReviewMedia array
    this.existingReviewMedia = this.existingReviewMedia.filter(media => media.url !== url);
    // Remove from preview
    if (type === 'image') {
      this.mediaModalCurrentReview.imageUrls = this.mediaModalCurrentReview.imageUrls.filter((u: string) => u !== url);
    } else if (type === 'video') {
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
    // Add a small delay to allow for smooth transition
    setTimeout(() => {
      this.selectedImage = image.url;
      this.currentImageIndex = i;
    }, 50);
    
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

  onImageGalleryKeyDown(event: KeyboardEvent) {
    const currentImages = this.getCurrentVariantImages();
    if (!currentImages || currentImages.length <= 1) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.previousImage();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.nextImage();
        break;
      case 'Home':
        event.preventDefault();
        this.selectImageByIndex(0);
        break;
      case 'End':
        event.preventDefault();
        this.selectImageByIndex(currentImages.length - 1);
        break;
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
            return { 
              ...discount, 
              ...rule, 
              eventName: discount.name,
              minimumSpend: discount.minimumSpend 
            };
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
              return { 
                ...discount, 
                ...rule, 
                eventName: discount.name,
                minimumSpend: discount.minimumSpend 
              };
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
              return { 
                ...discount, 
                ...rule, 
                eventName: discount.name,
                minimumSpend: discount.minimumSpend 
              };
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

  /**
   * Returns VIP discount display text for the current product
   */
  getVipDiscountDisplay(): string {
    const userVipTier = this.authService.getUserVipTier && this.authService.getUserVipTier();
    if (!userVipTier) {
      console.log('No VIP tier found for user');
      return '';
    }
    
    const vipDiscount = this.activeDiscounts.find(d =>
      (d.rules || []).some((r: any) => r.targetType === 'VIP_TIER' && r.vipTierName === userVipTier)
    );
    
    console.log('VIP discount check:', {
      userVipTier,
      vipDiscount,
      activeDiscounts: this.activeDiscounts.length,
      productId: this.product?.id,
      originalPrice: this.selectedVariant?.price || this.product?.price,
      finalPrice: this.getFinalDiscountedPrice()
    });
    
    // Check if VIP discount exists and is applicable to this product
    if (vipDiscount && vipDiscount.discount_percent) {
      // Check if the product has a different final price (indicating discount was applied)
      const finalPrice = this.getFinalDiscountedPrice();
      const originalPrice = this.selectedVariant?.price || this.product?.price;
      if (finalPrice !== originalPrice) {
        return `${userVipTier.charAt(0).toUpperCase() + userVipTier.slice(1)} Tier ${vipDiscount.discount_percent}% OFF`;
      }
    }
    return '';
  }

  getDiscountSavings(): number {
    const originalPrice = this.selectedVariant?.price || this.product?.price || 0;
    const discountedPrice = this.getFinalDiscountedPrice();
    return Math.round(originalPrice - discountedPrice);
  }

  // Load related products based on category and brand
  loadRelatedProducts() {
    this.isLoadingRelatedProducts = true;
    
    // Get category and brand IDs from the current product
    const categoryIds: number[] = [];
    const brandIds: number[] = [];
    
    // Extract category and brand IDs from the product data
    console.log('Product data:', this.product);
    console.log('CategoryBrandPairs:', this.product?.categoryBrandPairs);
    console.log('CategoryBrandArray:', this.product?.categoryBrandArray);
    
    if (this.product?.categoryBrandPairs?.length) {
      this.product.categoryBrandPairs.forEach((pair: any) => {
        if (pair.categoryId) categoryIds.push(pair.categoryId);
        if (pair.brandId) brandIds.push(pair.brandId);
      });
    }
    
    // Fallback: try to get from categoryBrandArray if categoryBrandPairs is empty
    if (categoryIds.length === 0 && brandIds.length === 0 && this.product?.categoryBrandArray?.length) {
      this.product.categoryBrandArray.forEach((pair: any) => {
        if (pair.categoryId) categoryIds.push(pair.categoryId);
        if (pair.brandId) brandIds.push(pair.brandId);
      });
    }
    
    // Also try to get brand ID from the product's brand property
    if (this.product?.brand?.id && !brandIds.includes(this.product.brand.id)) {
      brandIds.push(this.product.brand.id);
    }
    
    console.log('Category IDs:', categoryIds);
    console.log('Brand IDs:', brandIds);
    
    // Check if we have valid category or brand IDs
    if (categoryIds.length === 0 && brandIds.length === 0) {
      console.log('No category or brand IDs found for related products');
      this.relatedProducts = [];
      this.isLoadingRelatedProducts = false;
      return;
    }

    // Call backend to get related products
    this.productService.getRelatedProducts(categoryIds, brandIds, this.product.id, [this.product.id]).subscribe({
      next: (products) => {
        console.log('Backend returned related products:', products?.length || 0);
        if (products && products.length > 0) {
          // Randomly select 5 products from the backend response
          this.relatedProducts = this.shuffleArray(products).slice(0, 5);
          console.log('Related products loaded:', this.relatedProducts.length);
        } else {
          console.log('No related products found from backend');
          this.relatedProducts = [];
        }
        this.isLoadingRelatedProducts = false;
      },
      error: (error) => {
        console.error('Failed to load related products:', error);
        this.relatedProducts = [];
        this.isLoadingRelatedProducts = false;
      }
    });
  }

  addToWishlistFromRelated(product: any, event: Event) {
    event.stopPropagation(); // Prevent navigation to product detail
    
    if (!this.authService.isLoggedIn()) {
      // Show login prompt or redirect to login
      Swal.fire({
        title: 'Login Required',
        text: 'Please login to add items to your wishlist',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Login',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/login']);
        }
      });
      return;
    }

    const userId = this.authService.getUserId();
    if (!userId) return;

    this.wishlistService.saveWishlist(userId, product.id).subscribe({
      next: () => {
        // Add visual feedback
        const button = event.target as HTMLElement;
        const svg = button.querySelector('svg');
        if (svg) {
          svg.style.fill = '#ef4444'; // Red color for filled heart
          svg.style.stroke = '#ef4444';
        }
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Added to wishlist!',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
          customClass: { popup: 'swal2-toast' }
        });
      },
      error: (error: any) => {
        console.error('Failed to add to wishlist:', error);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Failed to add to wishlist',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
          customClass: { popup: 'swal2-toast' }
        });
      }
    });
  }

  // Shuffle array to randomize product selection
  shuffleArray(array: any[]): any[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Navigate to product detail
  goToProductDetail(productId: number) {
    this.router.navigate(['/product', productId]);
  }

  // Get product image URL
  getProductImageUrl(product: any): string {
    if (product.productImages?.length > 0) {
      return 'http://localhost:8080' + product.productImages[0].imageUrl;
    }
    return '/assets/images/default-brand.svg';
  }

  // Get final discounted price for related products
  getRelatedProductDiscountedPrice(product: any): number {
    let price = product.price || 0;
    const originalPrice = price;
    
    // Check if product has built-in discount properties first
    if (product.hasDiscount && product.discountType && product.discountValue) {
      if (product.discountType === 'PERCENTAGE') {
        // Convert decimal to percentage if needed (e.g., 0.2 -> 20)
        const discountPercent = product.discountValue <= 1 ? product.discountValue * 100 : product.discountValue;
        price = price - (price * discountPercent / 100);
      } else if (product.discountType === 'AMOUNT') {
        price = price - product.discountValue;
      }
    } else {
      // Find applicable discount for this product from active discounts
      const applicableDiscount = this.activeDiscounts.find(discount => {
        return (discount.rules || []).some((rule: any) => {
          if (rule.targetType === 'PRODUCT' && rule.productId === product.id) {
            return true;
          }
          if (product.categoryBrandArray) {
            return product.categoryBrandArray.some((pair: any) => {
              if (rule.targetType === 'BRAND' && rule.brandId === pair.brandId) {
                return true;
              }
              if (rule.targetType === 'CATEGORY' && rule.categoryId === pair.categoryId) {
                return true;
              }
              if (rule.targetType === 'BRAND_CATEGORY' && rule.brandId === pair.brandId && rule.categoryId === pair.categoryId) {
                return true;
              }
              return false;
            });
          }
          // Also check categoryBrandPairs if categoryBrandArray is not available
          if (product.categoryBrandPairs) {
            return product.categoryBrandPairs.some((pair: any) => {
              if (rule.targetType === 'BRAND' && rule.brandId === pair.brandId) {
                return true;
              }
              if (rule.targetType === 'CATEGORY' && rule.categoryId === pair.categoryId) {
                return true;
              }
              if (rule.targetType === 'BRAND_CATEGORY' && rule.brandId === pair.brandId && rule.categoryId === pair.categoryId) {
                return true;
              }
              return false;
            });
          }
          return false;
        });
      });

      // Apply discount if found
      if (applicableDiscount) {
        if (applicableDiscount.discountType === 'PERCENTAGE') {
          // Convert decimal to percentage if needed (e.g., 0.2 -> 20)
          const discountPercent = applicableDiscount.discount_percent <= 1 ? applicableDiscount.discount_percent * 100 : applicableDiscount.discount_percent;
          price = price - (price * discountPercent / 100);
        } else if (applicableDiscount.discountType === 'AMOUNT') {
          price = price - applicableDiscount.discount_amount;
        }
      }
    }
    
    // Apply VIP tier discount if applicable (on top of existing discount)
    const userVipTier = this.authService.getUserVipTier && this.authService.getUserVipTier();
    if (userVipTier && this.activeDiscounts && this.activeDiscounts.length > 0) {
      const vipDiscount = this.activeDiscounts.find(d =>
        (d.rules || []).some((r: any) => r.targetType === 'VIP_TIER' && r.vipTierName === userVipTier)
      );
      if (vipDiscount) {
        // Convert decimal to percentage if needed
        const vipDiscountPercent = vipDiscount.discount_percent <= 1 ? vipDiscount.discount_percent * 100 : vipDiscount.discount_percent;
        price = price - (price * vipDiscountPercent / 100);
      }
    }
    
    // Ensure price doesn't go below 0
    return Math.max(0, Math.round(price));
  }

  // Check if related product has discount
  hasRelatedProductDiscount(product: any): boolean {
    // Check if product has built-in discount properties
    if (product.hasDiscount || product.discountType || product.discountValue) {
      return true;
    }

    // Check active discounts
    return this.activeDiscounts.some(discount => {
      return (discount.rules || []).some((rule: any) => {
        if (rule.targetType === 'PRODUCT' && rule.productId === product.id) {
          return true;
        }
        if (product.categoryBrandArray) {
          return product.categoryBrandArray.some((pair: any) => {
            if (rule.targetType === 'BRAND' && rule.brandId === pair.brandId) {
              return true;
            }
            if (rule.targetType === 'CATEGORY' && rule.categoryId === pair.categoryId) {
              return true;
            }
            if (rule.targetType === 'BRAND_CATEGORY' && rule.brandId === pair.brandId && rule.categoryId === pair.categoryId) {
              return true;
            }
            return false;
          });
        }
        // Also check categoryBrandPairs if categoryBrandArray is not available
        if (product.categoryBrandPairs) {
          return product.categoryBrandPairs.some((pair: any) => {
            if (rule.targetType === 'BRAND' && rule.brandId === pair.brandId) {
              return true;
            }
            if (rule.targetType === 'CATEGORY' && rule.categoryId === pair.categoryId) {
              return true;
            }
            if (rule.targetType === 'BRAND_CATEGORY' && rule.brandId === pair.brandId && rule.categoryId === pair.categoryId) {
              return true;
            }
            return false;
          });
        }
        return false;
      });
    });
  }

  // Get discount display text for related products
  getRelatedProductDiscountText(product: any): string {
    // Check if product has built-in discount properties first
    if (product.hasDiscount && product.discountType && product.discountValue) {
      if (product.discountType === 'PERCENTAGE') {
        // Convert decimal to percentage (e.g., 0.2 -> 20)
        const percentageValue = product.discountValue <= 1 ? product.discountValue * 100 : product.discountValue;
        return `${Math.round(percentageValue)}% OFF`;
      } else {
        return `Save ${product.discountValue} MMK`;
      }
    }

    // Check active discounts
    const discount = this.activeDiscounts.find(discount => {
      return (discount.rules || []).some((rule: any) => {
        if (rule.targetType === 'PRODUCT' && rule.productId === product.id) {
          return true;
        }
        if (product.categoryBrandArray) {
          return product.categoryBrandArray.some((pair: any) => {
            if (rule.targetType === 'BRAND' && rule.brandId === pair.brandId) {
              return true;
            }
            if (rule.targetType === 'CATEGORY' && rule.categoryId === pair.categoryId) {
              return true;
            }
            if (rule.targetType === 'BRAND_CATEGORY' && rule.brandId === pair.brandId && rule.categoryId === pair.categoryId) {
              return true;
            }
            return false;
          });
        }
        // Also check categoryBrandPairs if categoryBrandArray is not available
        if (product.categoryBrandPairs) {
          return product.categoryBrandPairs.some((pair: any) => {
            if (rule.targetType === 'BRAND' && rule.brandId === pair.brandId) {
              return true;
            }
            if (rule.targetType === 'CATEGORY' && rule.categoryId === pair.categoryId) {
              return true;
            }
            if (rule.targetType === 'BRAND_CATEGORY' && rule.brandId === pair.brandId && rule.categoryId === pair.categoryId) {
              return true;
            }
            return false;
          });
        }
        return false;
      });
    });

    if (!discount) return '';
    
    if (discount.discountType === 'PERCENTAGE') {
      // Convert decimal to percentage (e.g., 0.2 -> 20)
      const percentageValue = discount.discount_percent <= 1 ? discount.discount_percent * 100 : discount.discount_percent;
      return `${Math.round(percentageValue)}% OFF`;
    } else {
      return `Save ${discount.discount_amount} MMK`;
    }
  }

  // Toggle the dropdown menu for a review
  toggleMenu(review: any, event: MouseEvent): void {
    event.stopPropagation();
    this.reviews.forEach(r => {
      if (r !== review) r.showMenu = false;
    });
    review.showMenu = !review.showMenu;
  }

  // Check if the current user is the author of the review
  isCurrentUserReview(review: any): boolean {
    return review.username === this.currentUser;
  }

  // Close dropdown menus when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Close all dropdown menus when clicking outside
    this.reviews.forEach(review => {
      if (review.showMenu) {
        review.showMenu = false;
      }
    });
  }

  trackByImageId(index: number, image: ProductImage): number {
    return image.id;
  }

  trackByFileIndex(index: number, file: any): number {
    return index;
  }

  trackByMediaUrl(index: number, media: any): string {
    return media.url;
  }

  trackByReviewId(index: number, review: ReviewMessage): number {
    return review.id || index;
  }

  trackByProductId(index: number, product: any): number {
    return product.id;
  }

  scrollToReviewForm() {
    const reviewForm = document.querySelector('.review-form-container');
    if (reviewForm) {
      reviewForm.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }

  showReviewFormAndScroll() {
    this.showReviewForm = true;
    this.activeTab = 'reviews';
    setTimeout(() => {
      this.scrollToReviewForm();
    }, 100);
  }

  // Add to Cart Button State Management
  isAddToCartDisabled(): boolean {
    // If product has variants, check if all required attributes are selected
    if (this.product?.variants && this.product.variants.length > 0) {
      // Get all unique attribute names from variants
      const allAttributeNames = new Set<string>();
      this.product.variants.forEach((variant: any) => {
        variant.attributes.forEach((attr: any) => {
          allAttributeNames.add(attr.attributeName);
        });
      });
      
      // Check if all attributes have been selected
      const selectedAttributeNames = Object.keys(this.selectedAttributes);
      return selectedAttributeNames.length < allAttributeNames.size;
    }
    // If product has no variants, button should be enabled
    return false;
  }

  getAddToCartButtonText(): string {
    return 'Add to Cart';
  }

  getTotalRequiredAttributes(): number {
    return Object.keys(this.attributeValuesMap).length;
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