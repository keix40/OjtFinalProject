import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { EventService } from '../services/event.service';
import { DiscountService, DiscountDTO } from '../services/discount.service';
import { ProductService } from '../services/product.service';
import { EventDTO } from '../event-dto';
import { ProductDTO } from '../product';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ActivatedRoute } from '@angular/router';
declare var lucide: any;

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return date.getFullYear() + '-' +
    pad(date.getMonth() + 1) + '-' +
    pad(date.getDate()) + 'T' +
    pad(date.getHours()) + ':' +
    pad(date.getMinutes());
}

function toBackendLocalDatetime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return date.getFullYear() + '-' +
    pad(date.getMonth() + 1) + '-' +
    pad(date.getDate()) + 'T' +
    pad(date.getHours()) + ':' +
    pad(date.getMinutes());
}

@Component({
  selector: 'app-create-event',
  standalone: true,
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class CreateEventComponent implements OnInit {
  @ViewChild('cropperContainer') cropperContainer!: ElementRef;
  @ViewChild('cropperImage') cropperImage!: ElementRef;
  @ViewChild('cropBox') cropBox!: ElementRef;
  @ViewChild('cropOverlay') cropOverlay!: ElementRef;

  event: EventDTO = {
    name: '',
    description: '',
    slideNo: 1,
    startDate: '',
    endDate: '',
    isDefault: 0,
    status: 1,
    discountId: null,
    productIds: [],
    eventImage: ''
  };
  discounts: DiscountDTO[] = [];
  products: ProductDTO[] = [];
  selectedProducts: ProductDTO[] = [];
  imageFile: File | null = null;
  imagePreview: string | null = null;
  isEditMode = false;
  removeExistingImage = false;

  // Modal state
  showProductModal = false;
  showCropModal = false;

  // Cropper properties
  originalImageForCrop: string | null = null;
  croppedImagePreview: string | null = null;
  cropData = {
    x: 0,
    y: 0,
    width: 300,
    height: 169,
    scale: 1
  };
  isDragging = false;
  isResizing = false;
  resizeDirection = '';
  dragStart = { x: 0, y: 0 };
  originalCropData = { x: 0, y: 0, width: 300, height: 169 };

  // Event type radio
  eventType: 'discount' | 'product' = 'discount';

  // Date validation
  todayString: string = '';
  startDateError: string = '';
  originalStartDate: string | null = null;

  // Product modal search and filter
  productSearchTerm: string = '';
  filteredProducts: ProductDTO[] = [];

  isNameExists = false;
  slideNoError = '';

  constructor(
    private eventService: EventService,
    private discountService: DiscountService,
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.discountService.getActiveAliveDiscount().subscribe(discounts => this.discounts = discounts);
    this.productService.getAllAcProduct().subscribe(products => {
      this.products = products;
      this.updateFilteredProducts();
      if (this.isEditMode) {
        if (!Array.isArray(this.event.productIds)) {
          this.event.productIds = [];
        }
        this.selectedProducts = this.products.filter(p => (this.event.productIds ?? []).includes(p.id));
      }
    });
    const now = new Date();
    this.todayString = toDatetimeLocal(now);
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.eventService.getEventById(+id).subscribe(event => {
          this.event = { ...this.event, ...event };
          if (!Array.isArray(this.event.productIds)) {
            this.event.productIds = [];
          }
          this.originalStartDate = event.startDate;
          if (event.startDate) {
            this.event.startDate = toDatetimeLocal(new Date(event.startDate));
          }
          if (event.endDate) {
            this.event.endDate = toDatetimeLocal(new Date(event.endDate));
          }
          if (event.discountId) {
            this.eventType = 'discount';
          } else if (Array.isArray(event.productIds) && event.productIds.length > 0) {
            this.eventType = 'product';
            this.event.productIds = event.productIds;
            setTimeout(() => {
              this.selectedProducts = this.products.filter(p => (event.productIds ?? []).includes(p.id));
            }, 0);
          }
          if (event.eventImage) {
            if (event.eventImage.startsWith('http') || event.eventImage.startsWith('data:')) {
              this.imagePreview = event.eventImage;
            } else {
              this.imagePreview = 'http://localhost:8080' + event.eventImage;
            }
          }
        });
      } else {
        // On create, fetch next slideNo
        this.eventService.getNextSlideNo().subscribe({
          next: (num) => {
            this.event.slideNo = num;
          },
          error: (err) => {
            console.error('Error fetching next slide number:', err);
            this.event.slideNo = 1; // fallback to 1 if API fails
          }
        });
      }
    });
  }

  ngAfterViewInit() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  onImageChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imageFile = file;
      const reader = new FileReader();
      reader.onload = e => this.imagePreview = reader.result as string;
      reader.readAsDataURL(file);
      setTimeout(() => { if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons(); }, 0);
    }
  }

  openProductModal() {
    this.showProductModal = true;
    setTimeout(() => { if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons(); }, 0);
  }

  closeProductModal() {
    this.showProductModal = false;
    setTimeout(() => { if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons(); }, 0);
  }

  // --- Product Modal Filtering ---
  updateFilteredProducts() {
    const term = this.productSearchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredProducts = this.products.slice();
    } else {
      this.filteredProducts = this.products.filter(p => {
        const brandName = (p as any).brandName || (p.categoryBrandArray && p.categoryBrandArray.length > 0 && p.categoryBrandArray[0].brandName) || '';
        const categoryName = (p as any).categoryName || (p.categoryBrandArray && p.categoryBrandArray.length > 0 && p.categoryBrandArray[0].cateName) || '';
        return (
          (p.productName && p.productName.toLowerCase().includes(term)) ||
          (p.productCode && p.productCode.toLowerCase().includes(term)) ||
          (brandName && brandName.toLowerCase().includes(term)) ||
          (categoryName && categoryName.toLowerCase().includes(term))
        );
      });
    }
  }

  // Watch for search term changes
  ngDoCheck() {
    this.updateFilteredProducts();
  }

  areAllProductsSelected(): boolean {
    return this.filteredProducts.length > 0 && Array.isArray(this.event.productIds) && this.filteredProducts.every(p => (Array.isArray(this.event.productIds) ? this.event.productIds : []).includes(p.id));
  }

  toggleAllProducts() {
    if (!Array.isArray(this.event.productIds)) {
      this.event.productIds = [];
    }
    if (this.areAllProductsSelected()) {
      // Deselect all filtered
      this.filteredProducts.forEach(p => {
        if (Array.isArray(this.event.productIds)) {
          const idx = this.event.productIds.indexOf(p.id);
          if (idx > -1) {
            this.event.productIds.splice(idx, 1);
            this.selectedProducts = this.selectedProducts.filter(sp => sp.id !== p.id);
          }
        }
      });
    } else {
      // Select all filtered
      this.filteredProducts.forEach(p => {
        if (Array.isArray(this.event.productIds) && !this.event.productIds.includes(p.id)) {
          this.event.productIds.push(p.id);
          this.selectedProducts.push(p);
        }
      });
    }
  }

  toggleProductSelection(product: ProductDTO) {
    if (!Array.isArray(this.event.productIds)) {
      this.event.productIds = [];
    }
    if (Array.isArray(this.event.productIds)) {
      const idx = this.event.productIds.indexOf(product.id ?? -1);
      if (idx > -1) {
        this.event.productIds.splice(idx, 1);
        this.selectedProducts = this.selectedProducts.filter(p => p.id !== product.id);
      } else {
        this.event.productIds.push(product.id);
        // Only add if not already present
        if (!this.selectedProducts.some(p => p.id === product.id)) {
          this.selectedProducts.push(product);
        }
      }
    }
  }

  removeSelectedProduct(p: ProductDTO) {
    if (!Array.isArray(this.event.productIds)) {
      this.event.productIds = [];
    }
    if (Array.isArray(this.event.productIds)) {
      const idx = this.event.productIds.indexOf(p.id);
      if (idx > -1) {
        this.event.productIds.splice(idx, 1);
      }
    }
    this.selectedProducts = this.selectedProducts.filter(sp => sp.id !== p.id);
  }

  validateStartDate() {
    if (!this.event.startDate) {
      this.startDateError = '';
      return;
    }
    const selected = new Date(this.event.startDate);
    const now = new Date();
    now.setSeconds(0, 0);
    const oneYearFromNow = new Date(now);
    oneYearFromNow.setFullYear(now.getFullYear() + 1);
    if (this.isEditMode && this.originalStartDate) {
      const original = new Date(this.originalStartDate);
      if (selected < original) {
        this.startDateError = 'Start date cannot be before the original event start date.';
        return;
      }
    }
    if (selected < now) {
      this.startDateError = 'Start date cannot be before today.';
    } else if (selected > oneYearFromNow) {
      this.startDateError = 'Start date cannot be more than 1 year from today.';
    } else {
      this.startDateError = '';
    }
  }

  onIsDefaultChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.event.isDefault = checked ? 1 : 0;
  }

  onStatusChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.event.status = checked ? 1 : 0;
  }

  // Validator: start and end date must not be the same exact time
  startEndDateNotSameTimeValidator(): boolean {
    const start = this.event.startDate;
    const end = this.event.endDate;
    if (start && end && new Date(start).getTime() === new Date(end).getTime()) {
      return false;
    }
    return true;
  }

  removeExistingEventImage() {
    this.imagePreview = null;
    this.removeExistingImage = true;
    (this.event as any).removeImage = true;
  }

  // Remove image method for template
  removeImage() {
    this.imagePreview = null;
    this.imageFile = null;
  }

  onSubmit() {
    if (this.startDateError) {
      return;
    }
    if (!this.startEndDateNotSameTimeValidator()) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Dates',
        text: 'Start date and end date cannot be the same.',
        confirmButtonText: 'OK',
      });
      return;
    }
    if (this.eventType === 'discount') {
      this.event.productIds = [];
    } else {
      this.event.discountId = null;
    }
    if (this.event.startDate) {
      const d = new Date(this.event.startDate);
      this.event.startDate = toBackendLocalDatetime(d);
    }
    if (this.event.endDate) {
      const d = new Date(this.event.endDate);
      this.event.endDate = toBackendLocalDatetime(d);
    }
    const handleError = (err: any) => {
      let msg = 'Failed to create/update event. Please check your input and try again.';
      if (err && err.error && typeof err.error === 'string') {
        if (err.error.includes('Event name already exists')) {
          this.isNameExists = true;
          msg = 'Event name already exists.';
        } else if (err.error.includes('slideNo')) {
          this.slideNoError = 'Slide number must be at least 1.';
          msg = 'Slide number must be at least 1.';
        } else if (err.error.includes('Event name is required')) {
          this.isNameExists = true;
          msg = 'Event name is required.';
        }
      }
      // Fix: reformat startDate and endDate for input after error
      if (this.event.startDate) {
        this.event.startDate = toDatetimeLocal(new Date(this.event.startDate));
      }
      if (this.event.endDate) {
        this.event.endDate = toDatetimeLocal(new Date(this.event.endDate));
      }
      Swal.fire({
        icon: 'error',
        title: 'Create/Update Failed',
        text: msg,
        confirmButtonText: 'OK',
      });
    };
    if (this.isEditMode) {
      this.eventService.updateEvent(this.event.id!, this.event, this.imageFile!).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Event updated successfully!',
            confirmButtonText: 'OK',
          }).then(() => {
            this.router.navigate(['/admin/eventlist']);
          });
        },
        error: handleError
      });
    } else {
      this.eventService.createEvent(this.event, this.imageFile!).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Event created successfully!',
            confirmButtonText: 'OK',
          }).then(() => {
            this.router.navigate(['/admin/eventlist']);
          });
        },
        error: handleError
      });
    }
  }
}
