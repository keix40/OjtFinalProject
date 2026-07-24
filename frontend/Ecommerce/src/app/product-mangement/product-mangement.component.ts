import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ProductService } from '../services/product.service';
import { Brand } from '../brand';
import { Category } from '../category';
import { CategoryService } from '../services/category.service';
import { BrandService } from '../services/brand.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ImageService } from '../services/image.service';
import { Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { PermissionConstants } from '../constants/permission.constants';
import { AttributeService } from '../services/attribute.service';
import { Attribute, AttributeValue } from '../attribute';
import { CreateAttributeValueComponent } from '../create-attribute-value/create-attribute-value.component';
import { PriceFormatService } from '../services/price-format.service';
import { SelectionStore } from '../core/state/selection-store';
import { LuxDialogService } from '../shared/dialog/lux-dialog.service';

declare var lucide: any;

export interface ProductImage {
  id: number;
  imageUrl: string;
  status: number;
  variantId?: number | null;
}

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
  productImages: ProductImage[];
  brandId?: number;
  categoryId?: number;
  variants?: Variant[];
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
  selector: 'app-product-mangement',
  standalone: false,
  templateUrl: './product-mangement.component.html',
  styleUrl: './product-mangement.component.css',
  providers: [SelectionStore],
})
export class ProductMangementComponent implements OnInit, OnDestroy, AfterViewInit {
  products: ProductList[] = [];
  filteredProducts: ProductList[] = [];
  brands: Brand[] = [];
  categories: Category[] = [];
  searchTerm = '';
  selectedCategory = 0;
  selectedBrand = 0;
  selectedStatus: 'all' | 'active' | 'inactive' | 'low-stock' = 'all';

  csvDropdownOpen = false;
  pdfDropdownOpen = false;

  /** 0-based page index for lux-paginator */
  currentPage = 0;
  pageSize = 10;
  paginatedProducts: ProductList[] = [];
  loading = false;

  attributes: Attribute[] = [];
  attributeValues: { [attributeId: number]: AttributeValue[] } = {};
  editingAttributeId: number | null = null;
  editingAttributeValueId: number | null = null;
  editAttributeName = '';
  editAttributeValue = '';
  expandedAttributeId: number | null = null;

  public PermissionConstants = PermissionConstants;
  public permissionService: PermissionService;

  constructor(
    private productService: ProductService,
    private cateService: CategoryService,
    private brandService: BrandService,
    private ngbModel: NgbModal,
    public imageService: ImageService,
    public router: Router,
    private attributeService: AttributeService,
    permissionService: PermissionService,
    private priceFormatService: PriceFormatService,
    public selection: SelectionStore<number>,
    private dialog: LuxDialogService
  ) {
    this.permissionService = permissionService;
  }

