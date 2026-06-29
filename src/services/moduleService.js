import apiClient from "../utils/apiClient";

export const createModule = async (courseId, { title }) => {
  return apiClient.post(`/courses/${courseId}/modules`, { title });
};
