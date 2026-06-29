import type { PaymentIntentResponse } from "../types";
import apiClient from "../utils/apiClient";

export const createPaymentIntent = async (courseId: string): Promise<PaymentIntentResponse> => {
  return apiClient.post("/payments/intent", { courseId });
};

export const getPaymentStatus = async (
  paymentIntentId: string,
): Promise<{ status: string } & Record<string, unknown>> => {
  return apiClient.get(`/payments/${paymentIntentId}`);
};
