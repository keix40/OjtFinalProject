import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ProductService } from '../services/product.service';
import { Brand } from '../brand';
import { Category } from '../category';
import { CategoryService } from '../services/category.service';
import { BrandService } from '../services/brand.service';
import { ModalService } from '../services/modal.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModelComponent } from '../confirm-model/confirm-model.component';
import Swal from 'sweetalert2';
// Removed ExcelJS, XLSX, and jsPDF imports since we're using Jasper Reports
import { ImageService } from '../services/image.service';
import { Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { PermissionConstants } from '../constants/permission.constants';
import { AttributeService } from '../services/attribute.service';
import { Attribute, AttributeValue } from '../attribute';
import { CreateAttributeValueComponent } from '../create-attribute-value/create-attribute-value.component';
import { PriceFormatService } from '../services/price-format.service';
declare var $: any;
declare var lucide: any;

// Update ProductImage type for productImages array to include variantId
export interface ProductImage {
  id: number;
  imageUrl: string;
  status: number;
  variantId?: number | null;
}

// Update ProductList to use ProductImage[]
export interface ProductList {
  id: number;
  productName: string;
  productCode: string;
  price: number;
  quantity: number;
  status: number;
  description: string;
  createDate: string;
  updateDate: string;
  checked: boolean;
  productImages: ProductImage[];
  brandId?: number;
  categoryId?: number;
  variants?: Variant[];
}

// Add Variant interfaces
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
  selector: 'app-product-mangement',
  standalone: false,
  templateUrl: './product-mangement.component.html',
  styleUrl: './product-mangement.component.css'
})
export class ProductMangementComponent implements OnInit, OnDestroy, AfterViewInit {
  products: ProductList[] = [];
  filteredProducts: ProductList[] = [];
  brands: Brand[] = [];
  categories: Category[] = [];
  searchTerm: string = '';
  
  selectedCategory: number = 0;
  selectedBrand: number = 0;
  selectAll: boolean = false;
  
  // Dropdown states
  csvDropdownOpen: boolean = false;
  pdfDropdownOpen: boolean = false;

  currentPage: number = 1;
  pageSize: number = 10;
  paginatedProducts: ProductList[] = [];

  attributes: Attribute[] = [];
  attributeValues: { [attributeId: number]: AttributeValue[] } = {};
  editingAttributeId: number | null = null;
  editingAttributeValueId: number | null = null;
  editAttributeName: string = '';
  editAttributeValue: string = '';
  expandedAttributeId: number | null = null;

  public PermissionConstants = PermissionConstants;
  public permissionService: PermissionService;
  
  constructor(
    private productService: ProductService,
    private cateService: CategoryService,
    private brandService: BrandService,
    private ngbModel: NgbModal,
    public imageService: ImageService,
    private router: Router,
    private attributeService: AttributeService,
    permissionService: PermissionService,
    private priceFormatService: PriceFormatService
  ) {
    this.PermissionConstants = PermissionConstants;
    this.permissionService = permissionService;
  }

