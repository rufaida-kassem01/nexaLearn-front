import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { assets } from "../../assets/assets";
import { verifyEmail, sendVerificationEmail, extractError } from "../../services/authService";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the URL.");
      return;
    }

    setStatus("verifying");

    verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message || "Email verified successfully!");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(extractError(err));
      });
  }, [token]);

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await sendVerificationEmail();
      setStatus("resent");
      setMessage(res.message || "Verification email sent. Please check your inbox.");
    } catch (err) {
      setMessage(extractError(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-cyan-100/70 flex flex-col items-center justify-center px-4">
      <div
        className="flex items-center gap-3 mb-8 cursor-pointer select-none"
        onClick={() => window.location.href = "/"}
      >
        <img src={assets.logo} alt="Logo" className="h-10 w-auto object-contain" />
        <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          NexaLearn
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-custom-card w-full max-w-md px-8 py-10 text-center">
        {status === "verifying" && (
          <>
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Verifying your email…</h2>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Email verified!</h2>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition text-sm"
            >
              Sign in
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Verification failed</h2>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <p className="text-xs text-gray-400 mb-6">
              The link may have expired or is invalid. You can request a new verification email.
            </p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-lg transition text-sm"
            >
              {resending ? "Sending…" : "Resend verification email"}
            </button>
          </>
        )}

        {status === "resent" && (
          <>
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Email sent</h2>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition text-sm"
            >
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
