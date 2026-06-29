import type { ApplicationStatus, InstructorApplication } from "../types";
import apiClient from "../utils/apiClient";

export const applyInstructor = async (
  data: Record<string, unknown> = {},
): Promise<InstructorApplication> => {
  return apiClient.post("/instructor/apply", data);
};

export const getApplicationStatus = async (): Promise<InstructorApplication> => {
  return apiClient.get("/instructor/application/status");
};

export const listApplications = async (
  status?: ApplicationStatus,
  cursor?: string,
  limit?: number,
): Promise<InstructorApplication[]> => {
  return apiClient.get("/admin/instructor-applications", {
    params: { status, cursor, limit },
  });
};

export const approveApplication = async (id: string): Promise<InstructorApplication> => {
  return apiClient.post(`/admin/instructor-applications/${id}/approve`);
};

export const rejectApplication = async (
  id: string,
  reason: string,
): Promise<InstructorApplication> => {
  return apiClient.post(`/admin/instructor-applications/${id}/reject`, { reason });
};
