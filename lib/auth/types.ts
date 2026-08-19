export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  displayName: string | null;
}

export interface AuthActionState {
  error: string | null;
}
