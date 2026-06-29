import type { PaginatedResponse, Post, Thread } from "../types";
import apiClient from "../utils/apiClient";

interface ThreadListParams {
  cursor?: string;
  limit?: number;
  unresolvedOnly?: boolean;
}

export const listThreads = async (
  lessonId: string,
  params: ThreadListParams = {},
): Promise<PaginatedResponse<Thread>> => {
  return apiClient.get(`/lessons/${lessonId}/discussions`, {
    params: { cursor: params.cursor, limit: params.limit, unresolvedOnly: params.unresolvedOnly },
  });
};

export const createThread = async (
  lessonId: string,
  data: { title: string; body: string },
): Promise<Thread> => {
  return apiClient.post(`/lessons/${lessonId}/discussions`, { title: data.title, body: data.body });
};

export const getThread = async (
  lessonId: string,
  threadId: string,
  params: { cursor?: string; limit?: number } = {},
): Promise<{ thread: Thread; posts: Post[] }> => {
  return apiClient.get(`/lessons/${lessonId}/discussions/${threadId}`, {
    params: { cursor: params.cursor, limit: params.limit },
  });
};

export const addPost = async (
  lessonId: string,
  threadId: string,
  data: { body: string },
): Promise<Post> => {
  return apiClient.post(`/lessons/${lessonId}/discussions/${threadId}/posts`, {
    body: data.body,
  });
};

export const upvoteThread = async (lessonId: string, threadId: string): Promise<Thread> => {
  return apiClient.post(`/lessons/${lessonId}/discussions/${threadId}/upvote`);
};

export const upvotePost = async (
  lessonId: string,
  threadId: string,
  postId: string,
): Promise<Post> => {
  return apiClient.post(
    `/lessons/${lessonId}/discussions/${threadId}/posts/${postId}/upvote`,
  );
};

export const acceptPost = async (
  lessonId: string,
  threadId: string,
  postId: string,
): Promise<Post> => {
  return apiClient.post(
    `/lessons/${lessonId}/discussions/${threadId}/posts/${postId}/accept`,
  );
};

export const pinThread = async (lessonId: string, threadId: string): Promise<Thread> => {
  return apiClient.post(`/lessons/${lessonId}/discussions/${threadId}/pin`);
};

export const unpinThread = async (lessonId: string, threadId: string): Promise<Thread> => {
  return apiClient.post(`/lessons/${lessonId}/discussions/${threadId}/unpin`);
};

export const deleteThread = async (lessonId: string, threadId: string): Promise<void> => {
  return apiClient.delete(`/lessons/${lessonId}/discussions/${threadId}`);
};
