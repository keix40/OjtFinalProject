export interface ReviewMessage {
  id?: number;
  productId: number;
  username: string;
  comment: string;
  rating: number;
  timestamp?: string;
  action?: string;
  userImage?: string;

  imageUrls?: string[]; // add this line
  videoUrls?: string[]; 
}
