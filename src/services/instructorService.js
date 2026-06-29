import apiClient from "../utils/apiClient";

export const applyInstructor = async (data = {}) => {
  return apiClient.post("/instructor/apply", data);
};

export const getApplicationStatus = async () => {
  return apiClient.get("/instructor/application/status");
};
