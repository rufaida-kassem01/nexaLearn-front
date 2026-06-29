import apiClient from "../utils/apiClient";

export const signup = async (data) => {
  return apiClient.post("/auth/signup", data);
};

export const login = async (data) => {
  return apiClient.post("/auth/login", data);
};

export const refresh = async () => {
  return apiClient.post("/auth/refresh");
};

export const logout = async () => {
  return apiClient.post("/auth/logout");
};

export const sendVerificationEmail = async () => {
  return apiClient.post("/auth/send-email-verification");
};

export const verifyEmail = async (token) => {
  return apiClient.get("/auth/verify-email", { params: { token } });
};

export const requestPasswordReset = async (data) => {
  return apiClient.post("/auth/request-password-reset", data);
};

export const resetPassword = async (data) => {
  return apiClient.post("/auth/reset-password", data);
};

export const me = async () => {
  return apiClient.get("/auth/me");
};

export const extractError = (err) => {
  if (err?.response?.data?.message) {
    const msg = err.response.data.message;
    return Array.isArray(msg) ? msg[0] : msg;
  }
  if (err?.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  if (err?.message) return err.message;
  return "An unexpected error occurred";
};
