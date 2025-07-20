import { Component, OnInit } from '@angular/core';
import { DeliveryServiceService, DeliveryService } from '../services/delivery-service-service.service';
import Swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AddressService, Address } from '../services/address.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-delivery-service-list',
  standalone: false,
  templateUrl: './delivery-service-list.component.html',
  styleUrl: './delivery-service-list.component.css'
})
export class DeliveryServiceListComponent implements OnInit {
  deliveryServices: DeliveryService[] = [];
  filteredServices: DeliveryService[] = [];
  loading = false;
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  showUpdateModal = false;
  selectedServiceId: number | null = null;
  updateForm: FormGroup;
  updateAddressForm: FormGroup;
  updateMap: L.Map | undefined;
  updateMarker: L.Marker | undefined;
  updateService: DeliveryService | null = null;
  updateLoading = false;
  updateAddressLoading = false;

  ngOnInit(): void {
    this.loadDeliveryServices();
  }

  constructor(
    private deliveryServiceService: DeliveryServiceService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private addressService: AddressService
  ) {
    this.updateForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      feePerKm: [0, [Validators.required, Validators.min(0)]],
    });
    this.updateAddressForm = this.fb.group({
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      postalCode: ['', Validators.required],
      country: ['', Validators.required],
      latitude: [null, Validators.required],
      longitude: [null, Validators.required],
      type: ['SHIPPING', Validators.required],
    });
  }

  loadDeliveryServices(): void {
    this.loading = true;
    this.deliveryServiceService.getAll().subscribe({
      next: (data) => {
        this.deliveryServices = data;
        this.filteredServices = [...data];
        this.totalItems = data.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredServices = [...this.deliveryServices];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredServices = this.deliveryServices.filter(service =>
        service.name.toLowerCase().includes(searchLower) ||
        service.baseAddress.address.toLowerCase().includes(searchLower) ||
        service.baseAddress.city.toLowerCase().includes(searchLower)
      );
    }
    this.totalItems = this.filteredServices.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.currentPage = 1;
  }

  get paginatedServices(): DeliveryService[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredServices.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get Math() {
    return Math;
  }

  deleteDeliveryService(service: DeliveryService): void {
    Swal.fire({
      title: 'Delete Delivery Service',
      text: `Are you sure you want to delete "${service.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed && service.id) {
        this.deliveryServiceService.softDelete(service.id).subscribe({
          next: () => {
            this.loadDeliveryServices();
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Delivery service has been deleted successfully.',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to delete delivery service. Please try again.',
              confirmButtonColor: '#3085d6'
            });
          }
        });
      }
    });
  }

  openEditModal(serviceId: number): void {
    console.log("Id : " + serviceId);
    this.selectedServiceId = serviceId;
    this.showUpdateModal = true;
    this.updateLoading = true;
    this.deliveryServiceService.getById(serviceId).subscribe({
      next: (service) => {
        this.updateService = service;
        this.updateForm.patchValue({
          name: service.name,
          feePerKm: service.feePerKm
        });
        this.updateAddressForm.patchValue({
          address: service.baseAddress.address,
          city: service.baseAddress.city,
          state: service.baseAddress.state,
          postalCode: service.baseAddress.postalCode,
          country: service.baseAddress.country,
          latitude: service.baseAddress.latitude,
          longitude: service.baseAddress.longitude,
          type: service.baseAddress.type || 'SHIPPING',
        });
        setTimeout(() => this.initUpdateMap(), 200);
        this.updateLoading = false;
      },
      error: () => {
        this.updateLoading = false;
      }
    });
  }

  closeUpdateModal(): void {
    this.showUpdateModal = false;
    this.selectedServiceId = null;
    this.updateService = null;
    if (this.updateMap) {
      this.updateMap.remove();
      this.updateMap = undefined;
      this.updateMarker = undefined;
    }
  }

  initUpdateMap() {
    // Always remove the old map if it exists
    if (this.updateMap) {
      this.updateMap.remove();
      this.updateMap = undefined;
      this.updateMarker = undefined;
    }
    const lat = this.updateAddressForm.value.latitude || 21.9162;
    const lng = this.updateAddressForm.value.longitude || 95.9560;
    this.updateMap = L.map('update-map').setView([lat, lng], 13);
    // Use CartoDB's free tile server for better reliability
    const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    tileLayer.on('tileerror', function() {
      alert('Map tiles could not be loaded. Please check your internet connection or try again later.');
    });
    tileLayer.addTo(this.updateMap);
    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    });
    this.updateMarker = L.marker([lat, lng], { draggable: true, icon: customIcon }).addTo(this.updateMap);
    this.updateMap.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      this.updateAddressForm.patchValue({ latitude: lat, longitude: lng });
      if (this.updateMarker) {
        this.updateMarker.setLatLng([lat, lng]);
      }
      this.reverseGeocodeAndSetUpdateAddress(lat, lng);
    });
    this.updateMarker.on('dragend', () => {
      const { lat, lng } = this.updateMarker!.getLatLng();
      this.updateAddressForm.patchValue({ latitude: lat, longitude: lng });
      this.reverseGeocodeAndSetUpdateAddress(lat, lng);
    });
    // Fix: Invalidate map size after modal is visible to show tiles
    setTimeout(() => {
      this.updateMap?.invalidateSize();
    }, 300);
  }

  reverseGeocodeAndSetUpdateAddress(lat: number, lng: number) {
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
        this.updateAddressForm.patchValue(patch, { emitEvent: false });
      });
  }

  submitUpdate() {
    if (!this.updateService || !this.selectedServiceId) return;
    this.updateLoading = true;
    // Update address first
    const addressPayload: Address = {
      ...this.updateAddressForm.value,
      id: this.updateService.baseAddress.id,
      userId: this.updateService.baseAddress.userId || null
    };
    console.log('Address payload:', addressPayload);
    this.addressService.updateAddress(addressPayload.id!, addressPayload).subscribe({
      next: (updatedAddress) => {
        // Now update delivery service
        const deliveryPayload: DeliveryService = {
          id: this.selectedServiceId!,
          name: this.updateForm.value.name,
          feePerKm: this.updateForm.value.feePerKm,
          baseAddress: { ...updatedAddress }
        };
        this.deliveryServiceService.update(this.selectedServiceId!, deliveryPayload).subscribe({
          next: () => {
            this.updateLoading = false;
            this.closeUpdateModal();
            this.loadDeliveryServices();
            Swal.fire({
              icon: 'success',
              title: 'Updated!',
              text: 'Delivery service updated successfully.',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: () => {
            this.updateLoading = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to update delivery service.',
              confirmButtonColor: '#3085d6'
            });
          }
        });
      },
      error: () => {
        this.updateLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update address.',
          confirmButtonColor: '#3085d6'
        });
      }
    });
  }
}
