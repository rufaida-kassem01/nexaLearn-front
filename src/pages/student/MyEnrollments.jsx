import { Line } from "rc-progress";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMyEnrollments, requestRefund } from "../../services/enrollmentService";
import { getCourse } from "../../services/courseService";
import {
  getCourseCertificate,
  downloadCertificate,
} from "../../services/certificateService";
import { useToast } from "../../hooks/useToast";
import Footer from "../../components/student/Footer";
import RefundModal from "../../components/student/RefundModal";
import Skeleton from "../../components/Skeleton";

const MyEnrollments = () => {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [enrollmentByCourseId, setEnrollmentByCourseId] = useState({});
  const [certByCourseId, setCertByCourseId] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(null);
  const [refundCourseId, setRefundCourseId] = useState(null);
  const [refundCourseTitle, setRefundCourseTitle] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const enrollments = await getMyEnrollments();
      const list = Array.isArray(enrollments) ? enrollments : [];
      const active = list.filter((e) => e.status === "ACTIVE");

      if (active.length === 0) {
        setCourses([]);
        setEnrollmentByCourseId({});
        setLoading(false);
        return;
      }

      const enrollmentMap = {};
      active.forEach((e) => {
        enrollmentMap[e.courseId] = e;
      });
      setEnrollmentByCourseId(enrollmentMap);

      const courseResults = await Promise.allSettled(
        active.map((e) => getCourse(e.courseId)),
      );
      const resolved = courseResults
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value);

      setCourses(resolved);

      const certResults = await Promise.allSettled(
        active.map((e) => getCourseCertificate(e.courseId)),
      );
      const certMap = {};
      certResults.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value) {
          certMap[active[i].courseId] = r.value;
        }
      });
      setCertByCourseId(certMap);
    } catch (err) {
      setError(err.message || "Failed to load enrollments.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefund = async (reason) => {
    if (!refundCourseId) return;
    setRefundLoading(true);
    try {
      await requestRefund(refundCourseId);
      setEnrollmentByCourseId((prev) => ({
        ...prev,
        [refundCourseId]: { ...prev[refundCourseId], status: "REFUNDED" },
      }));
      setRefundCourseId(null);
      setRefundCourseTitle("");
      toast.success("Refund requested. Your enrollment will be updated shortly.");
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Refund request failed.");
    } finally {
      setRefundLoading(false);
    }
  };

  const handleDownload = async (courseId) => {
    const cert = certByCourseId[courseId];
    if (!cert) return;
    setDownloading(courseId);
    try {
      await downloadCertificate(cert.verificationCode, accessToken);
    } catch {
      // download failed silently
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <>
        <div className="md:px-36 px-8 pt-10">
          <Skeleton width="12rem" height="1.75rem" className="mb-8" />
          <div className="mt-10 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-4">
                  <Skeleton width="5rem" height="4rem" className="rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="70%" height="1rem" />
                    <Skeleton width="100%" height="0.85rem" />
                    <Skeleton width="40%" height="0.85rem" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const calculateCourseDuration = (course) => {
    if (!Array.isArray(course?.modules)) return "0 minutes";
    const totalSeconds = course.modules.reduce((sum, mod) => {
      if (!Array.isArray(mod.lessons)) return sum;
      return sum + mod.lessons.reduce((s, l) => s + (l.durationSecs || 0), 0);
    }, 0);
    return `${Math.round(totalSeconds / 60)} min`;
  };

  const calculateNoOfLectures = (course) => {
    if (!Array.isArray(course?.modules)) return 0;
    return course.modules.reduce(
      (sum, mod) => sum + (Array.isArray(mod.lessons) ? mod.lessons.length : 0),
      0,
    );
  };

  return (
    <>
      <div className="md:px-36 px-8 pt-10">
        <h1 className="text-2xl font-semibold">My Enrollments</h1>

        {courses.length === 0 ? (
          <p className="text-gray-400 mt-10 text-center">You are not enrolled in any courses yet.</p>
        ) : (
          <table className="md:table-auto table-fixed w-full overflow-hidden border border-gray-500/20 mt-10">
            <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left max-sm:hidden">
              <tr>
                <th className="px-4 py-3 font-semibold truncate">Course</th>
                <th className="px-4 py-3 font-semibold truncate">Duration</th>
                <th className="px-4 py-3 font-semibold truncate">Progress</th>
                <th className="px-4 py-3 font-semibold truncate">Status</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {courses.map((course) => {
                const enrollment = enrollmentByCourseId[course.id];
                const percent = enrollment?.progressPercent ?? 0;
                const isCompleted = percent >= 100;
                const hasCert = certByCourseId[course.id];
                const lessonCount = calculateNoOfLectures(course);

                return (
                  <tr key={course.id} className="border-b border-gray-500/20">
                    <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3">
                      <img
                        src={course.thumbnailUrl}
                        alt=""
                        className="w-14 sm:w-24 md:w-28"
                      />
                      <div className="flex-1">
                        <p className="mb-1 max-sm:text-sm">{course.title}</p>
                        <Line
                          strokeWidth={2}
                          percent={percent}
                          className="bg-gray-300 rounded-full"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 max-sm:hidden">
                      {calculateCourseDuration(course)}
                    </td>
                    <td className="px-4 py-3 max-sm:hidden">
                      {lessonCount > 0
                        ? `${Math.round(percent)}% (${Math.round((percent / 100) * lessonCount)}/${lessonCount})`
                        : `${Math.round(percent)}%`}
                    </td>
                    <td className="px-4 py-3 max-sm:text-right space-y-1">
                      {hasCert ? (
                        <button
                          onClick={() => handleDownload(course.id)}
                          disabled={downloading === course.id}
                          className="px-3 sm:px-5 py-1.5 sm:py-2 bg-green-600 max-sm:text-xs text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {downloading === course.id ? "Downloading…" : "Download Certificate"}
                        </button>
                      ) : (
                        <button
                          className="px-3 sm:px-5 py-1.5 sm:py-2 bg-blue-600 max-sm:text-xs text-white rounded"
                          onClick={() => {
                            const path = enrollment?.lastAccessedLessonId
                              ? `/player/${course.id}/${enrollment.lastAccessedLessonId}`
                              : `/player/${course.id}`;
                            navigate(path);
                          }}
                        >
                          {isCompleted ? "Review" : "Continue"}
                        </button>
                      )}
                      {enrollment?.status === "ACTIVE" && !course.isFree && Number(course.basePrice) > 0 && (
                        <button
                          onClick={() => {
                            setRefundCourseId(course.id);
                            setRefundCourseTitle(course.title);
                          }}
                          className="block text-xs text-red-500 hover:text-red-700 hover:underline"
                        >
                          Request Refund
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {refundCourseId && (
        <RefundModal
          courseTitle={refundCourseTitle}
          onConfirm={handleRefund}
          onCancel={() => { setRefundCourseId(null); setRefundCourseTitle(""); }}
          isLoading={refundLoading}
        />
      )}

      <Footer />
    </>
  );
};

export default MyEnrollments;
