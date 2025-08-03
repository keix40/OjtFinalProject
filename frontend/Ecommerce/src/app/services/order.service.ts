import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserOrder, UserOrderListDTO } from '../user-order';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  baseUrl = 'http://localhost:8080/order';

  constructor(private http: HttpClient) {}

  getAllDeliveryMethod(): Observable<any[]>{
    return this.http.get<any[]>(`${this.baseUrl}/getdelimethod`);
  }

  getDiscount(userId: number, code: string): Observable<any>{
    return this.http.get<any>(`${this.baseUrl}/getdiscount/${userId}/${code}`);
  }
  
  createOrder(userOrder: UserOrder){
    return this.http.post(`${this.baseUrl}/create`, userOrder, { responseType: 'text' });
  }

  getOrderByUserId(userId: number): Observable<UserOrderListDTO[]>{
    return this.http.get<UserOrderListDTO[]>(`${this.baseUrl}/getorderbyuserid/${userId}`);
  }

  getAllOrder(): Observable<UserOrderListDTO[]>{
    return this.http.get<UserOrderListDTO[]>(`${this.baseUrl}/getallorder`);
  }

  updateOrderStatus(orderId: number, status: string): Observable<any>{
    return this.http.put(`${this.baseUrl}/updatestatus/${orderId}`, { status }, { responseType: 'text' });
  }

  getOrderById(orderId: number): Observable<UserOrderListDTO> {
    return this.http.get<UserOrderListDTO>(`${this.baseUrl}/getorderbyid/${orderId}`);
  }

  calculateFeeByDistance(deliveryServiceId: number, addressId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/calculateFeeByDistance?deliveryServiceId=${deliveryServiceId}&addressId=${addressId}`);
  }

  // Jasper Reports Export Methods
  exportOrderReportToPDF(): Observable<Blob> {
    return this.http.get('http://localhost:8080/api/order-reports/pdf', { responseType: 'blob' });
  }

  exportSelectedOrdersToPDF(orderIds: number[]): Observable<Blob> {
    return this.http.post('http://localhost:8080/api/order-reports/pdf/selected', orderIds, { responseType: 'blob' });
  }

  exportOrderReportToCSV(): Observable<Blob> {
    return this.http.get('http://localhost:8080/api/order-reports/csv', { responseType: 'blob' });
  }

  exportSelectedOrdersToCSV(orderIds: number[]): Observable<Blob> {
    return this.http.post('http://localhost:8080/api/order-reports/csv/selected', orderIds, { responseType: 'blob' });
  }
}
