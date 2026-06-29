import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import Skeleton from "../../components/Skeleton";
import ConfirmDialog from "../../components/ConfirmDialog";
import { getInstructorOverview } from "../../services/analyticsService";
import { publishCourse, deleteCourse } from "../../services/courseService";

const MyCourses = () => {
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, courseId: null, courseTitle: "" });
  const [deleting, setDeleting] = useState(false);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getInstructorOverview();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handlePublish = async (courseId) => {
    setPublishing((prev) => ({ ...prev, [courseId]: true }));
    try {
      await publishCourse(courseId);
      setCourses((prev) =>
        prev.map((c) => (c.courseId === courseId ? { ...c, status: "PUBLISHED" } : c)),
      );
    } catch (err) {
      setError(err.message || "Failed to publish course.");
    } finally {
      setPublishing((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const openDeleteConfirm = (courseId, courseTitle) => {
    setDeleteConfirm({ isOpen: true, courseId, courseTitle });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm({ isOpen: false, courseId: null, courseTitle: "" });
  };

  const handleDelete = async () => {
    const { courseId, courseTitle } = deleteConfirm;
    setDeleting(true);
    try {
      await deleteCourse(courseId);
      setCourses((prev) => prev.filter((c) => c.courseId !== courseId));
      addToast(`Course "${courseTitle}" deleted successfully.`, "success");
      closeDeleteConfirm();
    } catch (err) {
      addToast(err.message || "Failed to delete course.", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0">
        <div className="w-full">
          <Skeleton width="8rem" height="1.25rem" className="mb-4" />
          <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20 p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 w-full">
                <Skeleton width="30%" height="1rem" />
                <Skeleton width="15%" height="1rem" />
                <Skeleton width="10%" height="1rem" />
                <Skeleton width="10%" height="1rem" />
                <Skeleton width="15%" height="1rem" />
                <Skeleton width="15%" height="1rem" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchCourses}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0">
      <div className="w-full">
        <h2 className="pb-4 text-lg font-medium">My Courses</h2>
        <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
          <table className="md:table-auto table-fixed w-full overflow-hidden">
            <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left">
              <tr>
                <th className="px-4 py-3 font-semibold truncate">Course</th>
                <th className="px-4 py-3 font-semibold truncate">Price</th>
                <th className="px-4 py-3 font-semibold truncate">Students</th>
                <th className="px-4 py-3 font-semibold truncate">Rating</th>
                <th className="px-4 py-3 font-semibold truncate">Status</th>
                <th className="px-4 py-3 font-semibold truncate" colSpan={4}>Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-500">
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                    No courses found.
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.courseId} className="border-b border-gray-500/20">
                    <td className="md:px-4 pl-2 md:pl-4 py-3 truncate font-medium text-gray-700">
                      {course.title}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600">—</span>
                    </td>
                    <td className="px-4 py-3">{course.totalEnrollments ?? 0}</td>
                    <td className="px-4 py-3">
                      {course.averageRating != null ? course.averageRating.toFixed(1) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          course.status === "PUBLISHED"
                            ? "bg-green-100 text-green-700"
                            : course.status === "DRAFT"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {course.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/educator/course/${course.courseId}/analytics/lessons`)}
                        className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded transition"
                      >
                        Analytics
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/educator/edit-course/${course.courseId}`)}
                        className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded transition"
                      >
                        Edit
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {course.status !== "PUBLISHED" && (
                        <button
                          onClick={() => handlePublish(course.courseId)}
                          disabled={publishing[course.courseId]}
                          className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-3 py-1 rounded transition"
                        >
                          {publishing[course.courseId] ? "…" : "Publish"}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDeleteConfirm(course.courseId, course.title)}
                        className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteConfirm.courseTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={deleting}
        onConfirm={handleDelete}
        onCancel={closeDeleteConfirm}
      />
    </div>
  );
};

export default MyCourses;
