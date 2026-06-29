import apiClient from "../utils/apiClient";

const BASE_URL = import.meta.env.VITE_API_URL || "";

export const getCourseCertificate = async (courseId) => {
  return apiClient.get(`/courses/${courseId}/certificate`);
};

export const verifyCertificate = async (code) => {
  return apiClient.get(`/certificates/${code}/verify`);
};

export const downloadCertificate = async (code, accessToken) => {
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
