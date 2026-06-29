import { useCallback, useRef, useState } from "react";
import * as tus from "tus-js-client";
import { useToast } from "../../hooks/useToast";
import * as mediaService from "../../services/mediaService";

const VideoUploader = ({ courseId, lessonId, onComplete }) => {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);
  const uploadRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState("idle");

  const isActive = status === "uploading" || status === "finalizing";

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    startUpload(file);
  };

  const startUpload = useCallback(
    async (file) => {
      setStatus("uploading");
      setUploadProgress(0);

      try {
        const { uploadUrl, assetId } = await mediaService.getUploadUrl({
          courseId,
          lessonId,
          fileName: file.name,
        });

        const upload = new tus.Upload(file, {
          endpoint: null,
          uploadUrl,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          chunkSize: 50 * 1024 * 1024,
          onError: (err) => {
            setStatus("error");
            addToast(`Upload failed: ${err.message}`, "error");
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            const pct = Math.round((bytesUploaded / bytesTotal) * 100);
            setUploadProgress(pct);
          },
          onSuccess: () => {
            setStatus("finalizing");
            pollAssetStatus(assetId);
          },
        });

        uploadRef.current = upload;
        upload.start();
      } catch (err) {
        setStatus("error");
        addToast(
          err?.response?.data?.message || err.message || "Failed to start upload.",
          "error"
        );
      }
    },
    [courseId, lessonId, addToast]
  );

  const pollAssetStatus = async (assetId) => {
    let attempts = 0;
    const maxAttempts = 60;
    const poll = async () => {
      attempts++;
      try {
        const asset = await mediaService.getVideoAsset(assetId);
        if (asset.status === "ready" || asset.status === "errored") {
          setStatus(asset.status === "ready" ? "completed" : "error");
          setUploadProgress(100);
          if (asset.status === "ready" && onComplete) {
            onComplete(asset);
          }
          if (asset.status === "errored") {
            addToast(
              asset.failureReason || "Video transcoding failed.",
              "error"
            );
          }
          return;
        }
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setStatus("error");
          addToast("Video processing timed out. Check the library later.", "error");
        }
      } catch {
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        }
      }
    };
    poll();
  };

  const cancelUpload = () => {
    if (uploadRef.current) {
      uploadRef.current.abort();
      uploadRef.current = null;
    }
    setStatus("idle");
    setUploadProgress(0);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-4">
      {status === "idle" || status === "error" ? (
        <div className="text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="video-upload-input"
          />
          <label
            htmlFor="video-upload-input"
            className="inline-flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Select Video File
          </label>
          {status === "error" && (
            <p className="text-red-500 text-xs mt-2">
              Upload failed. Try again.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate font-medium text-gray-700 max-w-[200px]">
              {selectedFile?.name}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {selectedFile ? formatFileSize(selectedFile.size) : ""}
              </span>
              <span className="text-xs text-gray-400">
                {uploadProgress}%
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                status === "error"
                  ? "bg-red-500"
                  : status === "completed"
                    ? "bg-green-500"
                    : "bg-blue-500"
              }`}
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {status === "uploading" && "Uploading to Mux..."}
              {status === "finalizing" && "Waiting for transcoding..."}
              {status === "completed" && "Upload complete!"}
            </span>
            {isActive && (
              <button
                type="button"
                onClick={cancelUpload}
                className="text-xs text-red-500 hover:text-red-700 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
