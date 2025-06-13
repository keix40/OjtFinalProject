import { Component } from '@angular/core';
import { ProductList } from '../product';
import { ProductService } from '../product.service';
import { Brand } from '../brand';
import { Category } from '../category';
import { CategoryService } from '../category.service';
import { BrandService } from '../brand.service';
import { ModalService } from '../modal.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModelComponent } from '../confirm-model/confirm-model.component';
import Swal from 'sweetalert2';
declare var $: any;

@Component({
  selector: 'app-product-mangement',
  standalone: false,
  templateUrl: './product-mangement.component.html',
  styleUrl: './product-mangement.component.css'
})
export class ProductMangementComponent {
  products: ProductList[] = [];
  brands: Brand[] = [];
  categories: Category[] = [];
  filteredProducts: any[] = [];


  selectedCategory: number = 0;
  selectedBrand: number = 0;

  selectAll: boolean = false;

  constructor(
    private productService: ProductService,
    private cateService: CategoryService,
    private brandService: BrandService,
    private ngbModel: NgbModal

  ) {}

  ngOnInit(): void {
    this.loadProduct();
    this.loadCategory();
    this.loadBrand();
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
  
  getProductImageUrl(imagePath: string): string {
    // console.log('http://localhost:8080' + imagePath);
    return 'http://localhost:8080' + imagePath;
  }
  
}
