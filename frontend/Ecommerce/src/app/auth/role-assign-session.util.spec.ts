import { shouldRefreshSessionAfterRoleAssign } from './role-assign-session.util';

describe('shouldRefreshSessionAfterRoleAssign', () => {
  it('returns true when current user is assigned and userAffected', () => {
    expect(
      shouldRefreshSessionAfterRoleAssign(5, 5, {
        message: 'ok',
        userAffected: true,
        authenticated: true,
      })
    ).toBe(true);
  });

  it('returns false when assigning another user', () => {
    expect(
      shouldRefreshSessionAfterRoleAssign(5, 9, { message: 'ok', userAffected: false })
    ).toBe(false);
  });

  it('returns false when userAffected is false (old token-in-body contract)', () => {
    expect(
      shouldRefreshSessionAfterRoleAssign(5, 5, { message: 'ok', userAffected: false })
    ).toBe(false);
  });
});