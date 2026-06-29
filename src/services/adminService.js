import apiClient from "../utils/apiClient";

export const getDashboard = async () => {
  return apiClient.get("/admin/dashboard");
};
