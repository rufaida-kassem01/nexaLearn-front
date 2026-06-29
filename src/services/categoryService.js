import apiClient from "../utils/apiClient";

export const getCategories = async () => {
  return apiClient.get("/categories");
};

export const createCategory = async (data) => {
  return apiClient.post("/admin/search/categories", data);
};

export const updateCategory = async (id, data) => {
  return apiClient.patch(`/admin/search/categories/${id}`, data);
};

export const deleteCategory = async (id) => {
  return apiClient.delete(`/admin/search/categories/${id}`);
};
