import { useCallback, useEffect, useState } from "react";
import { assets } from "../../assets/assets";
import Skeleton from "../../components/Skeleton";
import { getInstructorOverview } from "../../services/analyticsService";

const Dashboard = () => {
  const currency = import.meta.env.VITE_CURRENCY || "$";

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getInstructorOverview();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-start justify-between gap-8 md:p-8 md:pb-0 p-4 pt-8 pb-0">
        <div className="space-y-5 w-full max-w-5xl">
          <div className="flex flex-wrap gap-5 items-center">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="shadow-card border border-blue-500 p-4 w-56 rounded-md space-y-3">
                <Skeleton width="2.5rem" height="2.5rem" variant="avatar" />
                <Skeleton width="70%" height="1.5rem" />
                <Skeleton width="90%" height="1rem" />
              </div>
            ))}
          </div>

          <div>
            <Skeleton width="8rem" height="1.25rem" className="mb-4" />
            <div className="flex flex-col max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20 p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4">
                  <Skeleton width="45%" height="1rem" />
                  <Skeleton width="20%" height="1rem" />
                  <Skeleton width="20%" height="1rem" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const totalStudents = courses.reduce((sum, c) => sum + (c.totalEnrollments ?? 0), 0);
  const totalRevenue = courses.reduce((sum, c) => sum + (c.grossRevenue ?? 0), 0) / 100;
  const avgRating = courses.length
    ? courses.reduce((sum, c) => sum + (c.averageRating ?? 0), 0) / courses.length
    : 0;

  return (
    <div className="min-h-screen flex flex-col items-start justify-between gap-8 md:p-8 md:pb-0 p-4 pt-8 pb-0">
      <div className="space-y-5 w-full max-w-5xl">
        <div className="flex flex-wrap gap-5 items-center">
          <div className="flex items-center gap-3 shadow-card border border-blue-500 p-4 w-56 rounded-md">
            <img src={assets.patients_icon} alt="students" />
            <div>
              <p className="text-2xl font-medium text-gray-600">
                {totalStudents}
              </p>
              <p className="text-base text-gray-500">Total Students</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shadow-card border border-blue-500 p-4 w-56 rounded-md">
            <img src={assets.earning_icon} alt="revenue" />
            <div>
              <p className="text-2xl font-medium text-gray-600">
                {currency} {Math.floor(totalRevenue).toLocaleString()}
              </p>
              <p className="text-base text-gray-500">Total Revenue</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shadow-card border border-blue-500 p-4 w-56 rounded-md">
            <img src={assets.star} alt="rating" />
            <div>
              <p className="text-2xl font-medium text-gray-600">
                {avgRating ? avgRating.toFixed(1) : "—"}
              </p>
              <p className="text-base text-gray-500">Avg Rating</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="pb-4 text-lg font-medium">Top Courses</h2>
          <div className="flex flex-col max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
            <table className="table-fixed md:table-auto w-full overflow-hidden">
              <thead className="text-gray-900 border-b border-gray-500/20 text-sm text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Course</th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">Enrollments</th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">Revenue</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-500">
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                      No courses yet.
                    </td>
                  </tr>
                ) : (
                  courses.map((course, index) => (
                    <tr key={course.courseId || index} className="border-b border-gray-500/20">
                      <td className="px-4 py-3 truncate max-w-xs">
                        {course.title}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {course.totalEnrollments ?? 0}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {currency} {Math.floor((course.grossRevenue ?? 0) / 100).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
