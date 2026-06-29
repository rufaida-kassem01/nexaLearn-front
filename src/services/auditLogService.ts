import type { AuditLogEntry, AuditLogInsights } from "../types";
import apiClient from "../utils/apiClient";

export const listLogs = async (
  params: Record<string, unknown> = {},
): Promise<AuditLogEntry[]> => {
  return apiClient.get("/admin/audit-logs", { params });
};

export const getInsights = async (): Promise<AuditLogInsights> => {
  return apiClient.get("/admin/audit-logs/insights");
};
