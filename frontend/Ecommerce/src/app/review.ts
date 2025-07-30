export interface Review {
    id?: number;
    productId: number;
    username: string;
    rating: number;
    comment: string;
    createdAt?: string;
}

export interface ReviewDTO {
    id: number;
    comment: string;
    rating: number;
    timestamp: string;
    userName: string;
    userImage: string;
    productName: string;
    mediaList: ReviewMediaDTO[];
  }
  
  export interface ReviewMediaDTO {
    id: number;
    type: string;
    url: string;
  }
  