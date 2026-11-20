/** POST /api/auth/register — cookies are not issued until login. */
export interface RegisterResponse {
  message: string;
}

export interface AssignRoleResponse {
  message: string;
  userAffected: boolean;
  authenticated?: boolean;
}