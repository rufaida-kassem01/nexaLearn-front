import apiClient from "../utils/apiClient";

export const getCourseReviews = async (courseId, params = {}) => {
  return apiClient.get(`/courses/${courseId}/reviews`, { params });
};

export const submitReview = async (payload) => {
  return apiClient.post(`/courses/${payload.courseId}/reviews`, payload);
};

export const createReview = async (courseId, data) => {
  return apiClient.post(`/courses/${courseId}/reviews`, data);
};

export const updateReview = async (reviewId, data) => {
  return apiClient.patch(`/reviews/${reviewId}`, data);
};

export const deleteReview = async (reviewId) => {
  return apiClient.delete(`/reviews/${reviewId}`);
};
