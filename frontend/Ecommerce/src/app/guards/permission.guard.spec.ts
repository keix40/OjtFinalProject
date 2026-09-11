import { PermissionGuard } from './permission.guard';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { Location } from '@angular/common';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let perms: jasmine.SpyObj<{ hasPermission: (p: string) => boolean }>;
  let router: jasmine.SpyObj<Router>;
  let location: jasmine.SpyObj<Location>;
  let authService: jasmine.SpyObj<{ getRoles: () => string[] }>;
  let luxDialog: jasmine.SpyObj<{ warning: (t: string, m: string) => Promise<void> }>;

  beforeEach(() => {
    perms = jasmine.createSpyObj('PermissionService', ['hasPermission']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    location = jasmine.createSpyObj('Location', ['back']);
    authService = jasmine.createSpyObj('AuthService', ['getRoles']);
    luxDialog = jasmine.createSpyObj('LuxDialogService', ['warning']);
    luxDialog.warning.and.returnValue(Promise.resolve());

    guard = new PermissionGuard(
      perms as any,
      router,
      location,
      authService as any,
      luxDialog as any
    );
  });

  it('fails closed when route permission is missing', () => {
    const route = { data: {} } as ActivatedRouteSnapshot;
    expect(guard.canActivate(route)).toBeFalse();
    expect(luxDialog.warning).toHaveBeenCalled();
    expect(perms.hasPermission).not.toHaveBeenCalled();
  });

  it('allows access when permission is granted', () => {
    perms.hasPermission.and.returnValue(true);
    const route = { data: { permission: 'orders.view' } } as unknown as ActivatedRouteSnapshot;
    expect(guard.canActivate(route)).toBeTrue();
  });
});
