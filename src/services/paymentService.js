import apiClient from "../utils/apiClient";

export const createPaymentIntent = async (courseId) => {
  return apiClient.post("/payments/intent", { courseId });
};

export const getPaymentStatus = async (paymentIntentId) => {
  return apiClient.get(`/payments/${paymentIntentId}`);
};
