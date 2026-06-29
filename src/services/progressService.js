import apiClient from "../utils/apiClient";

export const trackProgress = async (payload) => {
  const { lessonId, watchedSeconds, isCompleted, lastPosition } = payload;
  return apiClient.post(`/lessons/${lessonId}/progress`, {
    watchedSeconds: watchedSeconds ?? 0,
    lastPosition: lastPosition ?? watchedSeconds ?? 0,
    isCompleted: isCompleted ?? false,
  });
};

export const getCourseProgress = async (courseId) => {
  return apiClient.get(`/courses/${courseId}/progress`);
};

export const getLessonProgress = async (lessonId) => {
  return apiClient.get(`/lessons/${lessonId}/progress`);
};

export const getCourseResume = async (courseId) => {
  return apiClient.get(`/courses/${courseId}/resume`);
};
