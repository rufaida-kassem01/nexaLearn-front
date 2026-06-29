import type { Course, Lesson, Module, PaginatedResponse, SearchCourseResult } from "../types";
import apiClient from "../utils/apiClient";

interface CourseContent {
  id: string;
  title: string;
  modules: Module[];
}

interface SearchParams {
  query?: string;
  categoryId?: string;
  limit?: number;
  cursor?: string;
  sort?: string;
  level?: string;
}

export const searchCourses = async (
  params: SearchParams = {},
): Promise<PaginatedResponse<SearchCourseResult>> => {
  try {
    return await apiClient.get("/courses/search", {
      params: {
        q: params.query,
        categoryId: params.categoryId,
        limit: params.limit,
        cursor: params.cursor,
        sort: params.sort,
        level: params.level,
      },
    });
  } catch {
    const result = await getCourses({ limit: params.limit, cursor: params.cursor });
    return { ...result, results: result.items, total: result.items.length };
  }
};

export const getCategoryCourses = async (
  slug: string,
  params: Omit<SearchParams, "categoryId"> = {},
): Promise<PaginatedResponse<SearchCourseResult>> => {
  return apiClient.get(`/categories/${slug}/courses`, {
    params: {
      q: params.query,
      limit: params.limit,
      cursor: params.cursor,
      sort: params.sort,
      level: params.level,
    },
  });
};

export const getCourses = async (
  params: { limit?: number; cursor?: string } = {},
): Promise<PaginatedResponse<Course>> => {
  return apiClient.get("/courses", { params: { limit: params.limit, cursor: params.cursor } });
};

export const getCourse = async (id: string): Promise<Course> => {
  return apiClient.get(`/courses/${id}`);
};

export const getCourseById = getCourse;

export const createCourse = async (courseData: Partial<Course>): Promise<Course> => {
  return apiClient.post("/courses", courseData);
};

export const addModule = async (courseId: string, data: { title: string }): Promise<Module> => {
  return apiClient.post(`/courses/${courseId}/modules`, data);
};

export const addLesson = async (
  courseId: string,
  moduleId: string,
  data: Partial<Lesson>,
): Promise<Lesson> => {
  return apiClient.post(`/courses/${courseId}/modules/${moduleId}/lessons`, data);
};

export const publishCourse = async (courseId: string): Promise<Course> => {
  return apiClient.post(`/courses/${courseId}/publish`);
};

export const updateCourse = async (id: string, courseData: Partial<Course>): Promise<Course> => {
  return apiClient.patch(`/courses/${id}`, courseData);
};

export const deleteCourse = async (id: string): Promise<void> => {
  return apiClient.delete(`/courses/${id}`);
};

export const getCourseContent = async (courseId: string): Promise<CourseContent> => {
  return apiClient.get(`/courses/${courseId}/content`);
};

export const reorderModules = async (
  courseId: string,
  moduleIdsInOrder: string[],
): Promise<Module[]> => {
  return apiClient.patch(`/courses/${courseId}/modules/reorder`, { moduleIdsInOrder });
};

export const reorderLessons = async (
  courseId: string,
  moduleId: string,
  lessonIdsInOrder: string[],
): Promise<Lesson[]> => {
  return apiClient.patch(`/courses/${courseId}/modules/${moduleId}/lessons/reorder`, {
    lessonIdsInOrder,
  });
};
