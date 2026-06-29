import apiClient from "../utils/apiClient";

export const checkEnrollment = async (courseId) => {
  return apiClient.get(`/courses/${courseId}/enrollment`);
};

export const enrollFree = async (courseId) => {
  return apiClient.post(`/courses/${courseId}/enroll`, {});
};

export const startCheckout = async (courseId) => {
  return apiClient.post("/payments/intent", { courseId });
};

export const getMyEnrollments = async () => {
  return apiClient.get("/users/me/enrollments");
};

export const cancelEnrollment = async (courseId) => {
  return apiClient.post(`/courses/${courseId}/enroll/cancel`);
};

export const requestRefund = async (courseId) => {
  return apiClient.post(`/courses/${courseId}/enroll/refund`);
};
