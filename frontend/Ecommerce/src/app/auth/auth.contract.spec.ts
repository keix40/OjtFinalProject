import { RegisterResponse, AssignRoleResponse } from './auth.types';

describe('Auth API contracts', () => {
  it('RegisterResponse is message-only (no bearer fields required)', () => {
    const sample: RegisterResponse = { message: 'User registered successfully' };
    expect(sample.message).toContain('registered');
    expect((sample as unknown as { accessToken?: string }).accessToken).toBeUndefined();
  });

  it('AssignRoleResponse uses cookie session refresh flags, not newToken', () => {
    const sample: AssignRoleResponse = {
      message: 'Role assigned successfully',
      userAffected: true,
      authenticated: true,
    };
    expect(sample.userAffected).toBe(true);
    expect((sample as unknown as { newToken?: string }).newToken).toBeUndefined();
  });
});