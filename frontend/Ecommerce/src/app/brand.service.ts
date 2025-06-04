import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Brand, BrandDTO } from './brand';

@Injectable({
  providedIn: 'root'
})
export class BrandService {
 baseUrl = 'http://localhost:8080/brand';

  constructor(private http: HttpClient) { }

  getAllBrand(): Observable<Brand[]>{
    return this.http.get<Brand[]>(`${this.baseUrl}/getallbrand`);
  }

  getBrandByCateId(id : number) : Observable<Brand[]>{
    return this.http.get<Brand[]>(`${this.baseUrl}/getbycateid/${id}`);
  }

  createBrand(brandDto : BrandDTO): Observable<any> {
    return this.http.post(`${this.baseUrl}/addbrand`, brandDto, { responseType: 'text' });
  }
}
