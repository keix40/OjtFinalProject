import { Component } from '@angular/core';
import { CartService } from '../services/cart.service';
import Swal from 'sweetalert2';

interface Product {
  id: number;
  title: string;
  image: string;
  tags: string[];
  stock: 'in' | 'low' | 'out';
  rating: number;
  sold: number;
  price: number;
  originalPrice: number;
  discount: number;
  categories: string[];
  material: string;
  sale: string;
  availability: string;
}

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  showFilter = true;

  products: Product[] = [
    {
      id: 1,
      title: 'Modern Living Room Armchair with Extra Padding',
      image: 'assets/images/soba.webp',
      tags: ['Living Room', 'Armchair'],
      stock: 'low',
      rating: 4,
      sold: 2000,
      price: 199,
      originalPrice: 400,
      discount: 50,
      categories: ['Chair'],
      material: 'Upholstered',
      sale: 'Clearance Sale',
      availability: 'Low Stock'
    },
    {
      id: 2,
      title: 'Sectional Sofa with Storage',
      image: 'assets/images/soba.webp',
      tags: ['Living Room', 'Sectional'],
      stock: 'out',
      rating: 3,
      sold: 1200,
      price: 399,
      originalPrice: 800,
      discount: 50,
      categories: ['Sofa', 'Sectional'],
      material: 'Cotton',
      sale: 'Voucher',
      availability: 'Out of Stock'
    },
    // Add more products as needed
  ];

  wishlist: Set<number> = new Set();

  // Filter state
  filters: {
    availability: string[];
    sale: string[];
    material: string[];
    category: string[];
    price: number[];
  } = {
    availability: [],
    sale: [],
    material: [],
    category: [],
    price: [0, 2000]
  };

  // Demo filter options
  availabilityOptions = ['In Stock', 'Low Stock', 'Out of Stock'];
  saleOptions = ['Clearance Sale', 'Voucher', 'Regular Price'];
  materialOptions = ['Cotton', 'Upholstered', 'Metal', 'Wood'];
  categoryOptions = ['Chair', 'Divan', 'Sofa', 'Sectional'];

  constructor(private cartService: CartService) {}

  // Toggle sidebar
  toggleFilter() {
    this.showFilter = !this.showFilter;
  }

  // Wishlist toggle
  toggleWishlist(id: number) {
    if (this.wishlist.has(id)) this.wishlist.delete(id);
    else this.wishlist.add(id);
  }

  // Filtered products
  get filteredProducts() {
    return this.products.filter(product => {
      // Availability
      if (this.filters.availability.length) {
        if (!this.filters.availability.includes(product.availability)) return false;
      }
      // Sale
      if (this.filters.sale.length) {
        if (!this.filters.sale.includes(product.sale)) return false;
      }
      // Material
      if (this.filters.material.length) {
        if (!this.filters.material.includes(product.material)) return false;
      }
      // Category
      if (this.filters.category.length) {
        if (!product.categories.some(cat => this.filters.category.includes(cat))) return false;
      }
      // Price
      if (
        product.price < this.filters.price[0] ||
        product.price > this.filters.price[1]
      )
        return false;
      return true;
    });
  }

  // Add to cart method
  addToCart(product: Product) {
    this.cartService.addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      quantity: 1,
      image: product.image,
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
      customClass: {
        popup: 'swal2-toast'
      }
    });
  }

  // Add this method for checkbox group logic
  onFilterCheckboxChange(filterKey: 'availability' | 'sale' | 'material' | 'category', value: string, checked: boolean) {
    const arr = this.filters[filterKey];
    if (checked) {
      if (!arr.includes(value)) arr.push(value);
    } else {
      const idx = arr.indexOf(value);
      if (idx > -1) arr.splice(idx, 1);
    }
  }
}
