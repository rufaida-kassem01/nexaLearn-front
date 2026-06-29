import { useCallback, useContext, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../../components/educator/Navbar";
import Sidebar from "../../components/educator/Sidebar";
import Footer from "../../components/educator/Footer";
import Skeleton from "../../components/Skeleton";
import { AppContext } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import * as instructorService from "../../services/instructorService";

const Educator = () => {
  const { isEducator } = useContext(AppContext);
  const { user } = useAuth();
  const { addToast } = useToast();

  const [applicationStatus, setApplicationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);

  // Fetch application status if user is not yet an educator
  const fetchApplicationStatus = useCallback(async () => {
    if (isEducator || !user?.id) return;
    setLoading(true);
    setError("");
    try {
      const status = await instructorService.getApplicationStatus();
      setApplicationStatus(status);
    } catch (err) {
      // No application yet is fine; status will be null
      setApplicationStatus(null);
    } finally {
      setLoading(false);
    }
  }, [isEducator, user?.id]);

  useEffect(() => {
    fetchApplicationStatus();
  }, [fetchApplicationStatus]);

  const handleApplyInstructor = async () => {
    setApplying(true);
    setError("");
    try {
      await instructorService.applyInstructor();
      addToast("Application submitted! We'll review it shortly.", "success");
      // Re-fetch status to show updated state
      await fetchApplicationStatus();
    } catch (err) {
      const message = err?.response?.data?.message || err.message || "Failed to submit application";
      setError(message);
      addToast(message, "error");
    } finally {
      setApplying(false);
    }
  };

  // If user is already an educator, show the dashboard
  if (isEducator) {
    return (
      <div className="text-default min-h-screen bg-white">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <div className="flex-1">{<Outlet />}</div>
        </div>
        <Footer />
      </div>
    );
  }

  // User is not an educator; show application flow
  const isPending = applicationStatus?.status === "PENDING";
  const isApproved = applicationStatus?.status === "APPROVED";
  const isRejected = applicationStatus?.status === "REJECTED";

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 py-10">
        <div className="max-w-md w-full space-y-6">
          <Skeleton width="70%" height="2rem" className="mx-auto" />
          <Skeleton width="100%" height="1rem" />
          <Skeleton width="90%" height="1rem" />
          <Skeleton width="40%" height="2.5rem" className="mx-auto" />
        </div>
      </div>
    );
  }

  // If application is pending
  if (isPending) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 max-w-md w-full">
          <div className="text-4xl mb-3">⏳</div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Application Pending
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for applying to become an instructor! We're reviewing your application and will notify you once it's approved.
          </p>
          <p className="text-sm text-gray-500">
            Status: <span className="font-medium text-blue-600">PENDING</span>
          </p>
        </div>
      </div>
    );
  }

  // If application is rejected
  if (isRejected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md w-full">
          <div className="text-4xl mb-3">✕</div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Application Not Approved
          </h1>
          <p className="text-gray-600 mb-4">
            {applicationStatus?.rejectionReason
              ? `Reason: ${applicationStatus.rejectionReason}`
              : "Unfortunately, your application was not approved at this time."}
          </p>
          <button
            onClick={handleApplyInstructor}
            disabled={applying}
            className="mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-6 py-2.5 rounded-full transition"
          >
            {applying ? "Submitting..." : "Apply Again"}
          </button>
        </div>
      </div>
    );
  }

  // No application yet; show "Become an Instructor" flow
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-8 max-w-md w-full">
        <div className="text-5xl mb-4">🚀</div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-3">
          Become an Educator
        </h1>
        <p className="text-gray-600 mb-2">
          Unlock the educator dashboard to create courses, manage your content, and track your students.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Your application will be reviewed by our team.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded p-3 mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleApplyInstructor}
          disabled={applying}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-6 py-2.5 rounded-full transition"
        >
          {applying ? "Submitting Application..." : "Apply to Become an Educator"}
        </button>
      </div>
    </div>
  );
};

export default Educator;
