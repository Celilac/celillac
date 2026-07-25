// frontend/web-app/src/api/iam.ts
import { apiClient } from './client';

export interface RegisterRequest {
  email:    string;
  password: string;
  role:     'CELIACO' | 'PARCEIRO' | 'ADMIN';
}

export interface RegisterResponse {
  id:    string;
  email: string;
  role:  string;
}

export interface LoginRequest {
  email:    string;
  password: string;
}

export interface LoginResponse {
  token:     string;
  expiresIn: string;
}

export const iamApi = {
  register: (body: RegisterRequest) =>
    apiClient.post<RegisterResponse>('/iam/register', body),

  login: (body: LoginRequest) =>
    apiClient.post<LoginResponse>('/iam/login', body),

  logout: (token: string) =>
    apiClient.post<void>('/iam/logout', {}, token),
};
