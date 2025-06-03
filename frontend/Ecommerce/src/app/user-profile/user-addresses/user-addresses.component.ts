import { Component, AfterViewInit, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Address, AddressService } from '../../services/address.service';
import { AuthService } from '../../auth/auth.service';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-user-addresses',
  standalone: false,
  templateUrl: './user-addresses.component.html',
  styleUrl: './user-addresses.component.css'
})
export class UserAddressesComponent implements OnInit {
  addresses: Address[] = [];
  showAddModal = false;
  addressForm: FormGroup;
  map: L.Map | undefined;
  marker: L.Marker | undefined;
  private mapInitialized = false;
  latitude: number | null = null;
  longitude: number | null = null;
  private pendingLatLng: { lat: number, lng: number } | null = null;
  private geocodeTimeout: any = null;

  // Address form fields
  address: string = '';
  city: string = '';
  state: string = '';
  postalCode: string = '';
  country: string = '';
  addressType: string = '';

  constructor(
    private fb: FormBuilder,
    private addressService: AddressService,
    private authService: AuthService
  ) {
    this.addressForm = this.fb.group({
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postalCode: ['', Validators.required],
      country: ['', Validators.required],
      latitude: [null, Validators.required],
      longitude: [null, Validators.required]
    });
  }

  ngOnInit() {
    this.loadAddresses();

    combineLatest([
      this.addressForm.get('latitude')!.valueChanges,
      this.addressForm.get('longitude')!.valueChanges
    ]).subscribe(([lat, lng]) => {
      const latNum = Number(lat);
      const lngNum = Number(lng);
      if (
        this.map &&
        this.marker &&
        !isNaN(latNum) &&
        !isNaN(lngNum) &&
        latNum >= -90 && latNum <= 90 &&
        lngNum >= -180 && lngNum <= 180
      ) {
        this.marker.setLatLng([latNum, lngNum]);
        this.map.setView([latNum, lngNum], 13);
        this.debouncedReverseGeocode(latNum, lngNum);
      }
    });
  }

  loadAddresses() {
    this.addressService.getAddresses().subscribe({
      next: (addresses: Address[]) => {
        this.addresses = addresses;
      },
      error: (error: Error) => {
        console.error('Error loading addresses:', error);
      }
    });
  }

  openAddModal() {
    this.showAddModal = true;
    this.addressForm.patchValue({ latitude: null, longitude: null });
    setTimeout(() => this.initMap(), 0);
  }

  closeAddModal() {
    this.showAddModal = false;
    this.map = undefined;
    this.marker = undefined;
    this.addressForm.reset({
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      latitude: null,
      longitude: null,
      addressType: ''
    });
  }

  ngAfterViewInit() {
    // Map is initialized when modal opens
  }

  initMap() {
    if (this.map) {
      this.map.invalidateSize();
      return;
    }
    // Use a default location for the map center, but do NOT set latitude/longitude in the form
    const defaultLat = 21.9162;
    const defaultLng = 95.9560;
    this.createMap(defaultLat, defaultLng);
    // Do NOT call reverseGeocode or set lat/lng in the form here!
  }

  createMap(lat: number, lng: number) {
    this.map = L.map('map').setView([lat, lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);

    this.map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      this.addressForm.patchValue({ latitude: lat, longitude: lng });
    });
    this.marker.on('dragend', () => {
      const { lat, lng } = this.marker!.getLatLng();
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
        this.latitude = lat;
        this.longitude = lng;
        this.addressForm.patchValue({ latitude: lat, longitude: lng });
        this.reverseGeocode(lat, lng);
      });
    }
  }

  isValidLatLng(lat: any, lng: any): boolean {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    );
  }

  debouncedReverseGeocode(lat: number, lng: number) {
    if (this.geocodeTimeout) clearTimeout(this.geocodeTimeout);
    this.geocodeTimeout = setTimeout(() => {
      this.reverseGeocode(lat, lng);
    }, 300);
  }

  reverseGeocode(lat: number, lng: number) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
      .then(response => response.json())
      .then(data => {
        console.log('Nominatim data:', data);
        const patch: any = {};
        if (data.display_name) patch.address = data.display_name;
        if (data.address) {
          patch.city =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.hamlet ||
            data.address.suburb ||
            data.address.county ||
            '';
          patch.state =
            data.address.state ||
            data.address.state_district ||
            data.address.region ||
            data.address.province ||
            '';
          patch.postalCode = data.address.postcode || '';
          patch.country = data.address.country || '';
        }
        this.addressForm.patchValue(patch, { emitEvent: false });
      });
  }

  submitAddress() {
    const newAddress = {
      address: this.address,
      city: this.city,
      state: this.state,
      postalCode: this.postalCode,
      country: this.country,
      addressType: this.addressType,
      latitude: this.latitude,
      longitude: this.longitude
    };
    console.log('Submitting address:', newAddress);
    this.closeAddModal();
  }

  useMyLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          this.addressForm.patchValue({ latitude: lat, longitude: lng });
          this.debouncedReverseGeocode(lat, lng);
        },
        (error) => {
          alert('Unable to retrieve your location.');
        }
      );
    }
  }
}
