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

export const addPost = async (lessonId, threadId, { body }) => {
  return apiClient.post(`/lessons/${lessonId}/discussions/${threadId}/posts`, { body });
};

export const upvoteThread = async (lessonId, threadId) => {
  return apiClient.post(`/lessons/${lessonId}/discussions/${threadId}/upvote`);
};

export const upvotePost = async (lessonId, threadId, postId) => {
  return apiClient.post(`/lessons/${lessonId}/discussions/${threadId}/posts/${postId}/upvote`);
};

export const acceptPost = async (lessonId, threadId, postId) => {
  return apiClient.post(`/lessons/${lessonId}/discussions/${threadId}/posts/${postId}/accept`);
};

export const pinThread = async (lessonId, threadId) => {
  return apiClient.post(`/lessons/${lessonId}/discussions/${threadId}/pin`);
};

export const unpinThread = async (lessonId, threadId) => {
  return apiClient.post(`/lessons/${lessonId}/discussions/${threadId}/unpin`);
};

export const deleteThread = async (lessonId, threadId) => {
  return apiClient.delete(`/lessons/${lessonId}/discussions/${threadId}`);
};
