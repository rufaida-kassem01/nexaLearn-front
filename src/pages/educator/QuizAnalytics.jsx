import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Skeleton from "../../components/Skeleton";
import * as analyticsService from "../../services/analyticsService";

const PHASES = { LOADING: "loading", ERROR: "error", EMPTY: "empty", READY: "ready" };

const QuizAnalytics = () => {
  const { courseId } = useParams();
  const [phase, setPhase] = useState(PHASES.LOADING);
  const [error, setError] = useState("");
  const [quizzes, setQuizzes] = useState([]);

  const fetchData = useCallback(async () => {
    if (!courseId) return;
    setPhase(PHASES.LOADING);
    setError("");
    try {
      const data = await analyticsService.getQuizStats(courseId);
      if (!Array.isArray(data) || data.length === 0) {
        setPhase(PHASES.EMPTY);
      } else {
        setQuizzes(data);
        setPhase(PHASES.READY);
      }
    } catch (err) {
      setError(err.message || "Failed to load quiz statistics.");
      setPhase(PHASES.ERROR);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalAttempts = quizzes.reduce((s, q) => s + q.totalAttempts, 0);
  const totalPassed = quizzes.reduce((s, q) => s + q.passedAttempts, 0);
  const avgPassRate = quizzes.length ? totalAttempts > 0 ? (totalPassed / totalAttempts) * 100 : 0 : 0;
  const avgScore = quizzes.length
    ? quizzes.reduce((s, q) => s + q.averageScore, 0) / quizzes.length
    : 0;

  if (phase === PHASES.LOADING) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton width="16rem" height="1.5rem" />
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
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">No quiz data yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <NavBar courseId={courseId} />
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Quiz Statistics</h2>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-xs text-gray-400 mb-1">Total Attempts</p>
          <p className="text-xl font-bold text-gray-800">{totalAttempts}</p>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-xs text-gray-400 mb-1">Avg Pass Rate</p>
          <p className={`text-xl font-bold ${avgPassRate >= 70 ? "text-green-600" : "text-red-500"}`}>
            {avgPassRate.toFixed(1)}%
          </p>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-xs text-gray-400 mb-1">Avg Score</p>
          <p className="text-xl font-bold text-gray-800">{avgScore.toFixed(1)}%</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-2 pr-4">Lesson</th>
              <th className="py-2 pr-4">Quiz</th>
              <th className="py-2 pr-4 text-right">Attempts</th>
              <th className="py-2 pr-4 text-right">Passed</th>
              <th className="py-2 pr-4 text-right">Pass Rate</th>
              <th className="py-2 pr-4 text-right">Avg Score</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((q) => (
              <tr key={q.quizId} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 pr-4 text-gray-600 max-w-xs truncate">{q.lessonTitle}</td>
                <td className="py-2 pr-4 text-gray-700 font-medium">{q.quizTitle}</td>
                <td className="py-2 pr-4 text-right text-gray-600">{q.totalAttempts}</td>
                <td className="py-2 pr-4 text-right text-gray-600">{q.passedAttempts}</td>
                <td className="py-2 pr-4 text-right font-medium">
                  <span className={q.passRate >= 70 ? "text-green-600" : "text-red-500"}>
                    {q.passRate.toFixed(1)}%
                  </span>
                </td>
                <td className="py-2 pr-4 text-right text-gray-600">{q.averageScore.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
      className="text-gray-500 hover:text-gray-700 pb-1"
    >
      Revenue
    </Link>
    <Link
      to={`/educator/course/${courseId}/analytics/quiz-stats`}
      className="text-blue-600 font-medium border-b-2 border-blue-600 pb-1"
    >
      Quiz Stats
    </Link>
  </div>
);

export default QuizAnalytics;
