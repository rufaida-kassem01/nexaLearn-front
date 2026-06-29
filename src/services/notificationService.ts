import type { Notification, PaginatedResponse } from "../types";
import apiClient from "../utils/apiClient";

export const listNotifications = async (
  params: { cursor?: string; limit?: number } = {},
): Promise<PaginatedResponse<Notification>> => {
  return apiClient.get("/notifications", { params: { cursor: params.cursor, limit: params.limit } });
};

export const markAsRead = async (notificationId: string): Promise<Notification> => {
  return apiClient.patch(`/notifications/${notificationId}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  return apiClient.post("/notifications/read-all");
};
