import { useCallback, useEffect, useState } from "react";
import { useToast } from "../../hooks/useToast";
import {
  listApplications,
  approveApplication,
  rejectApplication,
} from "../../services/instructorService";

const STATUS_TABS = ["ALL", "PENDING", "APPROVED", "REJECTED"];

const statusBadge = (status) => {
  const styles = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}
    >
      {status}
    </span>
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const RejectModal = ({ open, loading, onClose, onConfirm }) => {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Reject Application
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Provide a reason for rejection. This will be visible to the applicant.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter rejection reason..."
          rows={4}
          className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading || !reason.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ApplicationCard = ({ app, onApprove, onReject }) => {
  const [expanded, setExpanded] = useState(false);
  const user = app.user || {};
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Unknown";

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {user.profilePictureUrl ? (
            <img
              src={user.profilePictureUrl}
              alt=""
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm flex-shrink-0">
              {(user.firstName?.[0] || user.email?.[0] || "?").toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {statusBadge(app.status)}
          <span className="text-gray-400 text-sm">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Submitted</p>
              <p className="text-gray-900">{formatDate(app.submittedAt)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Reviewed</p>
              <p className="text-gray-900">{formatDate(app.reviewedAt)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">User ID</p>
              <p className="text-gray-900 text-xs truncate" title={app.userId}>
                {app.userId}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Application ID</p>
              <p className="text-gray-900 text-xs truncate" title={app.id}>
                {app.id}
              </p>
            </div>
          </div>

          {app.rejectionReason && (
            <div>
              <p className="text-gray-500 text-xs">Rejection Reason</p>
              <p className="text-sm text-gray-900 bg-red-50 rounded-lg p-2.5 mt-1">
                {app.rejectionReason}
              </p>
            </div>
          )}

          {app.status === "PENDING" && (
            <div className="flex gap-3 pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove(app.id);
                }}
                className="flex-1 px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
              >
                Approve
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReject(app.id);
                }}
                className="flex-1 px-4 py-2 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const InstructorApplications = () => {
  const { showToast } = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("PENDING");
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const status = activeTab === "ALL" ? undefined : activeTab;
      const resp = await listApplications(status);
      setApplications(resp.data.applications || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await approveApplication(id);
      showToast("Application approved successfully", "success");
      fetchApps();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to approve application", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason) => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await rejectApplication(rejectTarget, reason);
      showToast("Application rejected", "success");
      setRejectTarget(null);
      fetchApps();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to reject application", "error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Instructor Applications
      </h1>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-sm rounded-md transition ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm font-medium"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-red-500 text-sm mb-3">{error}</p>
          <button
            onClick={fetchApps}
            className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !error && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-xl p-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && applications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-lg font-medium">No applications found</p>
          <p className="text-sm mt-1">
            {activeTab === "ALL"
              ? "No instructor applications have been submitted yet."
              : `No ${activeTab.toLowerCase()} applications to review.`}
          </p>
        </div>
      )}

      {/* Application cards */}
      {!loading && !error && applications.length > 0 && (
        <div className="space-y-3">
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              onApprove={handleApprove}
              onReject={setRejectTarget}
            />
          ))}
        </div>
      )}

      {/* Reject modal */}
      <RejectModal
        open={!!rejectTarget}
        loading={actionLoading}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
      />
    </div>
  );
};

export default InstructorApplications;
