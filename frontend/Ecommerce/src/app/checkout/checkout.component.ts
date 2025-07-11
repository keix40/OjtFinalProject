import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../services/cart.service';
import { ImageService } from '../services/image.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AddressService, Address } from '../services/address.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as L from 'leaflet';
import { OrderService } from '../services/order.service';
import { HttpClient } from '@angular/common/http';
import { DiscountService } from '../services/discount.service';
import { ProductService } from '../services/product.service';
import { ProductDTO } from '../product';

@Component({
  selector: 'app-checkout',
  standalone: false,
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit, OnDestroy {
  discount: any;
  discountId: number | null = null;
  activeStep = 1;
  orderNumber = '';

  // Track completed steps
  stepCompleted: { [key: number]: boolean } = {};

  // Cart items
  cartItems: CartItem[] = [];
  private subscriptions: Subscription[] = [];

  couponCode: string = '';
  discountAmount: number = 0;
  discountMessage: string = '';
  isCouponValid: boolean = false;
  appliedCouponCode: string = '';

  // Customer info
  customer = {
    name: '',
    email: '',
    phone: ''
  };

  // Shipping info
  shipping = {
    address: '',
    city: '',
    state: '',
    postal: '',
    country: ''
  };

  // Delivery options
  delivery = {
    method: ''
  };
  deliveryOptions: any[] = [];

  // Payment info
  payment = {
    method: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    paypalEmail: ''
  };

  addresses: any[] = [];
  selectedAddressIndex: number | null = null;

  // Modal state
  showAddAddressModal = false;
  addressForm: FormGroup;
  isEditMode = false;
  
  // Map properties
  map: L.Map | undefined;
  marker: L.Marker | undefined;
  private geocodeTimeout: any = null;
  private forwardGeocodeTimeout: any = null;
  private latLngSource: 'manual' | 'forward' | 'location' | null = null;

  selectedDelivery: any = null;
  deliveryFee: number = 0;
  deliveryId: number | null = null;
  // userId: number | undefined;

  orderPreview: any = null;
  isFirstTimeBuyerDiscount = false;

  activeDiscounts: any[] = [];
  productDiscounts: Map<number, any> = new Map();
  productDetails: Map<number, ProductDTO> = new Map();

  constructor(
    
    private router: Router,
   
    private cartService: CartService,
    public imageService: ImageService
  ,
    private authService: AuthService,
    private addressService: AddressService,
    private fb: FormBuilder,
    private orderService: OrderService,
    private http: HttpClient, // Add HttpClient for preview API
    private discountService: DiscountService,
    private productService: ProductService
  ) {
    this.addressForm = this.fb.group({
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postalCode: ['', Validators.required],
      country: ['', Validators.required],
      latitude: [null, Validators.required],
      longitude: [null, Validators.required],
      addressType: ['SHIPPING', Validators.required]
    });
  }

  ngOnInit() {
    this.subscriptions.push(
      this.cartService.getCartItems().subscribe(items => {
        this.cartItems = items;
        this.loadProductDetails();
        this.updateOrderPreview();
      })
    );

    // Fetch delivery options dynamically
    this.orderService.getAllDeliveryMethod().subscribe(options => {
      this.deliveryOptions = options || [];
    });

    // Fetch addresses
    this.addressService.getAddresses().subscribe(addresses => {
      this.addresses = addresses || [];
      if (this.addresses.length > 0) {
        this.selectedAddressIndex = 0;
        this.setShippingFromSelected();
      }
    });

    const user = this.authService.getDecodedToken();
    if (user) {
      this.customer = {
        name: user.name || '',
        email: user.sub || '',
        phone: user.phoneNumber || user.phNumber || ''
      };
    }
    this.loadActiveDiscounts();
  }

  loadActiveDiscounts() {
    this.discountService.getActiveDiscount().subscribe({
      next: (discounts) => {
        this.activeDiscounts = discounts;
        this.calculateProductDiscounts();
      }
    });
  }

  loadProductDetails() {
    const productIds = this.cartItems.map(item => item.productId || item.id);
    if (productIds.length === 0) return;
    this.productService.getProductsByIds(productIds).subscribe(products => {
      products.forEach(product => {
        this.productDetails.set(product.id, product);
      });
      this.calculateProductDiscounts();
    });
  }

  calculateProductDiscounts() {
    this.productDiscounts.clear();
    this.cartItems.forEach(item => {
      const product = this.productDetails.get(item.productId || item.id);
      if (product) {
        const discount = this.findApplicableDiscount(product);
        if (discount) {
          this.productDiscounts.set(product.id, discount);
        }
      }
    });
  }

  findApplicableDiscount(product: ProductDTO): any {
    if (!this.activeDiscounts || this.activeDiscounts.length === 0) {
      return null;
    }
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
        return product.categoryBrandArray.some(pair => pair.brandId === rule.brandId);
      case 'CATEGORY':
        if (!product.categoryBrandArray) return false;
        return product.categoryBrandArray.some(pair => pair.categoryId === rule.categoryId);
      case 'BRAND_CATEGORY':
        if (!product.categoryBrandArray) return false;
        return product.categoryBrandArray.some(pair => pair.brandId === rule.brandId && pair.categoryId === rule.categoryId);
      default:
        return false;
    }
  }

  getProductDiscount(productId: number): any {
    if (this.isFirstTimeBuyerDiscount) return null;
    return this.productDiscounts.get(productId);
  }

  getDiscountedPrice(product: ProductDTO): number {
    if (this.isFirstTimeBuyerDiscount) return product.price;
    const discount = this.getProductDiscount(product.id);
    if (!discount) return product.price;
    if (discount.discountType === 'PERCENTAGE') {
      return product.price - (product.price * discount.discount_percent / 100);
    } else {
      return Math.max(0, product.price - discount.discount_amount);
    }
  }

  getDiscountDisplayText(discount: any): string {
    if (!discount) return '';
    if (discount.discountType === 'PERCENTAGE') {
      return `${discount.discount_percent}% OFF`;
    } else {
      return `Save ${discount.discount_amount} MMK`;
    }
  }

  updateOrderPreview() {
    const user = this.authService.getDecodedToken();
    if (!user || this.cartItems.length === 0) {
      this.orderPreview = null;
      this.isFirstTimeBuyerDiscount = false;
      return;
    }
    const userOrderDto: any = {
      userId: user.id,
      cartItem: this.cartItems.map(item => ({
        productId: item.productId || item.id,
        quantity: item.quantity,
        price: item.price
      }))
    };
    if (this.discountId) {
      userOrderDto.discountId = this.discountId;
    }
    this.http.post<any>('http://localhost:8080/order/preview', userOrderDto).subscribe({
      next: (preview) => {
        this.orderPreview = preview;
        this.isFirstTimeBuyerDiscount = preview.discountReason && preview.discountReason.toLowerCase().includes('first time buyer');
      },
      error: () => {
        this.orderPreview = null;
        this.isFirstTimeBuyerDiscount = false;
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Step navigation
  setActiveStep(step: number) {
    if (step === 1 || this.stepCompleted[step - 1]) {
      this.activeStep = step;
    }
  }

  nextStep(form?: any) {
    if (form && !form.valid) return;
    
    // Check if phone number is null/empty and update user details if needed
    if (this.activeStep === 1) {
      const user = this.authService.getDecodedToken();
      // Check if user has no phone number initially but now has entered one
      if (user && (!user.phoneNumber || user.phoneNumber.trim() === '') && this.customer.phone && this.customer.phone.trim() !== '') {
        const updateData = {
          id: user.id,
          name: user.name,
          email: user.sub,
          phoneNumber: this.customer.phone.trim(),
          dateOfBirth: user.dateOfBirth || user.dateofbirth || null,
          password: user.password || null,
          gender: user.gender || null,
          roles: user.roles ? user.roles.split(',') : []
        };
        
        this.authService.updateUserDetails(updateData).subscribe({
          next: (response) => {
            console.log('Phone number updated successfully:', response);
            // Update the token with new phone number
            if (response.token) {
              this.authService.saveToken(response.token);
            }
            this.proceedToNextStep();
          },
          error: (error) => {
            console.error('Failed to update phone number:', error);
            // Still proceed to next step even if update fails
            this.proceedToNextStep();
          }
        });
      } else {
        this.proceedToNextStep();
      }
    } else {
      this.proceedToNextStep();
    }
  }

  private proceedToNextStep() {
    this.stepCompleted[this.activeStep] = true;
    if (this.activeStep < 5) {
      this.activeStep++;
    }
    if (this.activeStep === 5) {
      this.orderNumber = Math.floor(100000 + Math.random() * 900000).toString();
    }
  }

  editStep(event: Event, step: number) {
    event.stopPropagation();
    this.activeStep = step;
  }

  resetCheckout() {
    this.activeStep = 1;
    this.stepCompleted = {};
    this.customer = { name: '', email: '', phone: '' };
    this.shipping = { address: '', city: '', state: '', postal: '', country: ''};
    this.delivery = { method: '' };
    this.payment = { method: '', cardNumber: '', expiry: '', cvv: '', paypalEmail: '' };
  }

  // Cart summary helpers
  getOriginalSubtotal() {
    let subtotal = 0;
    for (const item of this.cartItems) {
      subtotal += item.price * item.quantity;
    }
    return subtotal;
  }

  getTotalDiscount() {
    if (this.discount && this.discountId) {
      return this.orderPreview?.discountAmount || 0;
    }
    if (this.isFirstTimeBuyerDiscount && this.orderPreview?.discountAmount > 0) {
      return this.orderPreview.discountAmount;
    }
    let discount = 0;
    for (const item of this.cartItems) {
      const product = this.productDetails.get(item.productId || item.id);
      if (product) {
        const discounted = this.getDiscountedPrice(product);
        if (discounted < product.price) {
          discount += (product.price - discounted) * item.quantity;
        }
      }
    }
    return discount;
  }

  getSubtotal() {
    // Always return the sum of original prices
    let subtotal = 0;
    for (const item of this.cartItems) {
      const product = this.productDetails.get(item.productId || item.id);
      if (product) {
        subtotal += product.price * item.quantity;
      } else {
        subtotal += item.price * item.quantity;
      }
    }
    return subtotal;
  }
  getTotal() {
  if (this.orderPreview && typeof this.orderPreview.total === 'number') {
    return this.orderPreview.total;
  }
  return this.getSubtotal() - this.getTotalDiscount() + this.deliveryFee;
}
  // Quantity controls for cart review (if needed)
  decrementQty(item: any) {
    if (item.quantity > 1) item.quantity--;
  }
  incrementQty(item: any) {
    item.quantity++;
  }
  removeItem(index: number) {
    this.cartItems.splice(index, 1);
  }

  goToPayment(form: any) {
    if (!form.valid) return;

    if (this.couponCode && !this.isCouponValid) {
      alert('Please apply a valid coupon code first.');
      return;
    }
    
    this.stepCompleted[3] = true;
    
    // Get user ID from auth service
    const user = this.authService.getDecodedToken();
    const userId = user ? user.id : null;
    
    // Get selected address ID
    const selectedAddressId = this.selectedAddressIndex !== null && this.addresses[this.selectedAddressIndex] 
      ? this.addresses[this.selectedAddressIndex].id 
      : null;
    
    // Get delivery method ID
    const deliveryMethodId = this.deliveryId;
    
    // Get discount ID if coupon is applied
    const discountId = this.discount && this.isCouponValid ? this.discount.id : null;
    
    const productDiscountAmount = this.getTotalDiscount();
    this.router.navigate(['/checkout/payment'], {
      state: {
        customer: this.customer,
        shipping: this.shipping,
        delivery: this.delivery,
        cartItems: this.cartItems,
        userId: userId,
        addressId: selectedAddressId,
        deliveryMethodId: deliveryMethodId,
        discountId: discountId,
        discount: this.discount,
        discountAmount: this.discountAmount,
        deliveryFee: this.deliveryFee,
        productDiscountAmount: productDiscountAmount,
        orderPreview: this.orderPreview
      }
    });
  }

  setShippingFromSelected() {
    if (this.selectedAddressIndex !== null && this.addresses[this.selectedAddressIndex]) {
      const addr = this.addresses[this.selectedAddressIndex];
      this.shipping = {
        address: addr.address || '',
        city: addr.city || '',
        state: addr.state || '',
        postal: addr.postalCode|| '',
        country: addr.country || ''
      };
    }
  }

  onSelectAddress(index: number) {
    this.selectedAddressIndex = index;
    this.setShippingFromSelected();
  }

  // Modal methods
  openAddAddressModal(editMode = false) {
    this.showAddAddressModal = true;
    this.isEditMode = editMode;
    this.addressForm.reset({ addressType: 'SHIPPING' });
    setTimeout(() => this.initMap(), 100);
  }

  closeAddAddressModal() {
    this.showAddAddressModal = false;
    this.addressForm.reset();
    if (this.map) {
      this.map.remove();
      this.map = undefined;
      this.marker = undefined;
    }
  }

  submitAddressForm() {
    if (this.addressForm.valid) {
      const user = this.authService.getDecodedToken();
      const formValue = this.addressForm.value;
      const addressToAdd: Address = {
        address: formValue.address,
        city: formValue.city,
        state: formValue.state,
        postalCode: formValue.postalCode,
        country: formValue.country,
        latitude: formValue.latitude,
        longitude: formValue.longitude,
        type: formValue.addressType,
        userId: user && user.id ? user.id : 0
      };
      this.addressService.addAddress(addressToAdd).subscribe({
        next: () => {
          this.addressService.getAddresses().subscribe(addresses => {
            this.addresses = addresses || [];
            if (this.addresses.length > 0) {
              this.selectedAddressIndex = this.addresses.length - 1;
              this.setShippingFromSelected();
            }
          });
          this.closeAddAddressModal();
        },
        error: (error) => {
          alert('Failed to add address. Please try again.');
        }
      });
    } else {
      Object.keys(this.addressForm.controls).forEach(key => {
        const control = this.addressForm.get(key);
        control?.markAsTouched();
      });
      alert('Please fill in all required fields correctly.');
    }
  }

  // Map methods
  initMap() {
    if (this.map) {
      this.map.invalidateSize();
      return;
    }
    const defaultLat = 21.9162;
    const defaultLng = 95.9560;
    this.createMap(defaultLat, defaultLng);
  }

  createMap(lat: number, lng: number) {
    this.map = L.map('map').setView([lat, lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    });
    this.marker = L.marker([lat, lng], { draggable: true, icon: customIcon }).addTo(this.map);

    this.map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      this.latLngSource = 'manual';
      this.addressForm.patchValue({ latitude: lat, longitude: lng });
    });
    this.marker.on('dragend', () => {
      const { lat, lng } = this.marker!.getLatLng();
      this.latLngSource = 'manual';
      this.addressForm.patchValue({ latitude: lat, longitude: lng });
    });
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        if (this.map && this.marker) {
          this.map.setView([lat, lng], 15);
          this.marker.setLatLng([lat, lng]);
        }
        this.addressForm.patchValue({ latitude: lat, longitude: lng });
        this.reverseGeocode(lat, lng);
      });
    }
  }

  private trimAddressInput() {
    const val = this.addressForm.get('address')!.value;
    if (val && (val.match(/,/g) || []).length >= 3) {
      const parts = val.split(',').map((p: string) => p.trim());
      if (parts.length >= 4) {
        const trimmedAddress = parts.slice(0, 3).join(', ');
        this.addressForm.get('address')!.setValue(trimmedAddress, { emitEvent: false });
        if (!this.addressForm.get('city')!.value) this.addressForm.get('city')!.setValue(parts[3], { emitEvent: false });
        if (parts[4] && !this.addressForm.get('state')!.value) this.addressForm.get('state')!.setValue(parts[4], { emitEvent: false });
        if (parts[5] && !this.addressForm.get('postalCode')!.value) this.addressForm.get('postalCode')!.setValue(parts[5], { emitEvent: false });
        if (parts[6] && !this.addressForm.get('country')!.value) this.addressForm.get('country')!.setValue(parts[6], { emitEvent: false });
        console.log('Trimmed address input:', trimmedAddress);
      }
    }
  }

  reverseGeocode(lat: number, lng: number) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
      .then(response => response.json())
      .then(data => {
        const patch: any = {};
        if (data.display_name) patch.address = data.display_name;
        if (data.address) {
          patch.city = data.address.city || data.address.town || data.address.village || data.address.hamlet || data.address.suburb || data.address.county || '';
          patch.state = data.address.state || data.address.state_district || data.address.region || data.address.province || '';
          patch.postalCode = data.address.postcode || '';
          patch.country = data.address.country || '';
        }
        this.addressForm.patchValue(patch, { emitEvent: false });
        this.trimAddressInput();
      });
  }

  onAddressEnter() {
    const address = this.addressForm.get('address')!.value;
    const city = this.addressForm.get('city')!.value;
    const state = this.addressForm.get('state')!.value;
    const postalCode = this.addressForm.get('postalCode')!.value;
    const country = this.addressForm.get('country')!.value;
    const query = [address, city, state, postalCode, country].filter(Boolean).join(', ');
    this.forwardGeocode(query);
  }

  forwardGeocode(query: string) {
    fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&addressdetails=1`)
      .then(response => response.json())
      .then(results => {
        if (results && results.length > 0) {
          const result = results[0];
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);
          this.latLngSource = 'forward';
          this.addressForm.patchValue({ latitude: lat, longitude: lng });
          if (this.map && this.marker) {
            this.marker.setLatLng([lat, lng]);
            this.map.setView([lat, lng], 13);
          }
        }
      });
  }

  continueToDelivery() {
    if (this.selectedAddressIndex !== null) {
      this.stepCompleted[2] = true;
      this.nextStep();
    }
  }

  onDeliveryChange(option: any) {
    if (option) {
      this.delivery.method = option.name;
      this.deliveryFee = option.fee;
      this.deliveryId = option.id;
    } else {
      this.delivery.method = '';
      this.deliveryFee = 0;
      this.deliveryId = null;
    }
  }

  applyCoupon(): void {
    if (!this.couponCode) {
      this.discountMessage = 'Please enter a coupon code.';
      this.isCouponValid = false;
      this.discountAmount = 0;
      return;
    }

    if (this.couponCode === this.appliedCouponCode) {
      this.discountMessage = 'This coupon has already been applied.';
      this.isCouponValid = false;
      return;
    }

    const user = this.authService.getDecodedToken();
    const userId = user ? user.id : null;

    this.orderService.getDiscount(userId, this.couponCode).subscribe({
      next: (discount) => {
        this.discount = discount;
        this.discountId = discount.id;
        const today = new Date();
        const start = new Date(discount.startDate);
        const end = new Date(discount.endDate);
        const subtotal = this.getSubtotal();

        if (today >= start && today <= end && discount.canUse) {
          if (discount.discountType === 'PERCENTAGE') {
            this.discountAmount = subtotal * (discount.discountValue || 0);
          } else {
            this.discountAmount = discount.discountValue || 0;
          }

          this.appliedCouponCode = this.couponCode;
          this.isCouponValid = true;
          this.discountMessage = `✅ Coupon applied! You saved ${Math.round(this.discountAmount).toLocaleString()} MMK.`;
          this.updateOrderPreview(); // Refresh preview with coupon
        } else {
          this.discountAmount = 0;
          this.isCouponValid = false;
          this.discountMessage = '❌ This coupon is not valid or has expired.';
        }
      },
      error: (err) => {
        this.discountAmount = 0;
        this.isCouponValid = false;
      
        if (err.error === 'used') {
          this.discountMessage = '❌ This coupon has already been used.';
        } else if (err.status === 404) {
          this.discountMessage = '❌ Discount code not found.';
        } else {
          this.discountMessage = '❌ Invalid coupon code.';
        }
      }
    });
  }

  hasDiscountedProduct(): boolean {
    return this.cartItems.some(item => {
      const product = this.productDetails.get(item.productId || item.id);
      return product && this.getProductDiscount(product.id);
    });
  }
}
