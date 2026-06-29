import apiClient from "../utils/apiClient";

export const getQuizForLesson = async (lessonId) => {
  return apiClient.get(`/lessons/${lessonId}/quiz`);
};

export const startAttempt = async (lessonId) => {
  return apiClient.post(`/lessons/${lessonId}/quiz/attempt`);
};

export const submitAttempt = async (lessonId, attemptId, answers) => {
  return apiClient.post(`/lessons/${lessonId}/quiz/attempt/${attemptId}/submit`, { answers });
};

export const getAttemptResult = async (lessonId, attemptId) => {
  return apiClient.get(`/lessons/${lessonId}/quiz/attempt/${attemptId}`);
};

export const listMyAttempts = async (lessonId) => {
  return apiClient.get(`/lessons/${lessonId}/quiz/attempts`);
};
