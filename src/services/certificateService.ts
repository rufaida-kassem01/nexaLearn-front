import type { Certificate } from "../types";
import apiClient from "../utils/apiClient";

const BASE_URL: string = import.meta.env.VITE_API_URL || "";

export const getCourseCertificate = async (courseId: string): Promise<Certificate> => {
  return apiClient.get(`/courses/${courseId}/certificate`);
};

export const verifyCertificate = async (
  code: string,
): Promise<{ valid: boolean; certificate?: Certificate }> => {
  return apiClient.get(`/certificates/${code}/verify`);
};

export const downloadCertificate = async (
  code: string,
  accessToken: string | null,
): Promise<void> => {
  const url = `${BASE_URL}/certificates/${code}/pdf`;
  const res = await fetch(url, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (!res.ok) throw new Error("Failed to download certificate");
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `certificate-${code}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
};
