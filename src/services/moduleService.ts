import type { Module } from "../types";
import apiClient from "../utils/apiClient";

export const createModule = async (courseId: string, data: { title: string }): Promise<Module> => {
  return apiClient.post(`/courses/${courseId}/modules`, { title: data.title });
};
