import type {
  Attempt,
  Question,
  Quiz,
  SubmitAnswer,
} from "../types";
import apiClient from "../utils/apiClient";

export const getQuizForLesson = async (lessonId: string): Promise<Quiz> => {
  return apiClient.get(`/lessons/${lessonId}/quiz`);
};

export const startAttempt = async (lessonId: string): Promise<Attempt> => {
  return apiClient.post(`/lessons/${lessonId}/quiz/attempt`);
};

export const submitAttempt = async (
  lessonId: string,
  attemptId: string,
  answers: SubmitAnswer[],
): Promise<Attempt> => {
  return apiClient.post(`/lessons/${lessonId}/quiz/attempt/${attemptId}/submit`, { answers });
};

export const getAttemptResult = async (
  lessonId: string,
  attemptId: string,
): Promise<Attempt> => {
  return apiClient.get(`/lessons/${lessonId}/quiz/attempt/${attemptId}`);
};

export const listMyAttempts = async (lessonId: string): Promise<Attempt[]> => {
  return apiClient.get(`/lessons/${lessonId}/quiz/attempts`);
};

export const instructorGetQuiz = async (
  courseId: string,
  lessonId: string,
): Promise<Quiz> => {
  return apiClient.get(`/courses/${courseId}/lessons/${lessonId}/quiz`);
};

export const createQuiz = async (
  courseId: string,
  lessonId: string,
  data: Partial<Quiz>,
): Promise<Quiz> => {
  return apiClient.post(`/courses/${courseId}/lessons/${lessonId}/quiz`, data);
};

export const addQuestion = async (
  courseId: string,
  lessonId: string,
  data: Partial<Question>,
): Promise<Question> => {
  return apiClient.post(`/courses/${courseId}/lessons/${lessonId}/quiz/questions`, data);
};

export const updateQuestion = async (
  courseId: string,
  lessonId: string,
  questionId: string,
  data: Partial<Question>,
): Promise<Question> => {
  return apiClient.patch(
    `/courses/${courseId}/lessons/${lessonId}/quiz/questions/${questionId}`,
    data,
  );
};

export const removeQuestion = async (
  courseId: string,
  lessonId: string,
  questionId: string,
): Promise<void> => {
  return apiClient.delete(
    `/courses/${courseId}/lessons/${lessonId}/quiz/questions/${questionId}`,
  );
};

export const publishQuiz = async (courseId: string, lessonId: string): Promise<Quiz> => {
  return apiClient.post(`/courses/${courseId}/lessons/${lessonId}/quiz/publish`);
};

export const unpublishQuiz = async (courseId: string, lessonId: string): Promise<Quiz> => {
  return apiClient.post(`/courses/${courseId}/lessons/${lessonId}/quiz/unpublish`);
};
