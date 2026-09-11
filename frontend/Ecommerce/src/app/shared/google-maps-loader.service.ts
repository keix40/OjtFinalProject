import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  private loading?: Promise<void>;

  load(): Promise<void> {
    if (this.loading) {
      return this.loading;
    }
    const key = environment.googleMapsApiKey;
    if (!key) {
      return Promise.resolve();
    }
    if (typeof document !== 'undefined' && document.querySelector('script[data-google-maps]')) {
      return Promise.resolve();
    }
    this.loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`;
      script.async = true;
      script.defer = true;
      script.dataset['googleMaps'] = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps'));
      document.head.appendChild(script);
    });
    return this.loading;
  }
}
