import type { AdminDashboard } from "../types";
import apiClient from "../utils/apiClient";

export const getDashboard = async (): Promise<AdminDashboard> => {
  return apiClient.get("/admin/dashboard");
};
