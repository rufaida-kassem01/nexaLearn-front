import apiClient from "../utils/apiClient";

export const getCategories = async () => {
  return apiClient.get("/categories");
};
