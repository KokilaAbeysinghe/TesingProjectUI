export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  contactNumber: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresAtUtc: string;
  userId: number;
  email: string;
  role: string;
}
