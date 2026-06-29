import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Footer from "../../components/student/Footer";
import Skeleton from "../../components/Skeleton";
import * as assessmentService from "../../services/assessmentService";
import type { Quiz, Attempt } from "../../types";

const POLL_DELAYS = [2000, 4000, 8000, 16000];
const MAX_POLL_TIME = 30000;

const PHASE = {
  LOADING: "loading",
  ERROR: "error",
  READY: "ready",
  SUBMITTING: "submitting",
  GRADING: "grading",
  RESULT: "result",
} as const;

type Phase = (typeof PHASE)[keyof typeof PHASE];

interface AnswerValue {
  selectedOptionIds: string[];
  textAnswer: string;
}

type Answers = Record<string, AnswerValue>;

interface AttemptResult extends Attempt {
  answers?: {
    questionId: string;
    correct: boolean;
    points?: number;
    maxPoints?: number;
    correctAnswer?: string;
  }[];
  gradingStatus?: string;
}

const calcTimeLeft = (expiresAt: string) => {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
};

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
};

const QuizPage = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>(PHASE.LOADING);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<AttemptResult | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStartRef = useRef(0);
  const pollIndexRef = useRef(0);
  const submittedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const pollForResult = useCallback(async () => {
    if (Date.now() - pollStartRef.current >= MAX_POLL_TIME) {
      setError("Grading timed out. Check your results later.");
      setPhase(PHASE.ERROR);
      return;
    }

    try {
      const data: AttemptResult = await assessmentService.getAttemptResult(lessonId, attempt!.id);
      if (data.gradingStatus === "graded") {
        setResult(data);
        setPhase(PHASE.RESULT);
        return;
      }

      const delay =
        pollIndexRef.current < POLL_DELAYS.length
          ? POLL_DELAYS[pollIndexRef.current]
          : POLL_DELAYS[POLL_DELAYS.length - 1];
      pollIndexRef.current += 1;
      pollTimerRef.current = setTimeout(pollForResult, delay);
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err instanceof Error ? err.message : "Failed to get quiz result"),
      );
      setPhase(PHASE.ERROR);
    }
  }, [attempt, lessonId]);

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    clearTimers();

    setPhase(PHASE.SUBMITTING);

    try {
      const answersPayload = Object.entries(answers).map(
        ([questionId, ans]) => ({
          questionId,
          ...(ans.selectedOptionIds?.length
            ? { selectedOptionIds: ans.selectedOptionIds }
            : {}),
          ...(ans.textAnswer !== undefined && ans.textAnswer !== ""
            ? { textAnswer: ans.textAnswer }
            : {}),
        }),
      );

      await assessmentService.submitAttempt(lessonId, attempt!.id, answersPayload);
      setPhase(PHASE.GRADING);

      pollStartRef.current = Date.now();
      pollIndexRef.current = 0;
      pollForResult();
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err instanceof Error ? err.message : "Failed to submit quiz"),
      );
      setPhase(PHASE.ERROR);
    }
  }, [answers, attempt, clearTimers, lessonId, pollForResult]);

  useEffect(() => {
    if (!lessonId) return;

    (async () => {
      try {
        const quizData = await assessmentService.getQuizForLesson(lessonId);
        setQuiz(quizData);

        const attemptData = await assessmentService.startAttempt(lessonId);
        setAttempt(attemptData);

        const initial: Answers = {};
        quizData.questions.forEach((q) => {
          initial[q.id] = {
            selectedOptionIds: [],
            textAnswer: "",
          };
        });
        setAnswers(initial);

        const remaining = calcTimeLeft(attemptData.expiresAt);
        setTimeLeft(remaining);

        if (remaining > 0) {
          timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
              if (prev <= 1) {
                clearInterval(timerRef.current!);
                timerRef.current = null;
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }

        setPhase(PHASE.READY);
      } catch (err) {
        setError(
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            (err instanceof Error ? err.message : "Failed to load quiz"),
        );
        setPhase(PHASE.ERROR);
      }
    })();

    return () => {
      clearTimers();
      submittedRef.current = true;
    };
  }, [lessonId, clearTimers]);

  useEffect(() => {
    if (timeLeft === 0 && phase === PHASE.READY && !submittedRef.current) {
      handleSubmit();
    }
  }, [timeLeft, phase, handleSubmit]);

  const handleOptionChange = (questionId: string, optionId: string, isMulti: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] || { selectedOptionIds: [] };
      let selected: string[];
      if (isMulti) {
        selected = current.selectedOptionIds.includes(optionId)
          ? current.selectedOptionIds.filter((id) => id !== optionId)
          : [...current.selectedOptionIds, optionId];
      } else {
        selected = [optionId];
      }
      return { ...prev, [questionId]: { ...current, selectedOptionIds: selected } };
    });
  };

  const handleTextChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], textAnswer: text },
    }));
  };

  if (phase === PHASE.LOADING) {
    return (
      <>
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
          <Skeleton width="60%" height="2rem" />
          <Skeleton width="100%" height="1rem" />
          <Skeleton width="80%" height="1rem" />
          <div className="rounded-xl border border-gray-200 p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton width="70%" height="1rem" />
                <Skeleton width="100%" height="0.9rem" />
                <Skeleton width="90%" height="0.9rem" />
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (phase === PHASE.ERROR) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
            <p className="text-red-600 font-medium mb-2">Something went wrong</p>
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (phase === PHASE.RESULT && result) {
    return (
      <>
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div
            className={`rounded-lg p-6 text-center mb-8 ${
              result.passed
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <p className="text-3xl font-bold mb-2">
              {result.passed ? "Passed!" : "Did Not Pass"}
            </p>
            <p className="text-lg">
              Score: <span className="font-semibold">{result.score}%</span>
            </p>
          </div>

          {result.answers?.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Question Review</h3>
              {result.answers.map((ans, i) => {
                const question = quiz?.questions?.find(
                  (q) => q.id === ans.questionId,
                );
                return (
                  <div
                    key={ans.questionId}
                    className={`border rounded-lg p-4 ${
                      ans.correct
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">
                        {i + 1}. {question?.text || ans.questionId}
                      </p>
                      <span
                        className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded ${
                          ans.correct
                            ? "bg-green-200 text-green-800"
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {ans.points ?? 0}/{ans.maxPoints ?? 0}
                      </span>
                    </div>
                    {!ans.correct && ans.correctAnswer && (
                      <p className="mt-2 text-xs text-gray-600">
                        Correct answer: {ans.correctAnswer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Back to Course
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Quiz</h1>
          <div
            className={`text-sm font-mono px-3 py-1 rounded ${
              timeLeft <= 30
                ? "bg-red-100 text-red-600 animate-pulse"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {formatTime(timeLeft)}
          </div>
        </div>

        {phase === PHASE.SUBMITTING && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
            Submitting your answers\u2026
          </div>
        )}

        {phase === PHASE.GRADING && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
            Grading your quiz\u2026
          </div>
        )}

        <div className="space-y-6">
          {quiz?.questions?.map((question, i) => {
            const current = answers[question.id] || { selectedOptionIds: [], textAnswer: "" };

            if (question.type === "SHORT_ANSWER") {
              return (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <p className="font-medium text-sm mb-3">
                    {i + 1}. {question.text}
                  </p>
                  <textarea
                    rows={4}
                    disabled={phase !== PHASE.READY}
                    value={current.textAnswer || ""}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleTextChange(question.id, e.target.value)}
                    placeholder="Type your answer\u2026"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>
              );
            }

            const isMulti = (question as unknown as { multiSelect?: boolean }).multiSelect === true;

            return (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <p className="font-medium text-sm mb-3">
                  {i + 1}. {question.text}
                </p>
                {question.type === "MULTIPLE_CHOICE" && (
                  <div className="space-y-2">
                    {question.options?.map((option) => {
                      const checked = current.selectedOptionIds?.includes(option.id);
                      return (
                        <label
                          key={option.id}
                          className={`flex items-center gap-3 p-2 rounded cursor-pointer border text-sm transition-colors ${
                            checked
                              ? "border-blue-400 bg-blue-50"
                              : "border-gray-200 hover:bg-gray-50"
                          } ${phase !== PHASE.READY ? "pointer-events-none opacity-60" : ""}`}
                        >
                          <input
                            type={isMulti ? "checkbox" : "radio"}
                            name={`q_${question.id}`}
                            checked={checked}
                            disabled={phase !== PHASE.READY}
                            onChange={() => handleOptionChange(question.id, option.id, isMulti)}
                            className="accent-blue-600"
                          />
                          {option.text}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {quiz?.questions?.length === 0 && (
          <div className="text-center py-10 text-gray-500 text-sm">
            This quiz has no questions.
          </div>
        )}

        {phase === PHASE.READY && quiz?.questions?.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleSubmit}
              disabled={phase !== PHASE.READY}
              className="px-8 py-2.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Quiz
            </button>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default QuizPage;
