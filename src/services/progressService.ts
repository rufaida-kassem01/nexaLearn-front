import type { CourseProgress, ResumeData, TrackProgressRequest } from "../types";
import apiClient from "../utils/apiClient";

interface TrackProgressPayload extends TrackProgressRequest {
  lastPosition?: number;
}

export const trackProgress = async (payload: TrackProgressPayload): Promise<CourseProgress> => {
  const { lessonId, watchedSeconds, isCompleted, lastPosition } = payload;
  return apiClient.post(`/lessons/${lessonId}/progress`, {
    watchedSeconds: watchedSeconds ?? 0,
    lastPosition: lastPosition ?? watchedSeconds ?? 0,
    isCompleted: isCompleted ?? false,
  });
};

export const getCourseProgress = async (courseId: string): Promise<CourseProgress> => {
  return apiClient.get(`/courses/${courseId}/progress`);
};

export const getLessonProgress = async (
  lessonId: string,
): Promise<{ lessonId: string; watchedSeconds: number; isCompleted: boolean }> => {
  return apiClient.get(`/lessons/${lessonId}/progress`);
};

export const getCourseResume = async (courseId: string): Promise<ResumeData> => {
  return apiClient.get(`/courses/${courseId}/resume`);
};
