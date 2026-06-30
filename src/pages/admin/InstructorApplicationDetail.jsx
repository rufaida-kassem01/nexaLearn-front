import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { listApplications, approveApplication, rejectApplication } from "../../services/adminService";
import { useToast } from "../../hooks/useToast";

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

const InstructorApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const [application, setApplication] = useState(location.state?.application ?? null);
  const [loading, setLoading] = useState(!application);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchApplication = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await listApplications();
      const found = (resp.applications ?? []).find((a) => a.id === id);
      if (!found) {
        setError("Application not found.");
      } else {
        setApplication(found);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load application.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!application) fetchApplication();
  }, [application, fetchApplication]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await approveApplication(id);
      addToast("Application approved!", "success");
      navigate("/admin/instructor-applications");
    } catch (err) {
      addToast(err?.response?.data?.message || err.message || "Failed to approve.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await rejectApplication(id, rejectReason.trim());
      addToast("Application rejected.", "success");
      navigate("/admin/instructor-applications");
    } catch (err) {
      addToast(err?.response?.data?.message || err.message || "Failed to reject.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const app = application;

  if (loading) {
    return (
      <div>
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-500 text-sm mb-3">{error}</p>
        <div className="flex gap-2">
          <button
            onClick={fetchApplication}
            className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Retry
          </button>
          <button
            onClick={() => navigate("/admin/instructor-applications")}
            className="text-sm px-4 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  if (!app) return null;

  return (
    <div>
      <button
        onClick={() => navigate("/admin/instructor-applications")}
        className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center gap-1 transition"
      >
        &larr; Back to Applications
      </button>

      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Application Review</h1>

      <div className="border border-gray-200 rounded-xl p-6 bg-white space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-600 shrink-0">
            {app.user?.firstName?.[0]}{app.user?.lastName?.[0]}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {app.user?.firstName} {app.user?.lastName}
            </p>
            <p className="text-sm text-gray-500">{app.user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Status:</span>
          {statusBadge(app.status)}
        </div>

        <div className="text-sm text-gray-500">
          Submitted: {new Date(app.submittedAt).toLocaleString()}
        </div>

        {app.reviewedAt && (
          <div className="text-sm text-gray-500">
            Reviewed: {new Date(app.reviewedAt).toLocaleString()}
          </div>
        )}

        {app.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason</p>
            <p className="text-sm text-red-700">{app.rejectionReason}</p>
          </div>
        )}
      </div>

      {app.status === "PENDING" && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? "…" : "Approve"}
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={actionLoading}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reject
          </button>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4 w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reject Application</h3>
            <p className="text-sm text-gray-600 mb-4">
              Provide a reason for rejecting this application. The applicant will see this message.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-400 resize-none mb-4"
              placeholder="Enter rejection reason..."
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "…" : "Submit Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorApplicationDetail;
