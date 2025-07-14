import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Brand, BrandDTO, BrandListDTO } from '../brand';

@Injectable({
  providedIn: 'root'
})
export class BrandService {
 baseUrl = 'http://localhost:8080/brand';

  constructor(private http: HttpClient) { }

  getAllBrand(): Observable<BrandListDTO[]>{
    return this.http.get<BrandListDTO[]>(`${this.baseUrl}/getallbrand`);
  }

  getBrandByCateId(id : number) : Observable<Brand[]>{
    return this.http.get<Brand[]>(`${this.baseUrl}/getbycateid/${id}`);
  }

  createBrandWithImage(brandDto: BrandDTO, imageFile?: File): Observable<any> {
    const formData = new FormData();
  
    // Append JSON brand object
    const brandBlob = new Blob([JSON.stringify(brandDto)], { type: 'application/json' });
    formData.append('brand', brandBlob);
  
    // Append image file if available
    if (imageFile) {
      formData.append('image', imageFile);
    }
  
    return this.http.post(`${this.baseUrl}/addbrand`, formData, { responseType: 'text' });
  }

  updateBrand(id: number, brandDto: BrandDTO, imageFile?: File): Observable<any> {
    const formData = new FormData();
  
    // Append JSON brand object
    const brandBlob = new Blob([JSON.stringify(brandDto)], { type: 'application/json' });
    formData.append('brand', brandBlob);
  
    if (imageFile) {
      formData.append('image', imageFile);
    }
  
    return this.http.put(`${this.baseUrl}/update/${id}`, formData, { responseType: 'text' });
  }

  deleteBrand(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/delete/${id}`, {},  { responseType: 'text'});
  }

  getBrandById(id: number) {
    return this.http.get<BrandDTO>(`${this.baseUrl}/getbrandbyid/${id}`);
  }
  
}
