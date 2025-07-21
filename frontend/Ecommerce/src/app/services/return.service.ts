import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReturnRequestDTO } from '../user-order';
import { RefundDTO } from '../refund';
import { ReturnRequestById } from '../return';

@Injectable({
  providedIn: 'root'
})
export class ReturnService {
  private baseUrl = 'http://localhost:8080/returns'; // Adjust your backend base URL

  constructor(private http: HttpClient) {}

  submitReturnRequest(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/submit`, formData); 
  }  

  cancelReturnRequest(returnRequestId: number) {
    return this.http.put(`${this.baseUrl}/cancel/${returnRequestId}`, {}, { responseType: 'text' });
  }

  getAllReturn():Observable<ReturnRequestDTO[]>{
    return this.http.get<ReturnRequestDTO[]>(`${this.baseUrl}/getallrequest`);
  }

  getReturnById(returnRequestId: number):Observable<ReturnRequestById>{
    return this.http.get<ReturnRequestById>(`${this.baseUrl}/getrequestbyid/${returnRequestId}`,);
  }

  approveRequest(data: { returnRequestId: number, adminRemark: string }) {
    return this.http.post(`${this.baseUrl}/approve`, data, { responseType: 'text' });
  }
  rejectRequest(data: { returnRequestId: number, adminRemark: string }) {
    return this.http.post(`${this.baseUrl}/reject`, data, { responseType: 'text' });
  }

  processRefund(data: RefundDTO) {
    return this.http.post(`${this.baseUrl}/refund`, data, { responseType: 'text' });
  }

  processReplacement(data: { returnRequestId: number; adminRemark?: string }) {
    return this.http.post(`${this.baseUrl}/replacement`, data, { responseType: 'text' });
  }  
  
}