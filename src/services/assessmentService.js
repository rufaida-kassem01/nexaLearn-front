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

/* ── Instructor quiz management ── */

export const instructorGetQuiz = async (courseId, lessonId) => {
  return apiClient.get(`/courses/${courseId}/lessons/${lessonId}/quiz`);
};

export const createQuiz = async (courseId, lessonId, data) => {
  return apiClient.post(`/courses/${courseId}/lessons/${lessonId}/quiz`, data);
};

export const addQuestion = async (courseId, lessonId, data) => {
  return apiClient.post(`/courses/${courseId}/lessons/${lessonId}/quiz/questions`, data);
};

export const updateQuestion = async (courseId, lessonId, questionId, data) => {
  return apiClient.patch(
    `/courses/${courseId}/lessons/${lessonId}/quiz/questions/${questionId}`,
    data,
  );
};

export const removeQuestion = async (courseId, lessonId, questionId) => {
  return apiClient.delete(
    `/courses/${courseId}/lessons/${lessonId}/quiz/questions/${questionId}`,
  );
};

export const publishQuiz = async (courseId, lessonId) => {
  return apiClient.post(`/courses/${courseId}/lessons/${lessonId}/quiz/publish`);
};

export const unpublishQuiz = async (courseId, lessonId) => {
  return apiClient.post(`/courses/${courseId}/lessons/${lessonId}/quiz/unpublish`);
};
