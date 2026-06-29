import apiClient from "../utils/apiClient";

export const listNotifications = async ({ cursor, limit } = {}) => {
  return apiClient.get("/notifications", { params: { cursor, limit } });
};

export const markAsRead = async (notificationId) => {
  return apiClient.patch(`/notifications/${notificationId}/read`);
};

export const markAllAsRead = async () => {
  return apiClient.post("/notifications/read-all");
};
