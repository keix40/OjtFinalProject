export interface EventDTO {
    id?: number;                        
    name: string;                        
    description: string;              
    slideNo: number;                  
    startDate: string;                 
    endDate: string;                   
    isDefault?: number;                
    status?: number;                    
    discountId?: number | null;      
    productIds?: number[] | null;            
    eventImage?: string;     
  }
  