import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DeliveryServiceService, DeliveryService } from '../services/delivery-service-service.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from '../services/notification.service';
import { AddressService } from '../services/address.service';
import * as L from 'leaflet';
import { Address as ServiceAddress } from '../services/address.service';
import { AuthService } from '../auth/auth.service';
import Swal from 'sweetalert2';

interface Address extends Omit<ServiceAddress, 'userId'> {
  userId?: number;
}

@Component({
  selector: 'app-create-delivery-service',
  standalone: false,
  templateUrl: './create-delivery-service.component.html',
  styleUrl: './create-delivery-service.component.css'
})
export class CreateDeliveryServiceComponent {
  deliveryServiceForm: FormGroup;
  isSubmitting = false;
  
  addresses: any[] = [];
  selectedAddressIndex: number | null = null;
  deliveryServiceId: number | null = null;
  addressId: number | null = null;

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

  // Add a getter for selectedAddress
  get selectedAddress(): Address | null {
    if (this.selectedAddressIndex !== null && this.addresses[this.selectedAddressIndex]) {
      return this.addresses[this.selectedAddressIndex];
    }
    return null;
  }

  // Add setShippingFromSelected method
  setShippingFromSelected() {
    if (this.selectedAddressIndex !== null && this.addresses[this.selectedAddressIndex]) {
      const addr = this.addresses[this.selectedAddressIndex];
      // Set the baseAddress form control to the selected address
      this.deliveryServiceForm.patchValue({ baseAddress: addr });
    }
  }

  constructor(
    private fb: FormBuilder,
    private deliveryServiceService: DeliveryServiceService,
    private notification: NotificationService,
    private addressService: AddressService,
    private authService: AuthService,
    private modalService: NgbModal
  ) {
    this.deliveryServiceForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      feePerKm: [0, [Validators.required, Validators.min(0)]],
      baseAddress: [null, Validators.required]
    });
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

  // Remove or comment out any code that opens the address modal automatically
  // ngOnInit() {
  //   if (!this.selectedAddress) {
  //     this.openAddAddressModal();
  //   }
  // }

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
      const formValue = this.addressForm.value;
      const addressToAdd = {
        address: formValue.address,
        city: formValue.city,
        state: formValue.state,
        postalCode: formValue.postalCode,
        country: formValue.country,
        latitude: formValue.latitude,
        longitude: formValue.longitude,
        type: formValue.addressType,
        userId: null
      };
      this.addressService.addAddress(addressToAdd as any).subscribe({
        next: (res: any) => {
          // Try to extract addressId from response (if backend returns it)
          let newAddressId: number | null = null;
          if (res && typeof res === 'object' && res.id) {
            newAddressId = res.id;
          } else if (typeof res === 'string') {
            // Try to parse id from string if possible
            const match = res.match(/id\s*[:=]\s*(\d+)/i);
            if (match) newAddressId = +match[1];
          }
          this.addressService.getAddresses().subscribe(addresses => {
            this.addresses = addresses || [];
            if (this.addresses.length > 0) {
              this.selectedAddressIndex = this.addresses.length - 1;
              this.setShippingFromSelected();
              // Use the last address as the new one if id not found
              if (!newAddressId) {
                newAddressId = this.addresses[this.selectedAddressIndex]?.id;
              }
              this.addressId = newAddressId;
            }
          });
          this.closeAddAddressModal();
        },
        error: (error) => {
          this.notification.showError('Failed to add address. Please try again.');
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
      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
      }
      this.reverseGeocodeAndSetAddress(lat, lng);
    });
    this.marker.on('dragend', () => {
      const { lat, lng } = this.marker!.getLatLng();
      this.latLngSource = 'manual';
      this.addressForm.patchValue({ latitude: lat, longitude: lng });
      this.reverseGeocodeAndSetAddress(lat, lng);
    });
  }

  // New helper: reverse geocode and set address field
  reverseGeocodeAndSetAddress(lat: number, lng: number) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
      .then(response => response.json())
      .then(data => {
        const patch: any = {};
        if (data.display_name) patch.address = data.display_name;
        if (data.address) {
          patch.city = data.address.city || data.address.town || data.address.village || data.address.hamlet || data.address.suburb || data.address.county || '';
          patch.state = data.address.state || data.address.state_district || data.address.region || data.address.province || '';
          patch.postalCode = data.address.postcode || data.address.postal_code || '';
          patch.country = data.address.country || '';
        }
        this.addressForm.patchValue(patch, { emitEvent: false });
        this.trimAddressInput();
      });
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          if (this.map && this.marker) {
            this.map.setView([lat, lng], 15);
            this.marker.setLatLng([lat, lng]);
          } else {
            this.createMap(lat, lng);
          }
          this.addressForm.patchValue({ latitude: lat, longitude: lng });
          this.reverseGeocodeAndSetAddress(lat, lng);
        },
        (error) => {
          alert('Unable to retrieve your location. Please allow location access or try again.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
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

  submit() {
    if (this.deliveryServiceForm.invalid || !this.addressId) {
      alert('Please add an address first.');
      return;
    }
    this.isSubmitting = true;
    // Get the full address object for baseAddress
    const baseAddress = this.selectedAddressIndex !== null && this.addresses[this.selectedAddressIndex]
      ? this.addresses[this.selectedAddressIndex]
      : null;
    if (!baseAddress) {
      alert('Base address not found.');
      this.isSubmitting = false;
      return;
    }
    const payload: DeliveryService = {
      name: this.deliveryServiceForm.value.name,
      feePerKm: this.deliveryServiceForm.value.feePerKm,
      baseAddress: {
        id: baseAddress.id,
        address: baseAddress.address,
        city: baseAddress.city,
        state: baseAddress.state,
        postalCode: baseAddress.postalCode,
        country: baseAddress.country,
        latitude: baseAddress.latitude,
        longitude: baseAddress.longitude,
        type: baseAddress.type || 'SHIPPING',
        userId: baseAddress.userId || null
      }
    };
    this.deliveryServiceService.create(payload).subscribe({
      next: (created: DeliveryService) => {
        this.deliveryServiceForm.reset();
        this.isSubmitting = false;
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Delivery service created successfully!'
        });
      },
      error: (err) => {
        this.notification.showError('Failed to create delivery service.');
        this.isSubmitting = false;
      }
    });
  }
}
