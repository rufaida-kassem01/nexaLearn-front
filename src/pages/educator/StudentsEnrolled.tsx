import { useCallback, useEffect, useState } from "react";
import { assets } from "../../assets/assets";
import Skeleton from "../../components/Skeleton";
import { getInstructorStudents } from "../../services/analyticsService";

interface StudentRecord {
  id?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  courseTitle?: string;
  enrolledAt?: string;
  progressPercentage?: number;
  enrollmentStatus?: string;
}

const PAGE_SIZE = 20;

const StudentsEnrolled = () => {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const fetchStudents = useCallback(async (courseId: string, pageNum: number, append = false) => {
    if (!courseId) {
      setStudents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await getInstructorStudents(courseId, { page: pageNum, limit: PAGE_SIZE });
      const list: StudentRecord[] = Array.isArray(data) ? data : (data.students ?? []);
      setStudents((prev) => (append ? [...prev, ...list] : list));
      setHasMore(list.length >= PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load students.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents(selectedCourseId, 1);
  }, [fetchStudents, selectedCourseId]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchStudents(selectedCourseId, next, true);
  };

  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-start gap-6 md:p-8 md:pb-0 p-4 pt-8 pb-0">
        <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20 p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 w-full">
              <Skeleton width="2.5rem" height="2.5rem" variant="avatar" />
              <Skeleton width="35%" height="1rem" />
              <Skeleton width="20%" height="1rem" />
              <Skeleton width="15%" height="1rem" />
              <Skeleton width="15%" height="1rem" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-start gap-6 md:p-8 md:pb-0 p-4 pt-8 pb-0">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
        <table className="table-fixed md:table-auto w-full overflow-hidden pb-4">
          <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell">#</th>
              <th className="px-4 py-3 font-semibold">Student</th>
              <th className="px-4 py-3 font-semibold hidden sm:table-cell">Course</th>
              <th className="px-4 py-3 font-semibold hidden sm:table-cell">Enrolled</th>
              <th className="px-4 py-3 font-semibold">Progress</th>
              <th className="px-4 py-3 font-semibold hidden sm:table-cell">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-500">
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No students enrolled yet.
                </td>
              </tr>
            ) : (
              students.map((student, index) => (
                <tr key={student.id || student.userId || index} className="border-b border-gray-500/20">
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    {index + 1}
                  </td>
                  <td className="md:px-4 px-2 py-3 flex items-center space-x-3">
                    <img src={assets.user_icon} alt="" className="w-9 h-9 rounded-full" />
                    <span className="truncate">
                      {student.firstName
                        ? `${student.firstName} ${student.lastName || ""}`.trim()
                        : student.username || "Unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-3 truncate hidden sm:table-cell">
                    {student.courseTitle || "\u2014"}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {student.enrolledAt
                      ? new Date(student.enrolledAt).toLocaleDateString()
                      : "\u2014"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${student.progressPercentage ?? 0}%` }}
                        />
                      </div>
                      <span>{Math.round(student.progressPercentage ?? 0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        student.enrollmentStatus === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : student.enrollmentStatus === "CANCELLED"
                            ? "bg-red-100 text-red-600"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {student.enrollmentStatus || "ACTIVE"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {loading && students.length > 0 && (
          <div className="w-full py-4 text-center text-sm text-gray-400">
            Loading\u2026
          </div>
        )}

        {hasMore && !loading && (
          <button
            onClick={loadMore}
            className="w-full py-3 text-sm text-blue-600 hover:bg-gray-50 border-t border-gray-200"
          >
            Load more students
          </button>
        )}
      </div>
    </div>
  );
};

export default StudentsEnrolled;
