import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PermissionCategory {
  id: number;
  name: string;
  icon: string;
  permissions: any[];
}

@Injectable({ providedIn: 'root' })
export class PermissionCategoryService {
  private apiUrl = 'http://localhost:8080/api/permission-categories';

  constructor(private http: HttpClient) {}

  getPermissionCategories(): Observable<PermissionCategory[]> {
    return this.http.get<PermissionCategory[]>(this.apiUrl);
  }
} 