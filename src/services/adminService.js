import apiClient from "../utils/apiClient";

export const getDashboard = async () => {
  return apiClient.get("/admin/dashboard");
};

export const listApplications = async (status = "PENDING", cursor, limit) => {
  const params = { status, ...(cursor && { cursor }), ...(limit && { limit }) };
  return apiClient.get("/admin/instructor-applications", { params });
};

export const approveApplication = async (id) => {
  return apiClient.post(`/admin/instructor-applications/${id}/approve`);
};

export const rejectApplication = async (id, reason) => {
  return apiClient.post(`/admin/instructor-applications/${id}/reject`, { reason });
};

export const listAuditLogs = async (params = {}) => {
  return apiClient.get("/admin/audit-logs", { params });
};
