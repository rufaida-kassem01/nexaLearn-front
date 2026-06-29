import apiClient from "../utils/apiClient";

export const applyInstructor = async (data = {}) => {
  return apiClient.post("/instructor/apply", data);
};

export const getApplicationStatus = async () => {
  return apiClient.get("/instructor/application/status");
};

// --- Admin endpoints ---

export const listApplications = async (status, cursor, limit) => {
  return apiClient.get("/admin/instructor-applications", {
    params: { status, cursor, limit },
  });
};

export const approveApplication = async (id) => {
  return apiClient.post(`/admin/instructor-applications/${id}/approve`);
};

export const rejectApplication = async (id, reason) => {
  return apiClient.post(`/admin/instructor-applications/${id}/reject`, { reason });
};
