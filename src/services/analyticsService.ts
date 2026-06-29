import type {
  CourseSummary,
  InstructorOverview,
  LessonEngagement,
  QuizStats,
  RevenueBreakdown,
} from "../types";
import apiClient from "../utils/apiClient";

export const getCourseSummaries = async (): Promise<CourseSummary[]> => {
  return apiClient.get("/instructor/analytics");
};

export const getCourseDetail = async (courseId: string): Promise<CourseSummary> => {
  return apiClient.get(`/instructor/analytics/${courseId}`);
};

export const getInstructorStudents = async (
  courseId: string,
  params: Record<string, unknown> = {},
): Promise<Record<string, unknown>[]> => {
  if (!courseId) return [];
  return apiClient.get(`/instructor/analytics/${courseId}/students`, { params });
};

export const getInstructorOverview = async (): Promise<InstructorOverview> => {
  return apiClient.get("/instructor/analytics");
};

export const getLessonEngagement = async (courseId: string): Promise<LessonEngagement[]> => {
  return apiClient.get(`/instructor/analytics/${courseId}/lessons`);
};

export const getRevenueBreakdown = async (
  courseId: string,
  params: { year?: number } = {},
): Promise<RevenueBreakdown> => {
  return apiClient.get(`/instructor/analytics/${courseId}/revenue`, {
    params: { ...(params.year ? { year: params.year } : {}) },
  });
};

export const getQuizStats = async (courseId: string): Promise<QuizStats[]> => {
  return apiClient.get(`/instructor/analytics/${courseId}/quiz-stats`);
};
