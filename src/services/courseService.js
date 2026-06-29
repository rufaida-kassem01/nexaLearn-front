import apiClient from "../utils/apiClient";

export const searchCourses = async ({ query, categoryId, limit, cursor, sort, level } = {}) => {
  try {
    return await apiClient.get("/courses/search", {
      params: { q: query, categoryId, limit, cursor, sort, level },
    });
  } catch {
    const result = await getCourses({ limit, cursor });
    return { ...result, results: result.items, total: result.items.length };
  }
};

export const getCategoryCourses = async (
  slug,
  { query, limit, cursor, sort, level } = {},
) => {
  return apiClient.get(`/categories/${slug}/courses`, {
    params: { q: query, limit, cursor, sort, level },
  });
};

export const getCourses = async ({ limit, cursor } = {}) => {
  return apiClient.get("/courses", { params: { limit, cursor } });
};

export const getCourse = async (id) => {
  return apiClient.get(`/courses/${id}`);
};

export const getCourseById = getCourse;

export const createCourse = async (courseData) => {
  return apiClient.post("/courses", courseData);
};

export const addModule = async (courseId, data) => {
  return apiClient.post(`/courses/${courseId}/modules`, data);
};

export const addLesson = async (courseId, moduleId, data) => {
  return apiClient.post(`/courses/${courseId}/modules/${moduleId}/lessons`, data);
};

export const publishCourse = async (courseId) => {
  return apiClient.post(`/courses/${courseId}/publish`);
};

export const updateCourse = async (id, courseData) => {
  return apiClient.patch(`/courses/${id}`, courseData);
};

export const deleteCourse = async (id) => {
  return apiClient.delete(`/courses/${id}`);
};

export const getCourseContent = async (courseId) => {
  return apiClient.get(`/courses/${courseId}/content`);
};

export const reorderModules = async (courseId, moduleIdsInOrder) => {
  return apiClient.patch(`/courses/${courseId}/modules/reorder`, {
    moduleIdsInOrder,
  });
};

export const reorderLessons = async (courseId, moduleId, lessonIdsInOrder) => {
  return apiClient.patch(
    `/courses/${courseId}/modules/${moduleId}/lessons/reorder`,
    { lessonIdsInOrder }
  );
};
