import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../services/cart.service';
import Swal from 'sweetalert2';
import { ProductDTO } from '../product';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../services/category.service';
import { WishlistService } from '../services/wishlist.service';
import { AuthService } from '../auth/auth.service';
import { BrandService } from '../services/brand.service';
import { ImageService } from '../services/image.service';
import { BreadcrumbComponent } from '../breadcrumb.component';
import { HeaderComponent } from '../header/header.component';
import { DiscountService } from '../services/discount.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user-product-list',
  standalone: true,
  templateUrl: './user-product-list.html',
  styleUrls: ['./user-product-list.css'],
  imports: [CommonModule, FormsModule, BreadcrumbComponent, HeaderComponent]
})
export class UserProductListComponent {
  @Output() wishlistChanged = new EventEmitter<void>();
  allProducts: ProductDTO[] = [];
  products: ProductDTO[] = [];
  wishlist: Set<number> = new Set();

  userId: number | null = null;

  brandOptions: string[] = [];
  categoryOptions: string[] = [];
  hasBrandData: boolean = false;
  hasCategoryData: boolean = false;

  selectedCategory: string | null = null;
  selectedBrand: string | null = null;

  filters = {
    availability: [] as string[],
    sale: [] as string[],
    brand: [] as string[],
    category: [] as string[],
    price: [0, 2000] as [number, number]
  };

  // Track if price filter is being used
  isPriceFilterActive = false;
  maxPriceInProducts = 2000; // Will be updated based on actual product data

  availabilityOptions = ['In Stock', 'Out of Stock'];
  saleOptions = ['On Sale', 'Regular'];

  showFilter = true;

  pageSize = 10;
  currentPage = 1;

  // Discount properties
  activeDiscounts: any[] = [];
  productDiscounts: Map<number, any> = new Map(); // productId -> discount info
  isFirstTimeBuyerDiscount: boolean = false;

