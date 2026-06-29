import type { AuthResponse, LoginRequest, SignupRequest, User } from "../types";
import apiClient from "../utils/apiClient";

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  return apiClient.post("/auth/login", data);
};

export const signup = async (data: SignupRequest): Promise<AuthResponse> => {
  return apiClient.post("/auth/signup", data);
};

export const refresh = async (): Promise<AuthResponse> => {
  return apiClient.post("/auth/refresh");
};

export const logout = async (): Promise<void> => {
  return apiClient.post("/auth/logout");
};

export const sendVerificationEmail = async (): Promise<{ message: string }> => {
  return apiClient.post("/auth/send-email-verification");
};

export const verifyEmail = async (token: string): Promise<{ message: string }> => {
  return apiClient.get("/auth/verify-email", { params: { token } });
};

export const requestPasswordReset = async (data: { email: string }): Promise<{ message: string }> => {
  return apiClient.post("/auth/request-password-reset", data);
};

export const resetPassword = async (data: { token: string; password: string }): Promise<{ message: string }> => {
  return apiClient.post("/auth/reset-password", data);
};

export const me = async (): Promise<User> => {
  return apiClient.get("/auth/me");
};

export const extractError = (err: unknown): string => {
  if (err && typeof err === "object") {
    const e = err as {
      response?: { data?: { message?: string | string[]; error?: { message?: string } } };
      message?: string;
    };
    if (e.response?.data?.message) {
      const msg = e.response.data.message;
      return Array.isArray(msg) ? msg[0] : msg;
    }
    if (e.response?.data?.error?.message) {
      return e.response.data.error.message;
    }
    if (e.message) return e.message;
  }
  return "An unexpected error occurred";
};
