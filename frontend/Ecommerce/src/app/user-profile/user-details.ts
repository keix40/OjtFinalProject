export interface UserDetails {
  id?: number | null;
  name: string | null;
  email: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  phoneNumber: string | null;
  password?: string | null;
  roles?: string[];
} 