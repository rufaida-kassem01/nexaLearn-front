import apiClient from "../utils/apiClient";

export const getLesson = async (id) => {
  return apiClient.get(`/lessons/${id}`);
};

export const getCoursePlayer = async (courseId) => {
  return apiClient.get(`/courses/${courseId}/content`);
};

export const getLessonPlayback = async (lessonId) => {
  return apiClient.get(`/lessons/${lessonId}/playback`);
};

export const createLesson = async (courseId, moduleId, data) => {
  return apiClient.post(`/courses/${courseId}/modules/${moduleId}/lessons`, data);
};


