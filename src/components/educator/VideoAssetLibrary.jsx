import { useCallback, useEffect, useState } from "react";
import { assets } from "../../assets/assets";
import { useToast } from "../../hooks/useToast";
import * as mediaService from "../../services/mediaService";
import AssignVideoModal from "./AssignVideoModal";
import VideoUploader from "./VideoUploader";

const ASSET_STATUS_STYLES = {
  waiting: "bg-yellow-100 text-yellow-700",
  uploading: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  ready: "bg-green-100 text-green-700",
  errored: "bg-red-100 text-red-700",
};

const VideoAssetLibrary = ({ courseId, chapters, onAssetAssigned }) => {
  const { addToast } = useToast();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [poller, setPoller] = useState(null);

  const fetchAssets = useCallback(async () => {
    try {
      const data = await mediaService.listVideoAssets(courseId);
      setAssets(data.items || []);
    } catch {
      // Silently fail; assets may be empty for new courses
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) fetchAssets();
  }, [courseId, fetchAssets]);

  useEffect(() => {
    const hasProcessing = assets.some(
      (a) => a.status === "waiting" || a.status === "processing"
    );
    if (hasProcessing && !poller) {
      const id = setInterval(() => {
        fetchAssets();
      }, 5000);
      setPoller(id);
    } else if (!hasProcessing && poller) {
      clearInterval(poller);
      setPoller(null);
    }
    return () => {
      if (poller) clearInterval(poller);
    };
  }, [assets, poller, fetchAssets]);

  const handleUploadComplete = (asset) => {
    setShowUploader(false);
    setAssets((prev) => [asset, ...prev]);
    addToast("Video uploaded successfully! Transcoding in progress.", "success");
  };

  const handleAssign = (asset) => {
    if (asset.status !== "ready") {
      addToast("Video must be in READY status before assigning.", "error");
      return;
    }
    setAssignTarget(asset);
  };

  const handleAssigned = (updatedAsset) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a))
    );
    if (onAssetAssigned) onAssetAssigned(updatedAsset);
  };

  const formatDuration = (secs) => {
    if (!secs) return null;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-700">
          Video Library
        </h3>
        <button
          type="button"
          onClick={() => setShowUploader(!showUploader)}
          className="flex items-center gap-1 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          {showUploader ? "Close" : "Upload Video"}
        </button>
      </div>

      {showUploader && (
        <VideoUploader
          courseId={courseId}
          onComplete={handleUploadComplete}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500 border-dashed rounded-full animate-spin" />
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-8">
          <img
            src={assets.upload_area}
            alt=""
            className="w-16 mx-auto opacity-40 mb-2"
          />
          <p className="text-sm text-gray-400">No videos uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow transition"
            >
              <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                {asset.thumbnailUrl ? (
                  <img
                    src={asset.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-10 h-10 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
                {asset.durationSecs && (
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {formatDuration(asset.durationSecs)}
                  </span>
                )}
              </div>
              <div className="p-3 space-y-2">
                <span
                  className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded ${
                    ASSET_STATUS_STYLES[asset.status] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {asset.status}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <span>{formatDate(asset.createdAt)}</span>
                  {asset.provider && (
                    <>
                      <span>·</span>
                      <span>{asset.provider}</span>
                    </>
                  )}
                </div>
                {asset.lessonId && (
                  <p className="text-[10px] text-gray-400 truncate">
                    Lesson: {asset.lessonId}
                  </p>
                )}
                {asset.failureReason && (
                  <p className="text-[10px] text-red-500 truncate">
                    {asset.failureReason}
                  </p>
                )}
                <button
                  type="button"
                  disabled={asset.status !== "ready"}
                  onClick={() => handleAssign(asset)}
                  className={`w-full text-xs py-1.5 rounded transition ${
                    asset.status === "ready"
                      ? "bg-gray-800 hover:bg-black text-white"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {asset.status === "ready"
                    ? asset.lessonId
                      ? "Reassign"
                      : "Assign to Lesson"
                    : "Processing..."}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {assignTarget && (
        <AssignVideoModal
          asset={assignTarget}
          chapters={chapters}
          onClose={() => setAssignTarget(null)}
          onAssigned={handleAssigned}
        />
      )}
    </div>
  );
};

export default VideoAssetLibrary;