  ngOnInit(): void {
    this.loadProduct();
    this.loadCategory();
    this.loadBrand();
    this.loadAttributes();
    document.addEventListener('click', this.handleDocumentClick);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleDocumentClick);
  }

  ngAfterViewInit(): void {
    this.refreshIcons();
  }

  private handleDocumentClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    if (!target.closest('.lux-export-menu')) {
      this.csvDropdownOpen = false;
      this.pdfDropdownOpen = false;
    }
  };

  private refreshIcons(): void {
    setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).lucide) {
        (window as any).lucide.createIcons();
      } else if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }, 0);
  }

  toggleCsvDropdown(): void {
    this.csvDropdownOpen = !this.csvDropdownOpen;
    if (this.csvDropdownOpen) this.pdfDropdownOpen = false;
  }

  togglePdfDropdown(): void {
    this.pdfDropdownOpen = !this.pdfDropdownOpen;
    if (this.pdfDropdownOpen) this.csvDropdownOpen = false;
  }

  get pageIds(): number[] {
    return this.paginatedProducts.map((p) => p.id);
  }

  get selectedCount(): number {
    return this.selection.count();
  }

  get selectedProducts(): ProductList[] {
    const ids = new Set(this.selection.ids());
    return this.products.filter((p) => ids.has(p.id));
  }

  get allPageSelected(): boolean {
    return this.selection.isPageAllSelected(this.pageIds);
  }

  get partialPageSelected(): boolean {
    return this.selection.isPagePartialSelected(this.pageIds);
  }

  isRowSelected = (row: unknown): boolean =>
    this.selection.isSelected((row as ProductList).id);

  trackByProductId = (_index: number, row: unknown): number =>
    (row as ProductList).id;

  trackByAttrId = (_index: number, row: unknown): number =>
    (row as Attribute).id;

  onToggleAll(checked: boolean): void {
    this.selection.setPage(this.pageIds, checked);
  }

  onToggleRow(event: { row: unknown; checked: boolean }): void {
    const product = event.row as ProductList;
    this.selection.toggle(product.id, event.checked);
  }

  editSelectedProduct(): void {
    const selected = this.selectedProducts;

    if (selected.length === 0) {
      this.dialog.warning('No Product Selected', 'Please select a product to edit.');
      return;
    }

    if (selected.length > 1) {
      this.dialog.warning('Multiple Products Selected', 'Please select only one product to edit.');
      return;
    }

    this.router.navigate(['/product-edit', selected[0].id]);
  }

  loadProduct(): void {
    this.loading = true;
    this.productService.getAllProduct().subscribe({
      next: (data) => {
        this.products = data.map((p) => ({ ...p }));
        this.applyFilters();
        this.selection.clear();
        this.loading = false;
        this.refreshIcons();
      },
      error: (err) => {
        console.error('Product error:', err);
        this.loading = false;
        this.dialog.error('Error Loading Products', 'There was an error loading the products. Please try again later.');
      },
    });
  }

  loadCategory(): void {
    this.cateService.getAllCategory().subscribe({
      next: (data) => (this.categories = data),
      error: (err) => console.error('Category error:', err),
    });
  }

  onCategoryChange(): void {
    if (this.selectedCategory != 0) {
      this.brandService.getBrandByCateId(this.selectedCategory).subscribe({
        next: (data) => {
          this.brands = data;
        },
        error: (err) => {
          console.error('Error loading brands by category', err);
          this.brands = [];
        },
      });
    } else {
      this.loadBrand();
    }
    this.applyFilters();
  }

  onBrandChange(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  loadBrand(): void {
    this.brandService.getAllBrand().subscribe({
      next: (data) => (this.brands = data),
      error: (err) => console.error('Brand error:', err),
    });
  }

  loadAttributes(): void {
    this.attributeService.getAllAttribute().subscribe((attrs) => {
      this.attributes = attrs;
      attrs.forEach((attr) => {
        this.attributeService.getValueById(attr.id).subscribe((dtos) => {
          this.attributeValues[attr.id] =
            dtos && dtos.length > 0 && dtos[0].values ? dtos[0].values : [];
        });
      });
    });
  }

  startEditAttribute(attr: Attribute): void {
    this.editingAttributeId = attr.id;
    this.editAttributeName = attr.name;
  }

  saveEditAttribute(attr: Attribute): void {
    this.attributeService.updateAttribute(attr.id, this.editAttributeName).subscribe(() => {
      attr.name = this.editAttributeName;
      this.editingAttributeId = null;
    });
  }

  cancelEditAttribute(): void {
    this.editingAttributeId = null;
  }

  async deleteAttribute(attr: Attribute): Promise<void> {
    const ok = await this.dialog.confirm({
      title: 'Delete attribute?',
      text: 'Do you want to delete this attribute?',
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) return;

    this.attributeService.deleteAttribute(attr.id).subscribe(() => {
      this.attributes = this.attributes.filter((a) => a.id !== attr.id);
      delete this.attributeValues[attr.id];
      this.dialog.toast('Attribute deleted');
    });
  }

  startEditAttributeValue(attrId: number, value: AttributeValue): void {
    this.editingAttributeValueId = value.id ?? null;
    this.editAttributeValue = value.value;
  }

  saveEditAttributeValue(attrId: number, value: AttributeValue): void {
    if (value.id !== undefined) {
      this.attributeService.updateAttributeValue(value.id, this.editAttributeValue).subscribe(() => {
        value.value = this.editAttributeValue;
        this.editingAttributeValueId = null;
      });
    }
  }

  cancelEditAttributeValue(): void {
    this.editingAttributeValueId = null;
  }

  deleteAttributeValue(attrId: number, value: AttributeValue): void {
    if (value.id !== undefined) {
      this.attributeService.deleteAttributeValue(value.id).subscribe(() => {
        this.attributeValues[attrId] = this.attributeValues[attrId].filter((v) => v.id !== value.id);
      });
    }
  }

  onSearch(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredProducts = this.products.filter((product) => {
      const matchesName = product.productName?.toLowerCase().includes(term);
      let brandName = '';
      let categoryName = '';
      if (product.brandId != null) {
        const brand = this.brands.find((b) => b.id === product.brandId);
        brandName = brand ? brand.name.toLowerCase() : '';
      }
      if (product.categoryId != null) {
        const category = this.categories.find((c) => c.id === product.categoryId);
        categoryName = category ? category.name.toLowerCase() : '';
      }
      const matchesSearch = !term || matchesName || brandName.includes(term) || categoryName.includes(term);

      const matchesCategory =
        !this.selectedCategory || product.categoryId === this.selectedCategory;
      const matchesBrand = !this.selectedBrand || product.brandId === this.selectedBrand;

      let matchesStatus = true;
      if (this.selectedStatus === 'active') {
        matchesStatus = product.status === 1 && product.quantity > 0;
      } else if (this.selectedStatus === 'inactive') {
        matchesStatus = product.status === 0;
      } else if (this.selectedStatus === 'low-stock') {
        matchesStatus = product.quantity > 0 && product.quantity <= 5;
      }

      return matchesSearch && matchesCategory && matchesBrand && matchesStatus;
    });
    this.currentPage = 0;
    this.updatePaginatedProducts();
  }

  updatePaginatedProducts(): void {
    const start = this.currentPage * this.pageSize;
    this.paginatedProducts = this.filteredProducts.slice(start, start + this.pageSize);
    this.refreshIcons();
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.updatePaginatedProducts();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.pageSize) || 0;
  }

  get totalItems(): number {
    return this.filteredProducts.length;
  }

  getBaseImage(product: ProductList): string | null {
    const img = product.productImages?.find((i) => i.variantId == null);
    return img ? this.imageService.getFullImageUrl(img.imageUrl) : null;
  }

  getStatusTone(product: ProductList): 'success' | 'warning' | 'danger' | 'default' {
    if (product.quantity <= 5 && product.quantity > 0) return 'warning';
    if (product.quantity === 0) return 'danger';
    if (product.status === 1) return 'success';
    return 'default';
  }

  getStatusLabel(product: ProductList): string {
    if (product.quantity <= 5 && product.quantity > 0) return 'Low Stock';
    if (product.quantity === 0) return 'Out of Stock';
    if (product.status === 1) return 'Active';
    return 'Inactive';
  }

  deleteProduct(id: number): void {
    this.productService.deleteProduct(id).subscribe({
      next: () => this.loadProduct(),
      error: (err) => console.error('Error deleting product', err),
    });
  }

  async showDeleteConfirm(): Promise<void> {
    const selectedIds = this.selection.ids();

    if (selectedIds.length === 0) {
      this.dialog.warning('No Products Selected', 'Please select at least one product to delete.');
      return;
    }

    const ok = await this.dialog.confirm({
      title: `Delete ${selectedIds.length} product(s)?`,
      text: 'This action cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (ok) {
      this.deleteSelectedProducts(selectedIds);
    }
  }

  deleteSelectedProducts(ids: number[]): void {
    const deleteRequests = ids.map((id) => this.productService.deleteProduct(id));

    Promise.all(deleteRequests.map((req) => req.toPromise()))
      .then(() => {
        this.selection.clear();
        this.loadProduct();
        this.dialog.toast('Selected product(s) deleted');
      })
      .catch((err) => {
        console.error('Error deleting products', err);
        this.dialog.error('Delete Failed', 'There was an error deleting the products.');
      });
  }

  async exportToCSV(): Promise<void> {
    try {
      this.dialog.fire({
        title: 'Generating CSV Report...',
        text: 'Please wait while we prepare your report.',
        allowOutsideClick: false,
        didOpen: () => {
          // SweetAlert loading via escape hatch
          import('sweetalert2').then((m) => m.default.showLoading());
        },
      });

      this.productService.exportAllProductsToCSV().subscribe({
        next: (blob: Blob) => {
          this.downloadBlob(
            blob,
            `Britium_Gallery_All_Products_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`
          );
          this.dialog.toast('All products exported');
        },
        error: (error: any) => {
          console.error('CSV export error:', error);
          this.dialog.error('Export Failed', 'There was an error exporting all products to CSV.');
        },
      });
    } catch (error) {
      console.error('CSV export error:', error);
      this.dialog.error('Export Failed', 'There was an error exporting to CSV. Please try again.');
    }
  }

  async exportSelectedToCSV(): Promise<void> {
    const selectedIds = this.selection.ids();
    if (selectedIds.length === 0) {
      this.dialog.warning('No Products Selected', 'Please select at least one product to export.');
      return;
    }

    try {
      this.dialog.fire({
        title: 'Generating CSV Report...',
        text: 'Please wait while we prepare your report.',
        allowOutsideClick: false,
        didOpen: () => {
          import('sweetalert2').then((m) => m.default.showLoading());
        },
      });

      this.productService.exportSelectedProductsToCSV(selectedIds).subscribe({
        next: (blob: Blob) => {
          this.downloadBlob(
            blob,
            `Britium_Gallery_Selected_Products_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`
          );
          this.dialog.toast(`Exported ${selectedIds.length} product(s)`);
        },
        error: (error: any) => {
          console.error('CSV export error:', error);
          this.dialog.error('Export Failed', 'There was an error exporting the selected products to CSV.');
        },
      });
    } catch (error) {
      console.error('CSV export error:', error);
      this.dialog.error('Export Failed', 'There was an error exporting the selected products to CSV.');
    }
  }

  async exportToPDF(): Promise<void> {
    try {
      this.dialog.fire({
        title: 'Generating Report...',
        text: 'Please wait while we generate your PDF report...',
        allowOutsideClick: false,
        didOpen: () => {
          import('sweetalert2').then((m) => m.default.showLoading());
        },
      });

      this.productService.exportProductReportToPDF().subscribe({
        next: (blob: Blob) => {
          this.downloadBlob(
            blob,
            `Britium_Gallery_Product_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`
          );
          this.dialog.toast('Product report exported');
        },
        error: (error) => {
          console.error('PDF export error:', error);
          this.dialog.error('Export Failed', 'There was an error exporting the product report to PDF.');
        },
      });
    } catch (error) {
      console.error('PDF export error:', error);
      this.dialog.error('Export Failed', 'There was an error exporting the product report to PDF.');
    }
  }

  async exportSelectedToPDF(): Promise<void> {
    const selectedIds = this.selection.ids();
    if (selectedIds.length === 0) {
      this.dialog.warning('No Products Selected', 'Please select at least one product to export.');
      return;
    }

    try {
      this.dialog.fire({
        title: 'Generating Report...',
        text: 'Please wait while we generate your PDF report...',
        allowOutsideClick: false,
        didOpen: () => {
          import('sweetalert2').then((m) => m.default.showLoading());
        },
      });

      this.productService.exportSelectedProductsToPDF(selectedIds).subscribe({
        next: (blob: Blob) => {
          this.downloadBlob(
            blob,
            `Britium_Gallery_Selected_Products_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`
          );
          this.dialog.toast(`Exported ${selectedIds.length} product(s)`);
        },
        error: (error) => {
          console.error('PDF export error:', error);
          this.dialog.error('Export Failed', 'There was an error exporting the selected products to PDF.');
        },
      });
    } catch (error) {
      console.error('PDF export error:', error);
      this.dialog.error('Export Failed', 'There was an error exporting the selected products to PDF.');
    }
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  goToProductDetail(productId: number): void {
    this.router.navigate(['/admin/products', productId]);
  }

  openEditAttributeValueModal(attr: Attribute): void {
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

  openCreateAttributeValueModal(): void {
    const modalRef = this.ngbModel.open(CreateAttributeValueComponent);
    modalRef.componentInstance.createMode = true;
    modalRef.componentInstance.attributeSaved.subscribe(() => {
      this.loadAttributes();
    });
  }

  formatPriceOnly(price: number): string {
    return this.priceFormatService.formatPriceOnly(price);
  }
}
