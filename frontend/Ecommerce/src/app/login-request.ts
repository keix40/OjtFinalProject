export interface LoginRequest {
  email: string;
  password: string;
  location?: string;
  countryCode?: string;
}
