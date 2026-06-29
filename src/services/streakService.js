import apiClient from "../utils/apiClient";

export const getStreak = async () => {
  return apiClient.get("/users/me/streak");
};
