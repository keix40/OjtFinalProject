import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { PermissionService } from '../services/permission.service';
import { environment } from '../../environments/environment';

/**
 * Documents brand-new email flow: sendOtp → verify-otp (no user) → register → login → /me.
 */
describe('AuthService registration flow (HTTP contract)', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    spyOn(globalThis, 'fetch').and.callFake((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('ipinfo.io')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ city: 'Test', region: 'Test', country: 'US' }),
        } as Response);
      }
      if (url.includes('ipify')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ip: '127.0.0.1' }),
        } as Response);
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, PermissionService],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('pre-register verify-otp then register then session uses message-only responses', async () => {
    const email = 'brand-new@test.com';
    const password = 'secret123';

    auth.sendRegisterOtp(email).subscribe();
    const sendReq = http.expectOne(`${environment.apiUrl}/auth/sendOtp`);
    expect(sendReq.request.method).toBe('POST');
    sendReq.flush({ message: 'OTP sent' });

    auth.verifyOtp(email, '123456').subscribe();
    const verifyReq = http.expectOne(`${environment.apiUrl}/auth/verify-otp`);
    verifyReq.flush({ message: 'OTP verified successfully.' });

    const formData = new FormData();
    auth.register(formData).subscribe();
    const registerReq = http.expectOne(`${environment.apiUrl}/auth/register`);
    expect(registerReq.request.withCredentials).toBe(true);
    registerReq.flush({ message: 'Registration successful.' });

    auth.login({ email, password }).subscribe();
    await new Promise<void>(resolve => setTimeout(resolve, 0));

    const loginReq = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(loginReq.request.withCredentials).toBe(true);
    loginReq.flush({ message: 'Authenticated', authenticated: true });

    auth.establishSession().subscribe();
    const meReq = http.expectOne(`${environment.apiUrl}/auth/me`);
    meReq.flush({
      id: 1,
      sub: email,
      name: 'New',
      roles: 'ROLE_CUSTOMER',
      permissions: 'orders.view',
    });
  });
});