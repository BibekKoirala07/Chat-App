// src/types/auth.types.ts

export interface User {
  id: string;
  username: string;
  email: string;
  photoUrl?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: User;
}

// Data we'll send for registration
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  photo?: File;
}

// Data we'll send for login
export interface LoginData {
  email: string;
  password: string;
}
