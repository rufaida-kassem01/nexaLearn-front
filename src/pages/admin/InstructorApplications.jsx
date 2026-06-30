import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { listApplications } from "../../services/adminService";

const STATUSES = ["ALL", "PENDING", "APPROVED", "REJECTED"];

const statusBadge = (status) => {
  const map = {
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${map[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
};

const InstructorApplications = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeStatus = searchParams.get("status") || "PENDING";
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetch = useCallback(async (status) => {
    setLoading(true);
    setError("");
    try {
      const resp = await listApplications(status === "ALL" ? undefined : status);
      setApplications(resp.applications ?? []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(activeStatus);
  }, [activeStatus, fetch]);

  const handleTabClick = (status) => {
    setSearchParams(status === "PENDING" ? {} : { status });
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Instructor Applications</h1>

      <div className="flex gap-2 mb-6">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => handleTabClick(s)}
            className={`text-sm px-4 py-1.5 rounded-full transition-colors ${
              activeStatus === s
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500 text-sm mb-3">{error}</p>
          <button
            onClick={() => fetch(activeStatus)}
            className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && applications.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">No instructor applications found.</p>
        </div>
      )}

      {!loading && !error && applications.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 pr-4 font-medium">Applicant</th>
                <th className="pb-3 pr-4 font-medium">Email</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Submitted</th>
                <th className="pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600 shrink-0">
                        {app.user?.firstName?.[0]}{app.user?.lastName?.[0]}
                      </div>
                      <span className="text-gray-800 font-medium">
                        {app.user?.firstName} {app.user?.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-500">{app.user?.email}</td>
                  <td className="py-3 pr-4">{statusBadge(app.status)}</td>
                  <td className="py-3 pr-4 text-gray-500">
                    {new Date(app.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() =>
                        navigate(`/admin/instructor-applications/${app.id}`, {
                          state: { application: app },
                        })
                      }
                      className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InstructorApplications;
