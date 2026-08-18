export interface JwtUser {
  id: string;
  email: string;
  role: string;
  sessionId: string;
}

export interface JwtRefreshPayload {
  sub: string;
  email: string;
  sessionId: string;
}
