import { Component, Output, EventEmitter } from '@angular/core';
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

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  @Output() wishlistChanged = new EventEmitter<void>();
  allProducts: ProductDTO[] = [];
  products: ProductDTO[] = [];
  wishlist: Set<number> = new Set();

  brandOptions: string[] = [];
  categoryOptions: string[] = [];

  filters = {
    availability: [] as string[],
    sale: [] as string[],
    brand: [] as string[], // replaced 'material' with 'brand' for clarity
    category: [] as string[],
    price: [0, 2000] as [number, number]
  };

  availabilityOptions = ['In Stock', 'Out of Stock'];
  saleOptions = ['On Sale', 'Regular'];

  showFilter = true;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private cateService: CategoryService,
    private wishlistService: WishlistService,
    private authService: AuthService,
    private brandService: BrandService,
    private router: Router,
    public imageService: ImageService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
    this.loadBrands();
    this.loadWishlist();
  }

  loadProducts(): void {
    this.productService.getAllAcProduct().subscribe({
      next: data => {
        this.allProducts = data;
        this.products = data;
        this.applyFilters();
      },
      error: err => console.error('Failed to load products', err)
    });
  }

  loadCategories(): void {
    this.cateService.getAllCategory().subscribe({
      next: data => {
        this.categoryOptions = data.map(c => c.name.toString());
      }
    });
  }

  loadBrands(): void {
    this.brandService.getAllBrand().subscribe({
      next: data => {
        this.brandOptions = data.map(b => b.name.toString());
      },
      error: err => console.error("Failed to load brands", err)
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
    this.cartService.addToCart({
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
          // Update wishlist count immediately
          const headerComponent = document.querySelector('app-header') as any;
          if (headerComponent) {
            headerComponent.wishlistCount = this.wishlist.size;
          }
          // Notify wishlist update
          this.wishlistService.notifyWishlistUpdated();
          // Show toast message
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
          // Update wishlist count immediately
          const headerComponent = document.querySelector('app-header') as any;
          if (headerComponent) {
            headerComponent.wishlistCount = this.wishlist.size;
          }
          // Notify wishlist update
          this.wishlistService.notifyWishlistUpdated();
          // Show toast message
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
    if (checked) {
      this.filters[type].push(value);
    } else {
      this.filters[type] = this.filters[type].filter(v => v !== value);
    }
    this.applyFilters();
  }

  applyFilters(): void {
    // Ensure valid price range (min should not exceed max)
    if (this.filters.price[0] > this.filters.price[1]) {
      const temp = this.filters.price[0];
      this.filters.price[0] = this.filters.price[1];
      this.filters.price[1] = temp;
    }
  
    this.products = this.allProducts.filter(product => {
      const inAvailability =
        this.filters.availability.length === 0 ||
        (this.filters.availability.includes('In Stock') && product.quantity > 0) ||
        (this.filters.availability.includes('Out of Stock') && product.quantity === 0);
  
      const inSale =
        this.filters.sale.length === 0 ||
        (this.filters.sale.includes('On Sale') && product.price < 100) ||
        (this.filters.sale.includes('Regular') && product.price >= 100);
  
      const inBrand =
        this.filters.brand.length === 0 ||
        product.categoryBrandPairs.some(cb =>
          cb.brandName && this.filters.brand.includes(cb.brandName)
        );
  
      const inCategory =
        this.filters.category.length === 0 ||
        product.categoryBrandPairs.some(cb => {
          const categoryName = cb.cateName || cb['cateName'];
          return (
            categoryName &&
            this.filters.category.map(c => c.toLowerCase().trim()).includes(categoryName.toLowerCase().trim())
          );
        });
  
      const inPrice = product.price >= this.filters.price[0] && product.price <= this.filters.price[1];
  
      return inAvailability && inSale && inBrand && inCategory && inPrice;
    });
  }  

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  clearFilters() {
    this.filters = {
      availability: [],
      sale: [],
      brand: [],
      category: [],
      price: [0, 2000],
    };
    this.applyFilters();
  }

  goToProductDetail(productId: number) {
    this.router.navigate(['/product', productId]);
  }
}
