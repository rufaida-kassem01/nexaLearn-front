import apiClient from "../utils/apiClient";

export const getCourseSummaries = async () => {
  return apiClient.get("/instructor/analytics");
};

export const getCourseDetail = async (courseId) => {
  return apiClient.get(`/instructor/analytics/${courseId}`);
};

export const getInstructorStudents = async (courseId, params = {}) => {
  if (!courseId) return [];
  return apiClient.get(`/instructor/analytics/${courseId}/students`, { params });
};

export const getInstructorOverview = async () => {
  return apiClient.get("/instructor/analytics");
};
