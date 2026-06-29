import apiClient from "../utils/apiClient";

export const listThreads = async (lessonId, { cursor, limit, unresolvedOnly } = {}) => {
  return apiClient.get(`/lessons/${lessonId}/discussions`, {
    params: { cursor, limit, unresolvedOnly },
  });
};

export const createThread = async (lessonId, { title, body }) => {
  return apiClient.post(`/lessons/${lessonId}/discussions`, { title, body });
};

export const getThread = async (lessonId, threadId, { cursor, limit } = {}) => {
  return apiClient.get(`/lessons/${lessonId}/discussions/${threadId}`, {
    params: { cursor, limit },
  });
};
