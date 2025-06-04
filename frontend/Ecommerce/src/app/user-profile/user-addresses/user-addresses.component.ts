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
  private geocodeTimeout: any = null;
  private forwardGeocodeTimeout: any = null;
  private skipReverseGeocode = false;
  private latLngSource: 'manual' | 'forward' | 'location' | null = null;

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
      longitude: [null, Validators.required],
      addressType: ['']
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
        if (this.latLngSource === 'forward' || this.latLngSource === 'location') {
          this.latLngSource = null;
          return; // Do NOT call reverse geocode
        }
        this.debouncedReverseGeocode(latNum, lngNum);
      }
    });

    combineLatest([
      this.addressForm.get('address')!.valueChanges,
      this.addressForm.get('city')!.valueChanges,
      this.addressForm.get('state')!.valueChanges,
      this.addressForm.get('postalCode')!.valueChanges,
      this.addressForm.get('country')!.valueChanges
    ]).subscribe(([address, city, state, postalCode, country]) => {
      if (address || city || state || postalCode || country) {
        const query = [address, city, state, postalCode, country].filter(Boolean).join(', ');
        if (query) {
          if (this.forwardGeocodeTimeout) clearTimeout(this.forwardGeocodeTimeout);
          this.forwardGeocodeTimeout = setTimeout(() => {
            this.forwardGeocode(query);
          }, 500);
        }
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

  ngAfterViewInit() {}

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
        const patch: any = {};
        if (data.display_name) patch.address = data.display_name;
        if (data.address) {
          patch.city = data.address.city || data.address.town || data.address.village || data.address.hamlet || data.address.suburb || data.address.county || '';
          patch.state = data.address.state || data.address.state_district || data.address.region || data.address.province || '';
          patch.postalCode = data.address.postcode || '';
          patch.country = data.address.country || '';
        }
        this.addressForm.patchValue(patch, { emitEvent: false });
      });
  }

  submitAddress() {
    const formValue = this.addressForm.value;
    const newAddress = {
      address: formValue.address,
      city: formValue.city,
      state: formValue.state,
      postalCode: formValue.postalCode,
      country: formValue.country,
      addressType: formValue.addressType,
      latitude: formValue.latitude,
      longitude: formValue.longitude
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
          if (this.map && this.marker) {
            this.marker.setLatLng([lat, lng]);
            this.map.setView([lat, lng], 13);
          }
          this.latLngSource = 'location';
          this.addressForm.patchValue({ latitude: lat, longitude: lng });
          fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`)
            .then(response => response.json())
            .then(data => {
              const patch: any = {
                latitude: lat,
                longitude: lng,
                address: data.display_name || '',
                city: data.address?.city || data.address?.town || data.address?.village || data.address?.hamlet || data.address?.suburb || data.address?.county || '',
                state: data.address?.state || data.address?.state_district || data.address?.region || data.address?.province || '',
                postalCode: data.address?.postcode || '',
                country: data.address?.country || ''
              };
              this.addressForm.patchValue(patch);
            })
            .catch(error => {
              alert('Could not reach the geocoding service. Please check your internet connection or try again later.');
              console.error('Reverse geocoding error:', error);
            });
        },
        (error: GeolocationPositionError) => {
          alert('Unable to retrieve your location.');
        }
      );
    }
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
      })
      .catch(error => {
        alert('Could not reach the geocoding service. Please check your internet connection or try again later.');
        console.error('Geocoding error:', error);
      });
  }
}
