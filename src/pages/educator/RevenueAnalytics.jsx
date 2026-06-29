import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Skeleton from "../../components/Skeleton";
import * as analyticsService from "../../services/analyticsService";

const PHASES = { LOADING: "loading", ERROR: "error", EMPTY: "empty", READY: "ready" };
const CURRENT_YEAR = new Date().getFullYear();

const RevenueAnalytics = () => {
  const { courseId } = useParams();
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const [phase, setPhase] = useState(PHASES.LOADING);
  const [error, setError] = useState("");
  const [revenue, setRevenue] = useState(null);
  const [year, setYear] = useState(CURRENT_YEAR);

  const fetchData = useCallback(async () => {
    if (!courseId) return;
    setPhase(PHASES.LOADING);
    setError("");
    try {
      const data = await analyticsService.getRevenueBreakdown(courseId, { year });
      if (!data || data.totalGross === 0) {
        setPhase(PHASES.EMPTY);
      } else {
        setRevenue(data);
        setPhase(PHASES.READY);
      }
    } catch (err) {
      setError(err.message || "Failed to load revenue data.");
      setPhase(PHASES.ERROR);
    }
  }, [courseId, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fmtCents = (cents) => `${currency}${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const maxMonthly = revenue?.monthly?.length
    ? Math.max(...revenue.monthly.map((m) => m.netRevenue), 1)
    : 1;

  if (phase === PHASES.LOADING) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton width="16rem" height="1.5rem" />
        <Skeleton width="8rem" height="2rem" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width="100%" height="5rem" />
          ))}
        </div>
        <Skeleton width="100%" height="12rem" />
      </div>
    );
  }

  if (phase === PHASES.ERROR) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (phase === PHASES.EMPTY) {
    return (
      <div className="p-8">
        <NavBar courseId={courseId} />
        <YearSelector year={year} onChange={setYear} />
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">No revenue data yet for this period.</p>
        </div>
      </div>
    );
  }

  const feePercent = revenue.platformFeeRate != null ? Math.round(revenue.platformFeeRate * 100) : 20;

  return (
    <div className="p-8">
      <NavBar courseId={courseId} />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Revenue</h2>
        <YearSelector year={year} onChange={setYear} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-xs text-gray-400 mb-1">Gross Revenue</p>
          <p className="text-xl font-bold text-gray-800">{fmtCents(revenue.totalGross)}</p>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-xs text-gray-400 mb-1">Refunds</p>
          <p className="text-xl font-bold text-red-500">{fmtCents(revenue.totalRefunds)}</p>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-xs text-gray-400 mb-1">Net Revenue (after {feePercent}% fee)</p>
          <p className="text-xl font-bold text-green-600">{fmtCents(revenue.totalNet)}</p>
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-white">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Breakdown</h3>
        {revenue.monthly.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No monthly data.</p>
        ) : (
          <div className="space-y-2">
            {revenue.monthly.map((m) => (
              <div key={m.month} className="flex items-center gap-3 text-sm">
                <span className="w-16 text-gray-500 font-mono text-xs">{m.month}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded relative overflow-hidden">
                  <div
                    className="h-full bg-green-400 rounded transition-all"
                    style={{ width: `${(m.netRevenue / maxMonthly) * 100}%` }}
                  />
                  <div
                    className="h-full bg-red-300 rounded absolute top-0 transition-all"
                    style={{
                      width: `${((m.refunds || 0) / maxMonthly) * 100}%`,
                      opacity: 0.6,
                    }}
                  />
                </div>
                <span className="w-20 text-right text-gray-600 font-mono text-xs">
                  {fmtCents(m.netRevenue)}
                </span>
                <span className="w-8 text-right text-gray-400 text-[10px]">
                  {m.enrollments}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-4 mt-2 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded inline-block" /> Net
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-red-300 rounded inline-block" /> Refunds
          </span>
          <span>Enrollments (right)</span>
        </div>
      </div>
    </div>
  );
};

const YearSelector = ({ year, onChange }) => {
  const years = [];
  for (let y = CURRENT_YEAR; y >= CURRENT_YEAR - 5; y--) years.push(y);
  return (
    <select
      value={year}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="border rounded py-1 px-2 text-sm bg-white"
    >
      {years.map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  );
};

const NavBar = ({ courseId }) => (
  <div className="flex items-center gap-4 mb-6 text-sm">
    <Link
      to={`/educator/course/${courseId}/analytics/lessons`}
      className="text-gray-500 hover:text-gray-700 pb-1"
    >
      Lessons
    </Link>
    <Link
      to={`/educator/course/${courseId}/analytics/revenue`}
      className="text-blue-600 font-medium border-b-2 border-blue-600 pb-1"
    >
      Revenue
    </Link>
    <Link
      to={`/educator/course/${courseId}/analytics/quiz-stats`}
      className="text-gray-500 hover:text-gray-700 pb-1"
    >
      Quiz Stats
    </Link>
  </div>
);

export default RevenueAnalytics;
