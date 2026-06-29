import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Skeleton from "../../components/Skeleton";
import * as analyticsService from "../../services/analyticsService";

interface LessonEngagementRow {
  lessonId: string;
  orderIndex: number;
  title: string;
  viewCount: number;
  completionCount: number;
  completionRate: number | null;
  avgWatchSeconds: number | null;
  dropoffRate: number | null;
  quizPassRate: number | null;
  hasQuiz: boolean;
}

const PHASES = { LOADING: "loading", ERROR: "error", EMPTY: "empty", READY: "ready" } as const;
type Phase = (typeof PHASES)[keyof typeof PHASES];

const LessonAnalytics = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [phase, setPhase] = useState<Phase>(PHASES.LOADING);
  const [error, setError] = useState("");
  const [lessons, setLessons] = useState<LessonEngagementRow[]>([]);

  const fetchData = useCallback(async () => {
    if (!courseId) return;
    setPhase(PHASES.LOADING);
    setError("");
    try {
      const data = await analyticsService.getLessonEngagement(courseId);
      if (!Array.isArray(data) || data.length === 0) {
        setPhase(PHASES.EMPTY);
      } else {
        setLessons(data);
        setPhase(PHASES.READY);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lesson analytics.");
      setPhase(PHASES.ERROR);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (phase === PHASES.LOADING) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton width="16rem" height="1.5rem" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton width="30%" height="1rem" />
              <Skeleton width="15%" height="1rem" />
              <Skeleton width="15%" height="1rem" />
              <Skeleton width="15%" height="1rem" />
              <Skeleton width="15%" height="1rem" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (phase === PHASES.ERROR) {
    return (
      <div className="p-8 text-center dark:text-gray-200">
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
      <div className="p-8 dark:text-gray-200">
        <NavBar courseId={courseId || ""} />
        <div className="text-center py-16">
          <p className="text-gray-400 dark:text-gray-500 text-sm">No lesson engagement data yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 dark:text-gray-200">
      <NavBar courseId={courseId || ""} />
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        Lesson Engagement
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-600 text-left text-gray-500 dark:text-gray-400">
              <th className="py-2 pr-4">Lesson</th>
              <th className="py-2 pr-4 text-right">Views</th>
              <th className="py-2 pr-4 text-right">Completions</th>
              <th className="py-2 pr-4 text-right">Completion Rate</th>
              <th className="py-2 pr-4 text-right">Avg Watch (s)</th>
              <th className="py-2 pr-4 text-right">Dropoff</th>
              <th className="py-2 pr-4 text-right">Quiz Pass</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((l) => (
              <tr key={l.lessonId} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="py-2 pr-4 text-gray-700 dark:text-gray-300 max-w-xs truncate">
                  {l.orderIndex}. {l.title}
                </td>
                <td className="py-2 pr-4 text-right text-gray-600 dark:text-gray-400">{l.viewCount}</td>
                <td className="py-2 pr-4 text-right text-gray-600 dark:text-gray-400">{l.completionCount}</td>
                <td className="py-2 pr-4 text-right font-medium">
                  {l.completionRate != null ? `${l.completionRate.toFixed(1)}%` : "\u2014"}
                </td>
                <td className="py-2 pr-4 text-right text-gray-600 dark:text-gray-400">
                  {l.avgWatchSeconds != null ? Math.round(l.avgWatchSeconds) : "\u2014"}
                </td>
                <td className="py-2 pr-4 text-right">
                  {l.dropoffRate != null ? (
                    <span className={l.dropoffRate > 20 ? "text-red-500" : "text-yellow-600"}>
                      {l.dropoffRate.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">{"\u2014"}</span>
                  )}
                </td>
                <td className="py-2 pr-4 text-right">
                  {l.quizPassRate != null ? (
                    <span className={l.quizPassRate >= 70 ? "text-green-600" : "text-red-500"}>
                      {l.quizPassRate.toFixed(1)}%
                    </span>
                  ) : l.hasQuiz ? (
                    <span className="text-gray-400 dark:text-gray-500">No data</span>
                  ) : (
                    <span className="text-gray-300 dark:text-gray-600">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface NavBarProps {
  courseId: string;
}

const NavBar = ({ courseId }: NavBarProps) => (
  <div className="flex items-center gap-4 mb-6 text-sm">
    <Link
      to={`/educator/course/${courseId}/analytics/lessons`}
      className="text-blue-600 dark:text-blue-400 font-medium border-b-2 border-blue-600 dark:border-blue-400 pb-1"
    >
      Lessons
    </Link>
    <Link
      to={`/educator/course/${courseId}/analytics/revenue`}
      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 pb-1"
    >
      Revenue
    </Link>
    <Link
      to={`/educator/course/${courseId}/analytics/quiz-stats`}
      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 pb-1"
    >
      Quiz Stats
    </Link>
  </div>
);

export default LessonAnalytics;
