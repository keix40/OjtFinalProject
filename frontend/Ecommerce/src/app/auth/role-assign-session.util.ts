import { AssignRoleResponse } from './auth.types';

/** Cookie-session refresh is required when the signed-in user's own role changed. */
export function shouldRefreshSessionAfterRoleAssign(
  assignedUserId: number,
  currentUserId: number | null | undefined,
  response: AssignRoleResponse | null | undefined
): boolean {
  if (currentUserId == null || response == null) {
    return false;
  }
  return assignedUserId === currentUserId && response.userAffected === true;
}