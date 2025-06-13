import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {

  baseUrl = 'http://localhost:8080/wishlist';

  constructor(private http: HttpClient) {}

  saveWishlist(userId: number, productId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/save/${userId}/${productId}`, null, { responseType: 'text' } );
  }  

  removeWishlist(userId: number, productId: number){
    return this.http.put(`${this.baseUrl}/remove/${userId}/${productId}`, null, { responseType: 'text' } );  
  }

  getWishlist(userId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/wishlistbyuserid/${userId}`);
  }

}