  breadcrumbItems = [
    { label: 'Home' }
  ];

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private cateService: CategoryService,
    private wishlistService: WishlistService,
    private authService: AuthService,
    private brandService: BrandService,
    private router: Router,
    public imageService: ImageService,
    private discountService: DiscountService,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.cartService.refreshCart();
    this.userId = this.authService.getUserId();
    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }
    this.route.queryParams.subscribe(params => {
      const category = params['category'];
      const brand = params['brand'];
      this.selectedCategory = category || null;
      this.selectedBrand = brand || null;
      this.loadProducts(() => {
        if (this.selectedCategory) {
          this.filters.category = [this.selectedCategory];
        }
        if (this.selectedBrand) {
          this.filters.brand = [this.selectedBrand];
        }
        if (this.selectedCategory || this.selectedBrand) {
          this.applyFilters();
        }
      });
    });
    this.loadCategories();
    this.loadBrands();
    this.loadWishlist();
    this.loadActiveDiscounts();
    this.checkFirstTimeBuyerDiscount();

  }

  loadProducts(callback?: () => void): void {
    this.productService.getAllAcProduct().subscribe({
      next: data => {
        this.allProducts = data;
        this.products = data;
        console.log("=== PRODUCT DATA LOADED ===");
        console.log("Total products loaded:", this.allProducts.length);
        
        // Calculate max price from actual products
        if (this.allProducts.length > 0) {
          const maxPrice = Math.max(...this.allProducts.map(p => p.price || 0));
          this.maxPriceInProducts = Math.ceil(maxPrice / 100) * 100; // Round up to nearest 100
          this.filters.price[1] = this.maxPriceInProducts;
          console.log("Max price in products:", maxPrice);
          console.log("Calculated max price for filter:", this.maxPriceInProducts);
        }
        
        // Check if any products have categoryBrandArray data
        this.hasBrandData = this.allProducts.some(product => 
          product.categoryBrandArray && 
          product.categoryBrandArray.length > 0 && 
          product.categoryBrandArray.some(pair => pair.brandName)
        );
        this.hasCategoryData = this.allProducts.some(product => 
          product.categoryBrandArray && 
          product.categoryBrandArray.length > 0 && 
          product.categoryBrandArray.some(pair => pair.cateName)
        );
        
        console.log("Has brand data:", this.hasBrandData);
        console.log("Has category data:", this.hasCategoryData);
        
        if (this.allProducts.length > 0) {
          console.log("Sample product structure:", JSON.stringify(this.allProducts[0], null, 2));
          console.log("Sample product keys:", Object.keys(this.allProducts[0]));
          console.log("Sample product categoryBrandArray:", this.allProducts[0]?.categoryBrandArray);
          
          // Check for other possible brand/category properties
          const sampleProduct = this.allProducts[0];
          console.log("All product properties:");
          for (const [key, value] of Object.entries(sampleProduct)) {
            console.log(`  ${key}:`, value, `(type: ${typeof value})`);
          }
          
          if (this.allProducts[0]?.categoryBrandArray?.length > 0) {
            console.log("First categoryBrandArray:", this.allProducts[0].categoryBrandArray[0]);
            console.log("Brand name type:", typeof this.allProducts[0].categoryBrandArray[0].brandName);
            console.log("Category name type:", typeof this.allProducts[0].categoryBrandArray[0].cateName);
          }
        }
        this.applyFilters(); // apply after loading
        this.calculateProductDiscounts(); // recalculate discounts after products are loaded
      
        if (callback) callback();
      },
      error: err => console.error('Failed to load products', err)
    });
  }

  loadCategories(): void {
    this.cateService.getAllCategory().subscribe({
      next: data => {
        console.log('Loaded categories:', data);
        this.categoryOptions = data.map(c => c.name.toString().trim());
        console.log('Category options:', this.categoryOptions);
      },
      error: err => {
        console.error('Failed to load categories:', err);
      }
    });
  }
  
  loadBrands(): void {
    this.brandService.getAllBrand().subscribe({
      next: data => {
        console.log('Loaded brands:', data);
        this.brandOptions = data.map(b => b.name.toString().trim());
        console.log('Brand options:', this.brandOptions);
      },
      error: err => {
        console.error('Failed to load brands:', err);
      }
    });
  }

  loadWishlist() {
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.wishlistService.getWishlist(userId).subscribe({
      next: (productIds: number[]) => {
        this.wishlist = new Set(productIds);
      },
      error: () => {
        console.error("Failed to load wishlist");
      }
    });
  }

  getProductImageUrl(product: ProductDTO): string {
    if (product.productImages?.length > 0) {
      return 'http://localhost:8080' + product.productImages[0].imageUrl;
    }
    return '/assets/project_img/fashion_store.jpg';
  }

  addToCart(product: ProductDTO): void {
    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.cartService.addToCart({
      userId: this.userId,
      id: product.id,
      title: product.productName,
      price: product.price,
      quantity: 1,
      image: this.imageService.getProductImageUrl(product),
      size: undefined,
      color: undefined
    });

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

  toggleWishlist(productId: number): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      alert("You must be logged in to use the wishlist.");
      return;
    }

    if (this.wishlist.has(productId)) {
      this.wishlist.delete(productId);
      this.wishlistService.removeWishlist(userId, productId).subscribe({
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
          this.wishlist.add(productId);
        }
      });
    } else {
      this.wishlist.add(productId);
      this.wishlistService.saveWishlist(userId, productId).subscribe({
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
          this.wishlist.delete(productId);
        }
      });
    }
  }

  onFilterCheckboxChange(type: 'availability' | 'sale' | 'brand' | 'category', value: string, checked: boolean): void {
    console.log(`Filter change: ${type} - ${value} - ${checked}`);
    
    if (checked) {
      if (!this.filters[type].includes(value)) {
        this.filters[type].push(value);
      }
    } else {
      this.filters[type] = this.filters[type].filter(v => v !== value);
    }
    
    console.log(`Updated filters:`, this.filters);
    this.applyFilters();
  }

  onPriceFilterChange(): void {
    // Check if price filter is active (min > 0 or max < maxPriceInProducts)
    this.isPriceFilterActive = this.filters.price[0] > 0 || this.filters.price[1] < this.maxPriceInProducts;
    console.log('Price filter changed:', this.filters.price);
    console.log('Price filter active:', this.isPriceFilterActive);
    this.applyFilters();
  }

  isAnyFilterActive(): boolean {
    return this.filters.availability.length > 0 ||
           this.filters.sale.length > 0 ||
           this.filters.brand.length > 0 ||
           this.filters.category.length > 0 ||
           this.isPriceFilterActive;
  }

  applyFilters(): void {
    console.log('=== STARTING FILTER APPLICATION ===');
    console.log('Current filters:', this.filters);
    console.log('Price filter active:', this.isPriceFilterActive);
    console.log('Total products before filtering:', this.allProducts.length);
    
    // If no filters are active, show all products
    if (!this.isAnyFilterActive()) {
      console.log('No filters active, showing all products');
      this.products = [...this.allProducts];
      return;
    }
    
    const minPrice = this.filters.price[0];
    const maxPrice = this.filters.price[1];
  
    this.products = this.allProducts.filter(product => {
      const quantity = product.quantity ?? 0;
      const price = product.price ?? 0;
      
      console.log(`\n--- Checking product: ${product.productName} ---`);
      console.log('Product categoryBrandArray:', product.categoryBrandArray);
      
      // 1. Availability Filter
      let inAvailability = true;
      if (this.filters.availability.length > 0) {
        inAvailability = 
          (this.filters.availability.includes('In Stock') && quantity > 0) ||
          (this.filters.availability.includes('Out of Stock') && quantity === 0);
      }
      console.log('Availability check:', inAvailability, 'Quantity:', quantity, 'Filters:', this.filters.availability);
      
      // 2. Sale Filter
      let inSale = true;
      if (this.filters.sale.length > 0) {
        inSale = 
          (this.filters.sale.includes('On Sale') && price < 100) ||
          (this.filters.sale.includes('Regular') && price >= 100);
      }
      console.log('Sale check:', inSale, 'Price:', price, 'Filters:', this.filters.sale);
      
      // 3. Brand Filter
      let inBrand = true;
      if (this.filters.brand.length > 0) {
        if (!product.categoryBrandArray || product.categoryBrandArray.length === 0) {
          console.log('⚠️ WARNING: Product has no categoryBrandArray data, skipping brand filter');
          inBrand = true; // Skip brand filtering if no data
        } else {
          const productBrands = product.categoryBrandArray
            .map(pair => pair.brandName?.toString().toLowerCase().trim())
            .filter(brand => brand && brand.length > 0) || [];
          
          const filterBrands = this.filters.brand.map(b => b.toLowerCase().trim());
          
          inBrand = productBrands.some(productBrand => 
            filterBrands.includes(productBrand || '')
          );
          
          console.log('Brand check:', inBrand);
          console.log('Product brands:', productBrands);
          console.log('Filter brands:', filterBrands);
        }
      }
      
      // 4. Category Filter
      let inCategory = true;
      if (this.filters.category.length > 0) {
        if (!product.categoryBrandArray || product.categoryBrandArray.length === 0) {
          console.log('⚠️ WARNING: Product has no categoryBrandArray data, skipping category filter');
          inCategory = true; // Skip category filtering if no data
        } else {
          const productCategories = product.categoryBrandArray
            .map(pair => pair.cateName?.toString().toLowerCase().trim())
            .filter(category => category && category.length > 0) || [];
          
          const filterCategories = this.filters.category.map(c => c.toLowerCase().trim());
          
          inCategory = productCategories.some(productCategory => 
            filterCategories.includes(productCategory || '')
          );
          
          console.log('Category check:', inCategory);
          console.log('Product categories:', productCategories);
          console.log('Filter categories:', filterCategories);
        }
      }
      
      // 5. Price Filter
      let inPrice = true;
      if (this.isPriceFilterActive) {
        inPrice = price >= minPrice && price <= maxPrice;
        console.log('Price check:', inPrice, 'Price range:', minPrice, '-', maxPrice, 'Product price:', price);
      } else {
        console.log('Price filter not active, skipping price check');
      }
      
      // Final result
      const result = inAvailability && inSale && inBrand && inCategory && inPrice;
      console.log('Final result:', result);
      
      if (!result) {
        console.log(`❌ FILTERED OUT: ${product.productName}`);
        console.log('❌ Filter breakdown:');
        console.log('  - Availability:', inAvailability);
        console.log('  - Sale:', inSale);
        console.log('  - Brand:', inBrand);
        console.log('  - Category:', inCategory);
        console.log('  - Price:', inPrice);
        console.log('❌ Current filters:', this.filters);
      } else {
        console.log(`✅ INCLUDED: ${product.productName}`);
      }
      
      return result;
    });
    
    console.log('=== FILTERING COMPLETE ===');
    console.log('Products after filtering:', this.products.length);
    console.log('Remaining products:', this.products.map(p => p.productName));
    this.currentPage = 1;
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  clearFilters(): void {
    this.filters = {
      availability: [],
      sale: [],
      brand: [],
      category: [],
      price: [0, this.maxPriceInProducts]
    };
    this.isPriceFilterActive = false;
    console.log('Filters cleared, showing all products');
    this.applyFilters();
  }

  goToProductDetail(productId: number): void {
    this.router.navigate(['/product', productId]);
  }

  get paginatedProducts() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.products.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.products.length / this.pageSize);
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

    //for discount display by pmk june 12
  loadActiveDiscounts(): void {
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

  calculateProductDiscounts(): void {
    this.productDiscounts.clear();
    
    if (!this.activeDiscounts || this.activeDiscounts.length === 0) {
      return;
    }

    this.allProducts.forEach(product => {
      const discount = this.findApplicableDiscount(product);
      if (discount) {
        this.productDiscounts.set(product.id, discount);
      }
    });
  }

  findApplicableDiscount(product: ProductDTO): any {
    if (!this.activeDiscounts || this.activeDiscounts.length === 0) {
      return null;
    }

    // Check each active discount
    for (const discount of this.activeDiscounts) {
      const rules = discount.rules || [];
      
      for (const rule of rules) {
        if (this.isProductAffectedByRule(product, rule)) {
          return {
            id: discount.id,
            name: discount.name,
            discount_percent: discount.discount_percent,
            discount_amount: discount.discount_amount,
            discountType: discount.discountType,
            targetType: rule.targetType,
            eventName: discount.name
          };
        }
      }
    }
    
    return null;
  }

  isProductAffectedByRule(product: ProductDTO, rule: any): boolean {
    switch (rule.targetType) {
      case 'PRODUCT':
        return rule.productId === product.id;
      
      case 'BRAND':
        if (!product.categoryBrandArray) return false;
        return product.categoryBrandArray.some(pair => 
          pair.brandId === rule.brandId
        );
      
      case 'CATEGORY':
        if (!product.categoryBrandArray) return false;
        return product.categoryBrandArray.some(pair => 
          pair.categoryId === rule.categoryId
        );
      
      case 'BRAND_CATEGORY':
        if (!product.categoryBrandArray) return false;
        return product.categoryBrandArray.some(pair => 
          pair.brandId === rule.brandId && pair.categoryId === rule.categoryId
        );
      
      default:
        return false;
    }
  }

  getProductDiscount(productId: number): any {
    if (this.isFirstTimeBuyerDiscount) return null;
    return this.productDiscounts.get(productId);
  }

  getDiscountDisplayText(discount: any): string {
    if (!discount) return '';
    
    if (discount.discountType === 'PERCENTAGE') {
      return `${discount.discount_percent}% OFF`;
    } else {
      return `Save ${discount.discount_amount} MMK`;
    }
  }

  getDiscountedPrice(product: ProductDTO): number {
    if (this.isFirstTimeBuyerDiscount) return product.price;
    const discount = this.getProductDiscount(product.id);
    if (!discount) return product.price;
    
    let discountedPrice: number;
    if (discount.discountType === 'PERCENTAGE') {
      discountedPrice = product.price - (product.price * discount.discount_percent / 100);
    } else {
      discountedPrice = Math.max(0, product.price - discount.discount_amount);
    }
    
    // Round to whole number (no decimals)
    return Math.round(discountedPrice);
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

  
}
