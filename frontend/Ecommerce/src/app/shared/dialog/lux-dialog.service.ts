import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertResult } from 'sweetalert2';

export interface LuxConfirmOptions {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

/**
 * Single themed dialog channel (blueprint §1.4 / §2.6).
 * Replaces ad-hoc Swal.fire({ confirmButtonColor: '#3085d6' }) call sites.
 */
@Injectable({ providedIn: 'root' })
export class LuxDialogService {
  private readonly base = {
    buttonsStyling: true,
    customClass: {
      popup: 'lux-swal-popup',
      title: 'lux-swal-title',
      confirmButton: 'lux-btn lux-btn--primary',
      cancelButton: 'lux-btn lux-btn--secondary',
      denyButton: 'lux-btn lux-btn--ghost',
    },
    confirmButtonColor: '#1C1B19',
    cancelButtonColor: 'transparent',
  };

  success(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      ...this.base,
      icon: 'success' as SweetAlertIcon,
      title,
      text,
      confirmButtonColor: '#1C1B19',
    });
  }

  error(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      ...this.base,
      icon: 'error' as SweetAlertIcon,
      title,
      text,
      confirmButtonColor: '#1C1B19',
    });
  }

  info(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      ...this.base,
      icon: 'info' as SweetAlertIcon,
      title,
      text,
      confirmButtonColor: '#1C1B19',
    });
  }

  toast(title: string, icon: SweetAlertIcon = 'success'): void {
    Swal.fire({
      toast: true,
      position: 'bottom-end',
      icon,
      title,
      showConfirmButton: false,
      timer: 2800,
      timerProgressBar: true,
      background: '#FBF9F4',
      color: '#1C1B19',
    });
  }

  warning(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      ...this.base,
      icon: 'warning' as SweetAlertIcon,
      title,
      text,
      confirmButtonColor: '#1C1B19',
    });
  }

  /** Escape hatch for complex Swal flows while keeping luxury chrome. */
  fire(options: Record<string, unknown>): Promise<SweetAlertResult> {
    return Swal.fire({
      ...this.base,
      ...options,
      customClass: {
        ...this.base.customClass,
        ...((options['customClass'] as object) || {}),
      },
    } as any);
  }

  confirm(options: LuxConfirmOptions): Promise<boolean> {
    return Swal.fire({
      ...this.base,
      icon: options.destructive ? 'warning' : 'question',
      title: options.title,
      text: options.text,
      showCancelButton: true,
      confirmButtonText: options.confirmText ?? 'Confirm',
      cancelButtonText: options.cancelText ?? 'Cancel',
      confirmButtonColor: options.destructive ? '#9E4A43' : '#1C1B19',
      reverseButtons: true,
    }).then((result) => !!result.isConfirmed);
  }
}
