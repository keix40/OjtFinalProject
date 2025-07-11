import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = 'http://localhost:8080/api/auth/user'; // Adjust base URL if needed

  constructor(private http: HttpClient) {}

  createUserByAdmin(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/createUser`, payload);
  }

  getAllRoles(): Observable<any> {
    return this.http.get('http://localhost:8080/api/roles');
  }

  checkEmailExists(email: string) {
    return this.http.get<{ exists: boolean }>(`http://localhost:8080/api/auth/check-email?email=${encodeURIComponent(email)}`);
  }

  validateRealEmail(email: string) {
    return this.http.post<{ real: boolean, message: string }>('http://localhost:8080/api/auth/validate-real-email', { email });
  }

  getCustomers(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:8080/api/auth/user/customers');
  }

  // --- Added for customer management actions ---
  // Delete user by ID (for customer table delete action)
  deleteUser(id: string) {
    return this.http.delete(`http://localhost:8080/api/auth/user/${id}`);
  }

  // Update user status (for activate/deactivate action)
  updateUserStatus(id: string, status: string) {
    return this.http.patch(`http://localhost:8080/api/auth/user/${id}/status`, { status });
  }

  // Get user details by ID (for view details modal)
  getUserById(id: string) {
    return this.http.get(`http://localhost:8080/api/auth/user/${id}`);
  }
  // --- End customer management actions ---
} 