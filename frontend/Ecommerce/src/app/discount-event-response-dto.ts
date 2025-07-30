export interface DiscountEventResponseDTO {  
  id?: number;
  event_name: string;
  description?: string;
  discount_percent: number;
  startDate: string;
  endDate: string;
  status: boolean;
  affectedProductIds?: number[]; 
}
