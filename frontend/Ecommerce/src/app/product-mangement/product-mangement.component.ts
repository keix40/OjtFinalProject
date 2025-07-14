import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ProductList } from '../product';
import { ProductService } from '../services/product.service';
import { Brand } from '../brand';
import { Category } from '../category';
import { CategoryService } from '../services/category.service';
import { BrandService } from '../services/brand.service';
import { ModalService } from '../services/modal.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModelComponent } from '../confirm-model/confirm-model.component';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ImageService } from '../services/image.service';
declare var $: any;
declare var lucide: any;

@Component({
  selector: 'app-product-mangement',
  standalone: false,
  templateUrl: './product-mangement.component.html',
  styleUrl: './product-mangement.component.css'
})
export class ProductMangementComponent implements OnInit, OnDestroy, AfterViewInit {
  products: ProductList[] = [];
  brands: Brand[] = [];
  categories: Category[] = [];
  filteredProducts: any[] = [];

  selectedCategory: number = 0;
  selectedBrand: number = 0;
  selectAll: boolean = false;
  
  // Dropdown states
  excelDropdownOpen: boolean = false;
  pdfDropdownOpen: boolean = false;

  constructor(
    private productService: ProductService,
    private cateService: CategoryService,
    private brandService: BrandService,
    private ngbModel: NgbModal,
    public imageService: ImageService
  ) {}

  ngOnInit(): void {
    this.loadProduct();
    this.loadCategory();
    this.loadBrand();
    
    // Add click outside listener for dropdowns
    document.addEventListener('click', this.handleDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    // Remove event listener
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
    // Close dropdowns when clicking outside
    const target = event.target as HTMLElement;
    
    if (!target.closest('.relative.inline-block')) {
      this.excelDropdownOpen = false;
      this.pdfDropdownOpen = false;
    }
  }

  // Dropdown toggle methods
  toggleExcelDropdown(): void {
    this.excelDropdownOpen = !this.excelDropdownOpen;
    this.pdfDropdownOpen = false; // Close other dropdown
  }

  togglePdfDropdown(): void {
    this.pdfDropdownOpen = !this.pdfDropdownOpen;
    this.excelDropdownOpen = false; // Close other dropdown
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
    // You can implement navigation to edit page here
    // this.router.navigate(['/product/edit', productId]);
    
    Swal.fire({
      icon: 'info',
      title: 'Edit Product',
      text: `Edit functionality for product ID: ${productId}`,
      confirmButtonColor: '#3085d6'
    });
  }

  loadProduct() {
    this.productService.getAllProduct().subscribe({
      next: (data) => {
        this.products = data.map(p => ({ ...p, checked: false }));
  
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

  get selectedProducts(): any[] {
    return this.products.filter(p => p.checked);
  }
  
  toggleAllCheckboxes(): void {
    this.products.forEach(p => p.checked = this.selectAll);
  }
  
  updateSelection(): void {
    const total = this.products.length;
    const selected = this.products.filter(p => p.checked).length;
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
      alert('Please select at least one product to delete.');
      return;
    }
  
    const modalRef = this.ngbModel.open(ConfirmModelComponent, {
      backdrop: 'static',
      keyboard: false,
    });
  
    modalRef.componentInstance.message = `Are you sure you want to delete ${selectedIds.length} product(s)?`;
  
    modalRef.result.then((result) => {
      if (result) {
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
        window.location.reload();
      })
      .catch(err => {
        console.error('Error deleting products', err);
      });
  }
  
  // Export to Excel
  exportToExcel(): void {
    this.exportToExcelInternal(this.products);
  }

  // Export selected products to Excel
  exportSelectedToExcel(): void {
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
    this.exportToExcelInternal(selectedProducts);
  }

  // Internal Excel export method
  private exportToExcelInternal(productsToExport: ProductList[]): void {
    try {
      // Prepare data for export
      const exportData = productsToExport.map(product => ({
        'Product Name': product.productName,
        'SKU': product.productCode,
        'Price (MMK)': product.price,
        'Stock': product.quantity,
        'Status': this.getStatusText(product),
        'Description': product.description,
        'Created Date': new Date(product.createDate).toLocaleDateString(),
        'Updated Date': new Date(product.updateDate).toLocaleDateString()
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 30 }, // Product Name
        { wch: 15 }, // SKU
        { wch: 12 }, // Price
        { wch: 8 },  // Stock
        { wch: 12 }, // Status
        { wch: 40 }, // Description
        { wch: 12 }, // Created Date
        { wch: 12 }  // Updated Date
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

      // Generate filename with current date
      const fileName = `products_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, fileName);

      const productCount = productsToExport.length;
      Swal.fire({
        icon: 'success',
        title: 'Export Successful!',
        text: `${productCount} product(s) exported to ${fileName}`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Excel export error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'There was an error exporting the products to Excel.',
        confirmButtonColor: '#3085d6'
      });
    }
  }

  // Export to PDF
  exportToPDF(): void {
    this.exportToPDFInternal(this.products);
  }

  // Export selected products to PDF
  exportSelectedToPDF(): void {
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
    this.exportToPDFInternal(selectedProducts);
  }

  // Internal PDF export method
  private exportToPDFInternal(productsToExport: ProductList[]): void {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('Product Management Report', 14, 22);
      
      // Add date and product count
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
      doc.text(`Total Products: ${productsToExport.length}`, 14, 40);
      
      // Prepare table data
      const tableData = productsToExport.map(product => [
        product.productName,
        product.productCode,
        `${product.price} MMK`,
        product.quantity.toString(),
        this.getStatusText(product)
      ]);

      // Add table
      (doc as any).autoTable({
        head: [['Product Name', 'SKU', 'Price', 'Stock', 'Status']],
        body: tableData,
        startY: 50,
        styles: {
          fontSize: 10,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [13, 110, 253],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        columnStyles: {
          0: { cellWidth: 50 }, // Product Name
          1: { cellWidth: 25 }, // SKU
          2: { cellWidth: 25 }, // Price
          3: { cellWidth: 20 }, // Stock
          4: { cellWidth: 25 }  // Status
        }
      });

      // Generate filename with current date
      const fileName = `products_${new Date().toISOString().split('T')[0]}.pdf`;

      // Save file
      doc.save(fileName);

      const productCount = productsToExport.length;
      Swal.fire({
        icon: 'success',
        title: 'Export Successful!',
        text: `${productCount} product(s) exported to ${fileName}`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('PDF export error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'There was an error exporting the products to PDF.',
        confirmButtonColor: '#3085d6'
      });
    }
  }

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
}
