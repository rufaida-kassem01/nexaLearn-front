import type { FlagReviewRequest, PaginatedResponse, Review } from "../types";
import apiClient from "../utils/apiClient";

export const getCourseReviews = async (
  courseId: string,
  params: Record<string, unknown> = {},
): Promise<PaginatedResponse<Review>> => {
  return apiClient.get(`/courses/${courseId}/reviews`, { params });
};

export const submitReview = async (
  payload: { courseId: string; rating: number; comment?: string; title?: string },
): Promise<Review> => {
  return apiClient.post(`/courses/${payload.courseId}/reviews`, payload);
};

export const createReview = async (
  courseId: string,
  data: { rating: number; comment?: string; title?: string },
): Promise<Review> => {
  return apiClient.post(`/courses/${courseId}/reviews`, data);
};

export const updateReview = async (
  reviewId: string,
  data: { rating?: number; comment?: string; title?: string },
): Promise<Review> => {
  return apiClient.patch(`/reviews/${reviewId}`, data);
};

export const deleteReview = async (reviewId: string): Promise<void> => {
  return apiClient.delete(`/reviews/${reviewId}`);
};

export const flagReview = async (
  reviewId: string,
  data: FlagReviewRequest,
): Promise<void> => {
  return apiClient.post(`/reviews/${reviewId}/flags`, { reason: data.reason });
};
