import { Component, AfterViewInit, OnInit, OnDestroy, AfterViewChecked } from '@angular/core';
import * as L from 'leaflet';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Address, AddressService } from '../../services/address.service';
import { AuthService } from '../../auth/auth.service';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-user-addresses',
  standalone: false,
  templateUrl: './user-addresses.component.html',
  styleUrl: './user-addresses.component.css'
})
export class UserAddressesComponent implements OnInit, OnDestroy, AfterViewChecked {
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
  private destroy$ = new Subject<void>();
  private addressMaps: { [id: number]: L.Map } = {};
  private renderedAddressIds: Set<number> = new Set();
  globalMapType: 'default' | 'satellite' | 'terrain' = 'default';
  tileLayers: { [id: number]: L.TileLayer } = {};
  isEditMode = false;
  editingAddressId: number | null = null;
  private formSubscriptions: any[] = [];

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

    // Address input parsing for Myanmar format
    this.formSubscriptions.push(
      this.addressForm.get('address')!.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.trimAddressInput();
        })
    );

    this.formSubscriptions.push(
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
            return;
          }
          this.debouncedReverseGeocode(latNum, lngNum);
        }
      })
    );

    this.formSubscriptions.push(
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
            this.forwardGeocode(query);
          }
        }
      })
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.unsubscribeFormSubscriptions();
  }

  private unsubscribeFormSubscriptions() {
    this.formSubscriptions.forEach(sub => sub.unsubscribe());
    this.formSubscriptions = [];
  }

  ngAfterViewChecked() {
    // Initialize maps for each address if not already done
    this.addresses.forEach(address => {
      if (address.id && !this.renderedAddressIds.has(address.id) && address.latitude && address.longitude) {
        const mapId = 'map-' + address.id;
        const mapContainer = document.getElementById(mapId);
        if (mapContainer && !this.addressMaps[address.id]) {
          const map = L.map(mapId, {
            center: [address.latitude, address.longitude],
            zoom: 15,
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false
          });
          // Use global map type
          let tileLayer: L.TileLayer = this.getTileLayer(this.globalMapType);
          tileLayer.addTo(map);
          this.tileLayers[address.id] = tileLayer;
          L.marker([address.latitude, address.longitude]).addTo(map);
          this.addressMaps[address.id] = map;
          this.renderedAddressIds.add(address.id);
        }
      }
    });
  }

  loadAddresses() {
    const userId = this.authService.getUserId();
    if (!userId) {
      console.error('No user ID available');
      return;
    }

    this.addressService.getAddresses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (addresses: Address[]) => {
          console.log('Addresses loaded:', addresses);
          this.addresses = addresses;
          this.renderedAddressIds.clear(); // Reset so maps can be re-initialized
        },
        error: (error: any) => {
          console.error('Error loading addresses:', error);
          // You might want to show a user-friendly error message here
        }
      });
  }

  openAddModal() {
    this.showAddModal = true;
    this.isEditMode = false;
    this.editingAddressId = null;
    // Clear any existing timeouts
    if (this.geocodeTimeout) {
      clearTimeout(this.geocodeTimeout);
      this.geocodeTimeout = null;
    }
    if (this.forwardGeocodeTimeout) {
      clearTimeout(this.forwardGeocodeTimeout);
      this.forwardGeocodeTimeout = null;
    }
    this.addressForm.patchValue({ latitude: null, longitude: null });
    setTimeout(() => this.initMap(), 0);
  }

  closeAddModal() {
    console.log('closeAddModal called');
    // Clear any pending geocoding timeouts
    if (this.geocodeTimeout) {
      clearTimeout(this.geocodeTimeout);
      this.geocodeTimeout = null;
    }
    if (this.forwardGeocodeTimeout) {
      clearTimeout(this.forwardGeocodeTimeout);
      this.forwardGeocodeTimeout = null;
    }
    
    // Unsubscribe from form subscriptions
    this.unsubscribeFormSubscriptions();
    
    this.showAddModal = false;
    this.isEditMode = false;
    this.editingAddressId = null;
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
    window.location.reload();
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
        this.trimAddressInput();
      });
  }

  submitAddress() {
    if (this.addressForm.valid) {
      const formValue = this.addressForm.value;
      const newAddress = {
        address: formValue.address,
        city: formValue.city,
        state: formValue.state,
        postalCode: formValue.postalCode,
        country: formValue.country,
        latitude: formValue.latitude,
        longitude: formValue.longitude,
        type: formValue.addressType,
        userId: this.authService.getUserId()
      };

      this.addressService.addAddress(newAddress as Address).subscribe({
        next: (response) => {
          // Auto reload the page after successful address creation
          window.location.reload();
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
              this.trimAddressInput();
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
    this.trimAddressInput();
    // Optionally, trigger geocoding here if you want
    // For example:
    const address = this.addressForm.get('address')!.value;
    const city = this.addressForm.get('city')!.value;
    const state = this.addressForm.get('state')!.value;
    const postalCode = this.addressForm.get('postalCode')!.value;
    const country = this.addressForm.get('country')!.value;
    const query = [address, city, state, postalCode, country].filter(Boolean).join(', ');
    if (query) {
      this.forwardGeocode(query);
    }
  }

  reloadPage() {
    window.location.reload();
  }

  setGlobalMapType(type: 'default' | 'satellite' | 'terrain') {
    this.globalMapType = type;
    // Update all maps
    Object.keys(this.addressMaps).forEach(idStr => {
      const id = Number(idStr);
      const map = this.addressMaps[id];
      if (map) {
        // Remove old tile layer
        if (this.tileLayers[id]) {
          map.removeLayer(this.tileLayers[id]);
        }
        // Add new tile layer
        const tileLayer = this.getTileLayer(type);
        tileLayer.addTo(map);
        this.tileLayers[id] = tileLayer;
      }
    });
  }

  getTileLayer(type: 'default' | 'satellite' | 'terrain'): L.TileLayer {
    if (type === 'satellite') {
      return L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri'
      });
    } else if (type === 'terrain') {
      return L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenTopoMap contributors'
      });
    } else {
      return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      });
    }
  }

  editAddress(address: Address) {
    this.isEditMode = true;
    this.editingAddressId = address.id!;
    this.showAddModal = true;
    this.addressForm.patchValue({
      address: address.address,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      latitude: address.latitude,
      longitude: address.longitude,
      addressType: address.type
    });
    setTimeout(() => this.initMap(), 0);
  }
}
