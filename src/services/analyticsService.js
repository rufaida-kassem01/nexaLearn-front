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

export const getLessonEngagement = async (courseId) => {
  return apiClient.get(`/instructor/analytics/${courseId}/lessons`);
};

export const getRevenueBreakdown = async (courseId, { year } = {}) => {
  return apiClient.get(`/instructor/analytics/${courseId}/revenue`, {
    params: { ...(year ? { year } : {}) },
  });
};

export const getQuizStats = async (courseId) => {
  return apiClient.get(`/instructor/analytics/${courseId}/quiz-stats`);
};
