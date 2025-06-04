export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  gender?: string;
  dateOfBirth?: string; 
  phoneNumber?: string;
  roleId: number;
}
