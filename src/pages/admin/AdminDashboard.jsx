import { useCallback, useEffect, useState } from "react";
import { getDashboard } from "../../services/adminService";

const StatCard = ({ label, value, loading }) => (
  <div className="border border-gray-200 rounded-xl p-5 bg-white">
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="text-2xl font-bold text-gray-900">
      {loading ? (
        <span className="inline-block w-12 h-6 bg-gray-200 rounded animate-pulse" />
      ) : (
        typeof value === "number" && label.toLowerCase().includes("revenue")
          ? `$${(value / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
          : Number(value).toLocaleString()
      )}
    </p>
  </div>
);

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await getDashboard();
      setData(resp.data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-500 text-sm mb-3">{error}</p>
        <button
          onClick={fetchData}
          className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Courses" value={data?.totalCourses} loading={loading} />
        <StatCard label="Total Users" value={data?.totalUsers} loading={loading} />
        <StatCard label="Total Instructors" value={data?.totalInstructors} loading={loading} />
        <StatCard label="Total Revenue" value={data?.totalRevenue} loading={loading} />
      </div>
    </div>
  );
};

export default AdminDashboard;
