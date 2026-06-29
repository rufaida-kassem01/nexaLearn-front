import type { Enrollment, PaymentIntentResponse } from "../types";
import apiClient from "../utils/apiClient";

export const checkEnrollment = async (courseId: string): Promise<Enrollment | null> => {
  return apiClient.get(`/courses/${courseId}/enrollment`);
};

export const enrollFree = async (courseId: string): Promise<Enrollment> => {
  return apiClient.post(`/courses/${courseId}/enroll`, {});
};

export const startCheckout = async (courseId: string): Promise<PaymentIntentResponse> => {
  return apiClient.post("/payments/intent", { courseId });
};

export const getMyEnrollments = async (): Promise<Enrollment[]> => {
  return apiClient.get("/users/me/enrollments");
};

export const cancelEnrollment = async (courseId: string): Promise<Enrollment> => {
  return apiClient.post(`/courses/${courseId}/enroll/cancel`);
};

export const requestRefund = async (courseId: string): Promise<Enrollment> => {
  return apiClient.post(`/courses/${courseId}/enroll/refund`);
};
