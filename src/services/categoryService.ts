import type { Category } from "../types";
import apiClient from "../utils/apiClient";

export const getCategories = async (): Promise<Category[]> => {
  return apiClient.get("/categories");
};

export const createCategory = async (data: Partial<Category>): Promise<Category> => {
  return apiClient.post("/admin/search/categories", data);
};

export const updateCategory = async (id: string, data: Partial<Category>): Promise<Category> => {
  return apiClient.patch(`/admin/search/categories/${id}`, data);
};

export const deleteCategory = async (id: string): Promise<void> => {
  return apiClient.delete(`/admin/search/categories/${id}`);
};