  ngOnInit(): void {
    this.loadProduct();
    this.loadCategory();
    this.loadBrand();
    this.loadAttributes();
    document.addEventListener('click', this.handleDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
  }

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    } else if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  private handleDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.csvDropdownOpen = false;
      this.pdfDropdownOpen = false;
    }
  }

  toggleCsvDropdown(): void {
    this.csvDropdownOpen = !this.csvDropdownOpen;
    if (this.csvDropdownOpen) this.pdfDropdownOpen = false;
  }

  togglePdfDropdown(): void {
    this.pdfDropdownOpen = !this.pdfDropdownOpen;
    if (this.pdfDropdownOpen) this.csvDropdownOpen = false;
  }

  // Edit functionality
  editSelectedProduct(): void {
    const selectedProducts = this.selectedProducts;
    
    if (selectedProducts.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Product Selected',
        text: 'Please select a product to edit.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }
    
    if (selectedProducts.length > 1) {
      Swal.fire({
        icon: 'warning',
        title: 'Multiple Products Selected',
        text: 'Please select only one product to edit.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }
    
    // Navigate to edit page with the selected product ID
    const productId = selectedProducts[0].id;
    this.router.navigate(['/product-edit', productId]);
  }

  loadProduct() {
    this.productService.getAllProduct().subscribe({
      next: (data) => {
        this.products = data.map(p => ({ ...p, checked: false }));
        this.filteredProducts = [...this.products];
        this.currentPage = 1;
        this.updatePaginatedProducts();
        setTimeout(() => {
          $('#productTable').DataTable({
            destroy: true,
            columnDefs: [
              { orderable: false, targets: 0 }
            ]
          });
          if (typeof window !== 'undefined' && (window as any).lucide) {
            (window as any).lucide.createIcons();
          } else if (typeof lucide !== 'undefined') {
            lucide.createIcons();
          }
        }, 100);
      },
      error: (err) => {
        console.error('Product error:', err);
        // Show error to user
        Swal.fire({
          icon: 'error',
          title: 'Error Loading Products',
          text: 'There was an error loading the products. Please try again later.',
          confirmButtonColor: '#3085d6'
        });
      }
    });
  }

  loadCategory() {
    this.cateService.getAllCategory().subscribe({
      next: (data) => this.categories = data,
      error: (err) => console.error('Category error:', err)
    });
  }

  onCategoryChange() {
    if (this.selectedCategory != 0) {
      this.brandService.getBrandByCateId(this.selectedCategory).subscribe({
        next: (data) => {
          this.brands = data;
        },
        error: (err) => {
          console.error('Error loading brands by category', err);
          this.brands = [];
        }
      });
    }
  }

  loadBrand() {
    this.brandService.getAllBrand().subscribe({
      next: (data) => this.brands = data,
      error: (err) => console.error('Brand error:', err)
    });
  }

  loadAttributes() {
    this.attributeService.getAllAttribute().subscribe(attrs => {
      this.attributes = attrs;
      attrs.forEach(attr => {
        this.attributeService.getValueById(attr.id).subscribe((dtos) => {
          this.attributeValues[attr.id] = (dtos && dtos.length > 0 && dtos[0].values) ? dtos[0].values : [];
        });
      });
    });
  }

  startEditAttribute(attr: Attribute) {
    this.editingAttributeId = attr.id;
    this.editAttributeName = attr.name;
  }

  saveEditAttribute(attr: Attribute) {
    this.attributeService.updateAttribute(attr.id, this.editAttributeName).subscribe(() => {
      attr.name = this.editAttributeName;
      this.editingAttributeId = null;
    });
  }

  cancelEditAttribute() {
    this.editingAttributeId = null;
  }

  deleteAttribute(attr: Attribute) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this attribute?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.attributeService.deleteAttribute(attr.id).subscribe(() => {
          this.attributes = this.attributes.filter(a => a.id !== attr.id);
          delete this.attributeValues[attr.id];
          Swal.fire({ icon: 'success', title: 'Attribute deleted successfully!', confirmButtonText: 'OK' });
        });
      }
    });
  }

  startEditAttributeValue(attrId: number, value: AttributeValue) {
    this.editingAttributeValueId = value.id ?? null;
    this.editAttributeValue = value.value;
  }

  saveEditAttributeValue(attrId: number, value: AttributeValue) {
    if (value.id !== undefined) {
      this.attributeService.updateAttributeValue(value.id, this.editAttributeValue).subscribe(() => {
        value.value = this.editAttributeValue;
        this.editingAttributeValueId = null;
      });
    }
  }

  cancelEditAttributeValue() {
    this.editingAttributeValueId = null;
  }

  deleteAttributeValue(attrId: number, value: AttributeValue) {
    if (value.id !== undefined) {
      this.attributeService.deleteAttributeValue(value.id).subscribe(() => {
        this.attributeValues[attrId] = this.attributeValues[attrId].filter(v => v.id !== value.id);
      });
    }
  }

  onSearch(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredProducts = this.products.filter(product => {
      const matchesName = product.productName?.toLowerCase().includes(term);
      // Find brand name by brandId
      let brandName = '';
      let categoryName = '';
      if (product.hasOwnProperty('brandId')) {
        const brand = this.brands.find(b => b.id === (product as any).brandId);
        brandName = brand ? brand.name.toLowerCase() : '';
      }
      if (product.hasOwnProperty('categoryId')) {
        const category = this.categories.find(c => c.id === (product as any).categoryId);
        categoryName = category ? category.name.toLowerCase() : '';
      }
      const matchesBrand = brandName.includes(term);
      const matchesCategory = categoryName.includes(term);
      return !term || matchesName || matchesBrand || matchesCategory;
    });
    this.currentPage = 1;
    this.updatePaginatedProducts();
  }

  updatePaginatedProducts(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedProducts = this.filteredProducts.slice(start, end);
    // Re-initialize lucide icons after pagination update
    setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).lucide) {
        (window as any).lucide.createIcons();
      } else if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }, 0);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePaginatedProducts();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.pageSize);
  }

  get showPagination(): boolean {
    return this.filteredProducts.length > this.pageSize;
  }

  get selectedProducts(): any[] {
    return this.paginatedProducts.filter(p => p.checked);
  }
  
  toggleAllCheckboxes(): void {
    this.paginatedProducts.forEach(p => p.checked = this.selectAll);
  }
  
  updateSelection(): void {
    const total = this.paginatedProducts.length;
    const selected = this.paginatedProducts.filter(p => p.checked).length;
    this.selectAll = total === selected;
  }

  deleteProduct(id : number){
    this.productService.deleteProduct(id).subscribe({
      next: () => 
        this.loadProduct(),
      error: (err) => 
        console.error('Error deleting product', err)
    });
  }
  
  showDeleteConfirm() {
    const selectedIds = this.selectedProducts.map(p => p.id);

    if (selectedIds.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Products Selected',
        text: 'Please select at least one product to delete.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    Swal.fire({
      title: `Are you sure you want to delete ${selectedIds.length} product(s)?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteSelectedProducts(selectedIds);
      }
    });
  }

  deleteSelectedProducts(ids: number[]) {
    const deleteRequests = ids.map(id =>
      this.productService.deleteProduct(id)
    );

    Promise.all(deleteRequests.map(req => req.toPromise()))
      .then(() => {
        this.loadProduct();
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Selected product(s) have been deleted.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3085d6'
        });
      })
      .catch(err => {
        console.error('Error deleting products', err);
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: 'There was an error deleting the products.',
          confirmButtonColor: '#3085d6'
        });
      });
  }
  
  // Export to Excel using backend service
  async exportToCSV(): Promise<void> {
    try {
      Swal.fire({
        title: 'Generating CSV Report...',
        text: 'Please wait while we prepare your report.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.productService.exportAllProductsToCSV().subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Britium_Gallery_All_Products_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
          link.click();
          window.URL.revokeObjectURL(url);

          Swal.fire({
            icon: 'success',
            title: 'Export Successful!',
            text: 'All products have been exported successfully.',
            timer: 3000,
            showConfirmButton: false
          });
        },
        error: (error: any) => {
          console.error('CSV export error:', error);
          Swal.fire({
            icon: 'error',
            title: 'Export Failed',
            text: 'There was an error exporting all products to CSV.',
            confirmButtonColor: '#3085d6'
          });
        }
      });
    } catch (error) {
      console.error('CSV export error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'There was an error exporting to CSV. Please try again.',
        confirmButtonColor: '#3085d6'
      });
    }
  }

  // Export selected products to CSV (using backend service)
  async exportSelectedToCSV(): Promise<void> {
    const selectedProducts = this.selectedProducts;
    if (selectedProducts.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Products Selected',
        text: 'Please select at least one product to export.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    try {
      Swal.fire({
        title: 'Generating CSV Report...',
        text: 'Please wait while we prepare your report.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Get selected product IDs
      const selectedProductIds = selectedProducts.map(p => p.id);

      this.productService.exportSelectedProductsToCSV(selectedProductIds).subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Britium_Gallery_Selected_Products_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
          link.click();
          window.URL.revokeObjectURL(url);

          Swal.fire({
            icon: 'success',
            title: 'Export Successful!',
            text: `Selected ${selectedProducts.length} product(s) have been exported successfully.`,
            timer: 3000,
            showConfirmButton: false
          });
        },
        error: (error: any) => {
          console.error('CSV export error:', error);
          Swal.fire({
            icon: 'error',
            title: 'Export Failed',
            text: 'There was an error exporting the selected products to CSV.',
            confirmButtonColor: '#3085d6'
          });
        }
      });
    } catch (error) {
      console.error('CSV export error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'There was an error exporting the selected products to CSV.',
        confirmButtonColor: '#3085d6'
      });
    }
  }

  // Removed old helper methods - now using backend service

  // Removed ExcelJS internal export method - now using backend service

  // Export to PDF using backend service
  async exportToPDF(): Promise<void> {
    try {
      Swal.fire({
        title: 'Generating Report...',
        text: 'Please wait while we generate your PDF report...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.productService.exportProductReportToPDF().subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          // Use .pdf extension for PDF files
          const fileExtension = '.pdf';
          link.download = `Britium_Gallery_Product_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}${fileExtension}`;
          link.click();
          window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'Export Successful!',
            text: 'Product report has been exported successfully.',
            timer: 3000,
        showConfirmButton: false
          });
        },
        error: (error) => {
          console.error('PDF export error:', error);
          Swal.fire({
            icon: 'error',
            title: 'Export Failed',
            text: 'There was an error exporting the product report to PDF.',
            confirmButtonColor: '#3085d6'
          });
        }
      });
    } catch (error) {
      console.error('PDF export error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'There was an error exporting the product report to PDF.',
        confirmButtonColor: '#3085d6'
      });
    }
  }

  // Export selected products to PDF (using backend service)
  async exportSelectedToPDF(): Promise<void> {
    const selectedProducts = this.selectedProducts;
    if (selectedProducts.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Products Selected',
        text: 'Please select at least one product to export.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    try {
      Swal.fire({
        title: 'Generating Report...',
        text: 'Please wait while we generate your PDF report...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Get selected product IDs
      const selectedProductIds = selectedProducts.map(p => p.id);

      this.productService.exportSelectedProductsToPDF(selectedProductIds).subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          // Use .pdf extension for PDF files
          const fileExtension = '.pdf';
          link.download = `Britium_Gallery_Selected_Products_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}${fileExtension}`;
          link.click();
          window.URL.revokeObjectURL(url);

          Swal.fire({
            icon: 'success',
            title: 'Export Successful!',
            text: `Selected ${selectedProducts.length} product(s) have been exported successfully.`,
            timer: 3000,
            showConfirmButton: false
          });
        },
        error: (error) => {
          console.error('PDF export error:', error);
          Swal.fire({
            icon: 'error',
            title: 'Export Failed',
            text: 'There was an error exporting the selected products to PDF.',
            confirmButtonColor: '#3085d6'
          });
        }
      });
    } catch (error) {
      console.error('PDF export error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'There was an error exporting the selected products to PDF.',
        confirmButtonColor: '#3085d6'
      });
    }
  }

  // Removed jsPDF internal export method - now using backend service

  // Helper method to get status text
  private getStatusText(product: ProductList): string {
    if (product.quantity <= 5 && product.quantity > 0) {
      return 'Low Stock';
    } else if (product.quantity === 0) {
      return 'Out of Stock';
    } else if (product.status === 1) {
      return 'Active';
    } else {
      return 'Inactive';
    }
  }

  get totalItems(): number {
    return this.filteredProducts.length;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  get showingFrom(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  goToProductDetail(productId: number): void {
    this.router.navigate(['/admin/products', productId]);
  }

  toggleAttributeDropdown(attrId: number) {
    this.expandedAttributeId = this.expandedAttributeId === attrId ? null : attrId;
  }

  openEditAttributeValueModal(attr: Attribute) {
    const modalRef = this.ngbModel.open(CreateAttributeValueComponent);
    modalRef.componentInstance.attributeId = attr.id;
    modalRef.result.finally(() => {
      this.loadAttributes();
    });
  }

  isColorAttribute(attrName: string): boolean {
    if (!attrName) return false;
    const name = attrName.toLowerCase().trim();
    return ['color', 'colors', 'colour', 'colours'].includes(name);
  }

  // Helper method to check if a value is a hex color code
  isHexColor(value: string): boolean {
    if (!value) return false;
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(value.trim());
  }

  // Helper method to test color attribute detection
  testColorAttribute(attrName: string, attrValue: string): boolean {
    return this.isColorAttribute(attrName) && this.isHexColor(attrValue);
  }

  // Helper method to format variant attributes with color circles
  formatVariantAttributes(attributes: any[]): string {
    if (!attributes || attributes.length === 0) return 'No attributes';
    
    return attributes.map((attr: any) => {
      const attrName = attr.attributeName || attr.attribute_name;
      const attrValue = attr.value;
      
      // Check if it's a color attribute with hex value
      if (this.testColorAttribute(attrName, attrValue)) {
        // Create a colored circle using Unicode character with color styling
        const colorCircle = '●';
        return `${attrName}: ${colorCircle} ${attrValue}`;
      }
      
      return `${attrName}: ${attrValue}`;
    }).join(', ');
  }

  // Helper method to format variant attributes for HTML display with color circles
  formatVariantAttributesHTML(attributes: any[]): string {
    if (!attributes || attributes.length === 0) return 'No attributes';
    
    return attributes.map((attr: any) => {
      const attrName = attr.attributeName || attr.attribute_name;
      const attrValue = attr.value;
      
      // Check if it's a color attribute with hex value
      if (this.testColorAttribute(attrName, attrValue)) {
        const colorCircle = this.createColorCircle(attrValue, 12);
        return `${attrName}: ${colorCircle} ${attrValue}`;
      }
      
      return `${attrName}: ${attrValue}`;
    }).join(', ');
  }

  // Helper method to create color circle HTML for display
  createColorCircle(hexColor: string, size: number = 16): string {
    return `<div style="
      display: inline-block;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background-color: ${hexColor};
      border: 1px solid #ccc;
      margin-right: 4px;
      vertical-align: middle;
    "></div>`;
  }

  // Helper method to create colored circle for Excel/PDF
  createColoredCircle(hexColor: string): string {
    // For Excel/PDF, we'll use a Unicode circle with color information
    // Note: Excel/PDF don't support actual colored Unicode characters
    // So we'll use the circle symbol and rely on the hex code for color reference
    return '●';
  }

  // Helper method to create rich text with colored circles for Excel
  createRichTextWithColoredCircles(attributes: any[]): any {
    if (!attributes || attributes.length === 0) {
      return { richText: [{ text: 'No attributes' }] };
    }

    const richTextParts: any[] = [];
    
    attributes.forEach((attr, index) => {
      const attrName = attr.attributeName || attr.attribute_name;
      const attrValue = attr.value;
      
      // Add attribute name
      richTextParts.push({ text: `${attrName}: ` });
      
      // Check if it's a color attribute with hex value
      if (this.testColorAttribute(attrName, attrValue)) {
        // Add colored circle (we'll use a special character that Excel can style)
        richTextParts.push({ 
          text: '●',
          font: { color: { rgb: attrValue } }
        });
        richTextParts.push({ text: ` ${attrValue}` });
      } else {
        richTextParts.push({ text: attrValue });
      }
      
      // Add separator if not last attribute
      if (index < attributes.length - 1) {
        richTextParts.push({ text: ', ' });
      }
    });

    return { richText: richTextParts };
  }

  // Helper method to format variant attributes with actual colored circles
  formatVariantAttributesWithColors(attributes: any[]): string {
    if (!attributes || attributes.length === 0) return 'No attributes';
    
    return attributes.map((attr: any) => {
      const attrName = attr.attributeName || attr.attribute_name;
      const attrValue = attr.value;
      
      // Check if it's a color attribute with hex value
      if (this.testColorAttribute(attrName, attrValue)) {
        // For now, just show the hex code without circle since Excel doesn't support colored Unicode
        return `${attrName}: ${attrValue}`;
      }
      
      return `${attrName}: ${attrValue}`;
    }).join(', ');
  }

  // Helper method to create a more visible color indicator
  createColorIndicator(hexColor: string): string {
    // Use a different Unicode character that might be more visible
    return '●'; // Black circle
  }

  // Helper method to format variant attributes with ExcelJS colors
  formatVariantAttributesWithExcelJSColors(attributes: any[]): string {
    if (!attributes || attributes.length === 0) return 'No attributes';
    
    return attributes.map((attr: any) => {
      const attrName = attr.attributeName || attr.attribute_name;
      const attrValue = attr.value;
      
      // Check if it's a color attribute with hex value
      if (this.testColorAttribute(attrName, attrValue)) {
        // For now, just show the hex code since colored circles are complex in Excel
        return `${attrName}: ${attrValue}`;
      }
      
      return `${attrName}: ${attrValue}`;
    }).join(', ');
  }

  // Removed ExcelJS color-related methods - now using backend service

  openCreateAttributeValueModal() {
    const modalRef = this.ngbModel.open(CreateAttributeValueComponent);
    modalRef.componentInstance.createMode = true;
    modalRef.componentInstance.attributeSaved.subscribe(() => {
      this.loadAttributes();
    });
  }

  // Price formatting methods
  formatPrice(price: number, currency: string = 'MMK'): string {
    return this.priceFormatService.formatPrice(price, currency);
  }

  formatPriceOnly(price: number): string {
    return this.priceFormatService.formatPriceOnly(price);
  }

  formatDiscountedPrice(originalPrice: number, discountValue: number, discountType: string, currency: string = 'MMK'): string {
    return this.priceFormatService.formatDiscountedPrice(originalPrice, discountValue, discountType, currency);
  }

  formatDiscountText(discountValue: number, discountType: string): string {
    return this.priceFormatService.formatDiscountText(discountValue, discountType);
  }
}

