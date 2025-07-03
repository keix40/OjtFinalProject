export interface Review {
    id?: number;
    productId: number;
    username: string;
    rating: number;
    comment: string;
    createdAt?: string;
}
