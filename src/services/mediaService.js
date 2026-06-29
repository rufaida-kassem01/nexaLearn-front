import apiClient from "../utils/apiClient";

export const getUploadUrl = async ({ courseId, lessonId, fileName }) => {
  return apiClient.post("/instructor/video-assets/upload-url", {
    courseId,
    lessonId,
    fileName,
  });
};

export const getVideoAsset = async (assetId) => {
  return apiClient.get(`/instructor/video-assets/${assetId}`);
};

export const listVideoAssets = async (courseId, { cursor, limit } = {}) => {
  return apiClient.get("/instructor/video-assets", {
    params: { courseId, cursor, limit },
  });
};

export const assignVideoToLesson = async (assetId, lessonId) => {
  return apiClient.post(
    `/instructor/video-assets/${assetId}/assign-to-lesson`,
    { lessonId }
  );
};

export const UPLOAD_STATUS = {
  WAITING: "waiting",
  UPLOADING: "uploading",
  UPLOADED: "uploaded",
  PROCESSING: "processing",
  READY: "ready",
  ERROR: "errored",
};
