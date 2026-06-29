import type { Streak } from "../types";
import apiClient from "../utils/apiClient";

export const getStreak = async (): Promise<Streak> => {
  return apiClient.get("/users/me/streak");
};
