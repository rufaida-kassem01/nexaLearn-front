import apiClient from "../utils/apiClient";

export const listLogs = async (params = {}) => {
  return apiClient.get("/admin/audit-logs", { params });
};

export const getInsights = async () => {
  return apiClient.get("/admin/audit-logs/insights");
};
