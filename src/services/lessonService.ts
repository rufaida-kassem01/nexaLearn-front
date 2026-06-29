import type { Lesson, Module, PlaybackResponse } from "../types";
import apiClient from "../utils/apiClient";

interface CourseContent {
  id: string;
  title: string;
  modules: Module[];
}

export const getLesson = async (id: string): Promise<Lesson> => {
  return apiClient.get(`/lessons/${id}`);
};

export const getCoursePlayer = async (courseId: string): Promise<CourseContent> => {
  return apiClient.get(`/courses/${courseId}/content`);
};

export const getLessonPlayback = async (lessonId: string): Promise<PlaybackResponse> => {
  return apiClient.get(`/lessons/${lessonId}/playback`);
};

export const createLesson = async (
  courseId: string,
  moduleId: string,
  data: Partial<Lesson>,
): Promise<Lesson> => {
  return apiClient.post(`/courses/${courseId}/modules/${moduleId}/lessons`, data);
};
