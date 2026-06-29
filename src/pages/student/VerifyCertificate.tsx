import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { verifyCertificate } from "../../services/certificateService";
import Footer from "../../components/student/Footer";
import Skeleton from "../../components/Skeleton";

interface CertificateResult {
  valid: boolean;
  holder?: string;
  course?: string;
  issuedAt?: string;
}

const VerifyCertificate = () => {
  const { code } = useParams<{ code: string }>();
  const [result, setResult] = useState<CertificateResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setError("");
    verifyCertificate(code)
      .then(setResult)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to verify certificate.");
      })
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <>
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Certificate Verification
          </h1>

          {loading && (
            <div className="rounded-lg border border-gray-200 p-6 space-y-3">
              <Skeleton width="60%" height="1.5rem" className="mx-auto" />
              <Skeleton width="100%" height="0.9rem" />
              <Skeleton width="80%" height="0.9rem" />
              <Skeleton width="90%" height="0.9rem" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-3">{"\u2715"}</div>
              <p className="text-red-700 font-medium">Verification Failed</p>
              <p className="text-red-500 text-sm mt-1">{error}</p>
            </div>
          )}

          {result && (
            <div
              className={`rounded-lg border p-6 text-center ${
                result.valid
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              {result.valid ? (
                <>
                  <div className="text-5xl mb-3">{"\u2713"}</div>
                  <p className="text-green-700 text-lg font-bold mb-1">
                    Valid Certificate
                  </p>
                  <p className="text-green-600 text-sm">
                    This certificate has been verified and is authentic.
                  </p>

                  <div className="mt-6 space-y-3 text-left bg-white rounded-lg p-4 border border-green-100">
                    {result.holder && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                          Holder
                        </span>
                        <p className="text-sm font-medium text-gray-800">
                          {result.holder}
                        </p>
                      </div>
                    )}
                    {result.course && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                          Course
                        </span>
                        <p className="text-sm font-medium text-gray-800">
                          {result.course}
                        </p>
                      </div>
                    )}
                    {result.issuedAt && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                          Issued
                        </span>
                        <p className="text-sm font-medium text-gray-800">
                          {new Date(result.issuedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-3">{"\u2715"}</div>
                  <p className="text-red-700 text-lg font-bold mb-1">
                    Invalid Certificate
                  </p>
                  <p className="text-red-500 text-sm">
                    No valid certificate matches this verification code.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default VerifyCertificate;
