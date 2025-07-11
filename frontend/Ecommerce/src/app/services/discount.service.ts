import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DiscountEventDTO {
  name: string;
  description?: string;
  discountType: string; // "PERCENTAGE" | "FIXED" | "BOGO" | "BOGO_PERCENTAGE" | "QUANTITY_DISCOUNT" | "BULK_DISCOUNT"
  discount_percent: number;
  discount_amount: number;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  status: boolean;
  isEvent: boolean; // Whether this is an event discount or normal discount
  targetType: string; // "BRAND", "CATEGORY", "PRODUCT", "BRAND_CATEGORY"
  targetId?: number;
  productIds?: string; // comma-separated product IDs
  brandId?: number;
  categoryId?: number;
  brandCategoryId?: string; // for single brand-category selection
  brandIds?: string; // comma-separated brand IDs for multi-selection
  categoryIds?: string; // comma-separated category IDs for multi-selection
  brandCategoryIds?: string; // comma-separated brand-category IDs for multi-selection
  // New fields for promotional discounts
  bogoPercentage?: number; // For BOGO_PERCENTAGE type
  buyQuantity?: number; // For QUANTITY_DISCOUNT type
  getQuantity?: number; // For QUANTITY_DISCOUNT type
  discountPercentage?: number; // For QUANTITY_DISCOUNT type
  minQuantity?: number; // For BULK_DISCOUNT type
  bulkDiscountPercentage?: number; // For BULK_DISCOUNT type
}

export interface DiscountEventResponseDTO {
  id: number;
  name: string;
  description?: string;
  discount_percent: number;
  startDate: string;
  endDate: string;
  status: boolean;
  affectedProductIds?: number[];
  discounts?: DiscountDTO[];
}

export interface DiscountDTO {
  id: number;
  name: string;
  description?: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  status: boolean;
  autoApply?: boolean; // true = discount event, false = coupon
}

// Add new interface for duplicate checking
export interface DiscountConflictDTO {
  targetType: string;
  targetId: number;
  targetName: string;
  existingDiscountName: string;
  existingDiscountId: number;
}

const API_URL = `${environment.apiUrl}/discounts`;

@Injectable({
  providedIn: 'root'
})
export class DiscountService {
  constructor(private http: HttpClient) {}

  getAllDiscount(): Observable<DiscountDTO[]> {
    return this.http.get<DiscountDTO[]>(API_URL);
  }

  getActiveDiscount(): Observable<DiscountEventResponseDTO[]> {
    return this.http.get<DiscountEventResponseDTO[]>(`${API_URL}/active`);
  }

  getDiscountById(id: number): Observable<DiscountEventResponseDTO> {
    return this.http.get<DiscountEventResponseDTO>(`${API_URL}/${id}`);
  }

  createDiscount(event: DiscountEventDTO): Observable<DiscountEventResponseDTO> {
    return this.http.post<DiscountEventResponseDTO>(`${API_URL}/create`, event);
  }

  updateDiscount(id: number, event: DiscountEventDTO): Observable<any> {
    return this.http.put<any>(`${API_URL}/${id}`, event);
  }

  deleteDiscount(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }

  // New method to check for duplicate discounts
  checkDuplicateDiscount(event: DiscountEventDTO): Observable<DiscountConflictDTO[]> {
    return this.http.post<DiscountConflictDTO[]>(`${API_URL}/check-duplicate`, event);
  }

  createDiscountWithResolution(dto: DiscountEventDTO, conflictResolutions: any): Observable<any> {
    return this.http.post(`${API_URL}/create-with-resolution`, {
      ...dto,
      conflictResolutions: Array.from(conflictResolutions.entries())
    });
  }

  // Optionally, add methods for brands, categories, products if needed
} 