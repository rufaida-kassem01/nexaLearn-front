import type { PaginatedResponse, UploadUrlResponse, VideoAsset, VideoAssetStatus } from "../types";
import apiClient from "../utils/apiClient";

interface GetUploadUrlParams {
  courseId: string;
  lessonId: string;
  fileName: string;
}

export const getUploadUrl = async (params: GetUploadUrlParams): Promise<UploadUrlResponse> => {
  return apiClient.post("/instructor/video-assets/upload-url", {
    courseId: params.courseId,
    lessonId: params.lessonId,
    fileName: params.fileName,
  });
};

export const getVideoAsset = async (assetId: string): Promise<VideoAsset> => {
  return apiClient.get(`/instructor/video-assets/${assetId}`);
};

export const listVideoAssets = async (
  courseId: string,
  params: { cursor?: string; limit?: number } = {},
): Promise<VideoAsset[]> => {
  return apiClient.get("/instructor/video-assets", {
    params: { courseId, cursor: params.cursor, limit: params.limit },
  });
};

export const assignVideoToLesson = async (
  assetId: string,
  lessonId: string,
): Promise<VideoAsset> => {
  return apiClient.post(`/instructor/video-assets/${assetId}/assign-to-lesson`, { lessonId });
};

export const UPLOAD_STATUS: Record<string, VideoAssetStatus> = {
  WAITING: "waiting",
  UPLOADING: "uploading",
  UPLOADED: "uploaded",
  PROCESSING: "processing",
  READY: "ready",
  ERROR: "errored",
};
