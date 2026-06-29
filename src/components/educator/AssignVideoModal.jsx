import { useState } from "react";
import { assets } from "../../assets/assets";
import { useToast } from "../../hooks/useToast";
import * as mediaService from "../../services/mediaService";

const AssignVideoModal = ({ asset, chapters, onClose, onAssigned }) => {
  const { addToast } = useToast();
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const currentChapter = chapters.find(
    (c) => c.chapterId === selectedChapterId
  );

  const handleAssign = async () => {
    if (!selectedLessonId) {
      addToast("Please select a lesson.", "error");
      return;
    }

    setAssigning(true);
    try {
      const updatedAsset = await mediaService.assignVideoToLesson(
        asset.id,
        selectedLessonId
      );
      addToast("Video assigned to lesson successfully!", "success");
      if (onAssigned) onAssigned(updatedAsset);
      onClose();
    } catch (err) {
      addToast(
        err?.response?.data?.message ||
          err.message ||
          "Failed to assign video.",
        "error"
      );
    } finally {
      setAssigning(false);
    }
  };

  const isNumericId = (id) => /^\d+$/.test(String(id));

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
      <div className="bg-white text-gray-700 p-6 rounded-lg relative w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Assign Video to Lesson</h2>

        {chapters.length === 0 ? (
          <p className="text-sm text-gray-400">
            No chapters or lessons available. Add chapters and lessons first.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Chapter
              </label>
              <select
                value={selectedChapterId}
                onChange={(e) => {
                  setSelectedChapterId(e.target.value);
                  setSelectedLessonId("");
                }}
                className="w-full border rounded py-1.5 px-2 bg-white text-sm"
              >
                <option value="">Select a chapter</option>
                {chapters.map((c) => (
                  <option key={c.chapterId} value={c.chapterId}>
                    {c.chapterTitle}
                  </option>
                ))}
              </select>
            </div>

            {currentChapter && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Lesson
                </label>
                <select
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="w-full border rounded py-1.5 px-2 bg-white text-sm"
                >
                  <option value="">Select a lesson</option>
                  {currentChapter.chapterContent
                    .filter((l) => isNumericId(l.lectureId))
                    .map((l) => (
                      <option key={l.lectureId} value={l.lectureId}>
                        {l.lectureTitle}
                      </option>
                    ))}
                </select>
                {currentChapter.chapterContent.filter((l) =>
                  isNumericId(l.lectureId)
                ).length === 0 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Save the course first to enable lesson assignment.
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              disabled={!selectedLessonId || assigning}
              onClick={handleAssign}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 rounded text-sm transition"
            >
              {assigning ? "Assigning..." : "Assign Video"}
            </button>
          </div>
        )}

        <img
          onClick={onClose}
          src={assets.cross_icon}
          className="absolute top-4 right-4 w-4 cursor-pointer"
          alt=""
        />
      </div>
    </div>
  );
};

export default AssignVideoModal;
