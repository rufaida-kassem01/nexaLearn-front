import MuxPlayer from "@mux/mux-player-react";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assets } from "../../assets/assets";
import Footer from "../../components/student/Footer";
import Rating from "../../components/student/Rating";
import { useAuth } from "../../context/AuthContext";
import { getCourse } from "../../services/courseService";
import { getLessonPlayback } from "../../services/lessonService";
import { checkEnrollment } from "../../services/enrollmentService";
import { trackProgress, getCourseProgress, getCourseResume } from "../../services/progressService";
import { createReview } from "../../services/reviewService";
import { sendTranscriptMessage } from "../../services/chatService";
import {
  getQuizForLesson,
  startAttempt,
  submitAttempt,
} from "../../services/assessmentService";
import ThreadList from "../../components/student/discussion/ThreadList";
import type { Course, PlaybackResponse, CourseProgress, ChatMessage, Attempt, SubmitAttemptRequest, Module, Lesson } from "../../types";

const SUBMIT_STATE = {
  IDLE: "idle" as const,
  SUBMITTING: "submitting" as const,
  SUCCESS: "success" as const,
  ERROR: "error" as const,
};

type SubmitState = (typeof SUBMIT_STATE)[keyof typeof SUBMIT_STATE];

interface RateCourseProps {
  courseId: string;
  accessToken: string | null;
}

const RateCourse = ({ courseId, accessToken }: RateCourseProps) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>(SUBMIT_STATE.IDLE);
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit =
    rating > 0 && submitState !== SUBMIT_STATE.SUBMITTING;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitState(SUBMIT_STATE.SUBMITTING);
    setErrorMsg("");
    try {
      const comment = [title.trim(), body.trim()].filter(Boolean).join("\n\n");
      await createReview(courseId, { rating, comment: comment || undefined });
      setSubmitState(SUBMIT_STATE.SUCCESS);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Couldn't submit your review. Please try again.");
      setSubmitState(SUBMIT_STATE.ERROR);
    }
  };

  if (submitState === SUBMIT_STATE.SUCCESS) {
    return (
      <div className="mt-10 p-4 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm">
        {"\u2713"} Thanks for your review! It may take a moment to appear.
      </div>
    );
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold mb-3">Rate this Course</h2>

      <Rating initialRating={rating} onRate={setRating} />

      {rating > 0 && (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            maxLength={200}
            placeholder="Review title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <textarea
            rows={3}
            placeholder="Tell others what you think (optional)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
          />
        </div>
      )}

      {errorMsg && (
        <p className="mt-2 text-red-500 text-sm">{errorMsg}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="mt-3 px-5 py-2 rounded bg-blue-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitState === SUBMIT_STATE.SUBMITTING ? "Submitting\u2026" : "Submit Review"}
      </button>

      {!accessToken && (
        <p className="mt-2 text-gray-400 text-xs">
          You must be logged in to leave a review.
        </p>
      )}
    </div>
  );
};

interface ChatPanelProps {
  lessonId: string;
  accessToken: string | null;
  onClose: () => void;
}

const ChatPanel = ({ lessonId, accessToken, onClose }: ChatPanelProps) => {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory([]);
    setStreamingText("");
    setChatError(null);
    setCooldown(null);
  }, [lessonId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, streamingText]);

  const handleSend = useCallback(async () => {
    const msg = input.trim();
    if (!msg || isStreaming) return;
    setInput("");
    setChatError(null);
    setCooldown(null);

    const userEntry: ChatMessage = { role: "user", content: msg };
    setHistory((prev) => [...prev, userEntry]);

    setIsStreaming(true);
    setStreamingText("");

    const assistantEntry: ChatMessage = { role: "assistant", content: "" };
    setHistory((prev) => [...prev, assistantEntry]);

    let fullReply = "";

    try {
      const gen = sendTranscriptMessage(lessonId, msg, history, accessToken);
      for await (const chunk of gen) {
        fullReply += chunk;
        setStreamingText(fullReply);
      }
      setHistory((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: fullReply };
        return next;
      });
      setStreamingText("");
    } catch (err: unknown) {
      const errorObj = err as { status?: number; message?: string };
      if (errorObj.status === 429) {
        const match = errorObj.message?.match(/(\d+)/);
        const seconds = match ? parseInt(match[1], 10) : 60;
        setCooldown(seconds);
      } else {
        setChatError(errorObj.message || "Failed to get response");
      }
      setHistory((prev) => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
      setStreamingText("");
    }
  }, [input, isStreaming, lessonId, accessToken, history]);

  const handleClear = () => {
    setHistory([]);
    setStreamingText("");
    setChatError(null);
    setCooldown(null);
  };

  useEffect(() => {
    if (cooldown === null || cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(id);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-80 shrink-0 flex flex-col border-l border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800">AI Transcript Chat</h3>
        <div className="flex gap-2">
          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-sm leading-none"
          >
            {"\u2715"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {history.length === 0 && !isStreaming && (
          <p className="text-xs text-gray-400 text-center mt-8">
            Ask questions about this lesson's content.
          </p>
        )}

        {history.map((entry, i) => (
          <div
            key={i}
            className={`text-sm ${
              entry.role === "user"
                ? "text-right"
                : "text-left"
            }`}
          >
            <span
              className={`inline-block rounded-lg px-3 py-2 max-w-[90%] ${
                entry.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {entry.content}
            </span>
          </div>
        ))}

        {streamingText && (
          <div className="text-sm text-left">
            <span className="inline-block rounded-lg px-3 py-2 bg-gray-100 text-gray-800 max-w-[90%]">
              {streamingText}
              <span className="inline-block w-1.5 h-4 bg-gray-400 ml-0.5 animate-pulse" />
            </span>
          </div>
        )}

        {chatError && (
          <p className="text-xs text-red-500 text-center">{chatError}</p>
        )}

        {cooldown !== null && (
          <p className="text-xs text-amber-600 text-center">
            Rate limit exceeded. Try again in {cooldown}s
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-200 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder={isStreaming ? "Waiting for response\u2026" : "Ask about this lesson\u2026"}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

interface QuizWidgetProps {
  lesson: Lesson | undefined;
  accessToken: string | null;
  onClose: () => void;
}

const QuizWidget = ({ lesson, accessToken, onClose }: QuizWidgetProps) => {
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<import("../../types").Quiz | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Attempt | null>(null);
  const [error, setError] = useState("");

  const fetchQuiz = useCallback(async () => {
    if (!lesson?.hasQuiz) return;
    setLoading(true);
    setError("");
    try {
      const quizData = await getQuizForLesson(lesson.id);
      setQuiz(quizData);

      const attemptData = await startAttempt(lesson.id);
      setAttemptId(attemptData.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quiz.");
    } finally {
      setLoading(false);
    }
  }, [lesson]);

  useEffect(() => {
    if (lesson?.hasQuiz) {
      fetchQuiz();
    }
  }, [lesson?.id, fetchQuiz]);

  const questions = quiz?.questions || [];
  const current = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  const handleSelect = (questionIndex: number, optionIndex: number) => {
    const q = questions[questionIndex];
    if (!q) return;

    if (q.type === "MULTIPLE_CHOICE" || q.type === ("single" as never)) {
      setAnswers((prev) => ({ ...prev, [questionIndex]: [optionIndex] }));
    } else {
      const prev = answers[questionIndex] || [];
      const next = prev.includes(optionIndex)
        ? prev.filter((i) => i !== optionIndex)
        : [...prev, optionIndex];
      setAnswers((prev) => ({ ...prev, [questionIndex]: next }));
    }
  };

  const handleTextChange = (questionIndex: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: [value] }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!attemptId) return;
    setSubmitting(true);
    setError("");
    try {
      const formatted = questions.map((q, i) => ({
        questionId: q.id,
        selectedOptions: answers[i] || [],
        textAnswer: q.type === "SHORT_ANSWER" ? (answers[i]?.[0] || "") : undefined,
      }));
      const res = await submitAttempt(lesson!.id, attemptId, { answers: formatted });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setQuiz(null);
    setAttemptId(null);
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setError("");
    fetchQuiz();
  };

  return (
    <div className="w-80 shrink-0 flex flex-col border-l border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800">Quiz</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-sm leading-none"
        >
          {"\u2715"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm text-center py-4">
            <p>{error}</p>
            <button
              onClick={handleRetry}
              className="mt-2 text-blue-600 hover:underline text-xs"
            >
              Try again
            </button>
          </div>
        )}

        {result && (
          <div className="py-4 space-y-3">
            <div
              className={`text-center p-4 rounded-lg ${
                result.passed
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <p className="text-2xl font-bold">
                {result.score ?? 0} / {result.total ?? questions.length}
              </p>
              <p
                className={`text-sm font-medium mt-1 ${
                  result.passed ? "text-green-700" : "text-red-700"
                }`}
              >
                {result.passed ? "\u2713 Passed" : "\u2717 Failed"}
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="w-full py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
            >
              Retry Quiz
            </button>
          </div>
        )}

        {current && !result && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <p className="text-sm font-medium text-gray-800">{current.text}</p>

            {current.type === "SHORT_ANSWER" && (
              <textarea
                rows={3}
                value={answers[currentIndex]?.[0] || ""}
                onChange={(e) => handleTextChange(currentIndex, e.target.value)}
                placeholder="Type your answer\u2026"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
              />
            )}

            {(current.type === "MULTIPLE_CHOICE" || current.type === "single") &&
              (current.options || []).map((opt, oi) => {
                const selected = (answers[currentIndex] || []).includes(oi);
                return (
                  <label
                    key={oi}
                    className={`flex items-start gap-2 p-2 rounded cursor-pointer text-sm ${
                      selected ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type={current.type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"}
                      checked={selected}
                      onChange={() => handleSelect(currentIndex, oi)}
                      className="mt-0.5"
                    />
                    <span>{opt.text || opt}</span>
                  </label>
                );
              })}

            <p className="text-xs text-gray-400 pt-2">
              {(answers[currentIndex]?.length || 0)} selected
            </p>
          </div>
        )}
      </div>

      {current && !result && (
        <div className="border-t border-gray-200 p-3 flex gap-2">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex-1 py-2 rounded border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>
          {isLast ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2 rounded bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? "Submitting\u2026" : "Submit"}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface CoursePlayerLesson extends Lesson {
  moduleId: string;
}

interface CoursePlayerData {
  modules: Module[];
  lessons: CoursePlayerLesson[];
}

const Player = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [coursePlayer, setCoursePlayer] = useState<CoursePlayerData | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [playbackData, setPlaybackData] = useState<PlaybackResponse | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [progressSet, setProgressSet] = useState<Set<string>>(new Set());
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({});

  const playerRef = useRef<HTMLMediaElement | null>(null);
  const lastSavedRef = useRef(0);

  const handleSelectLesson = useCallback((lessonId: string) => {
    setActiveLessonId(lessonId);
    setPlaybackData(null);
    lastSavedRef.current = 0;
  }, []);

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const [courseDetail, enrollmentResp] = await Promise.all([
          getCourse(courseId),
          checkEnrollment(courseId).catch(() => null),
        ]);
        if (cancelled) return;

        const isEnrolled = enrollmentResp?.enrolled ?? false;
        if (!isEnrolled) {
          navigate(`/course/${courseId}`, { replace: true });
          return;
        }

        const modules: Module[] = (courseDetail.modules || []).map((mod: Module, mi: number) => ({
          id: mod.id,
          title: mod.title,
          orderIndex: mod.orderIndex ?? mi,
          lessons: (mod.lessons || []).map((lesson: Lesson, li: number) => ({
            id: lesson.id,
            moduleId: mod.id,
            title: lesson.title,
            durationSecs: lesson.durationSecs ?? null,
            contentType: lesson.contentType || "video",
            orderIndex: lesson.orderIndex ?? li,
            isPreview: !!lesson.isPreview,
          })),
        }));

        const allLessons: CoursePlayerLesson[] = modules.flatMap((m) => m.lessons as CoursePlayerLesson[]);

        setCoursePlayer({ modules, lessons: allLessons });

        const resumeData = await getCourseResume(courseId).catch(() => null);
        const firstLessonId =
          resumeData?.lastLessonId || allLessons?.[0]?.id;
        if (firstLessonId) {
          setActiveLessonId(firstLessonId);
        }

        try {
          const prog = await getCourseProgress(courseId);
          if (!cancelled) {
            setCourseProgress(prog);
            if (Array.isArray(prog.completedLessons)) {
              setProgressSet(new Set(prog.completedLessons.map(String)));
            }
          }
        } catch {
          // progress is best-effort
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const errorObj = err as { status?: number };
          if (errorObj.status === 403 || errorObj.status === 401) {
            navigate(`/course/${courseId}`, { replace: true });
            return;
          }
          setError("Failed to load course. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [courseId, navigate]);

  useEffect(() => {
    if (!activeLessonId) return;
    let cancelled = false;

    getLessonPlayback(activeLessonId)
      .then((data: PlaybackResponse) => {
        if (!cancelled) setPlaybackData(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load lesson playback.");
      });

    return () => { cancelled = true; };
  }, [activeLessonId]);

  useEffect(() => {
    if (!activeLessonId) return;

    const interval = setInterval(async () => {
      const el = playerRef.current;
      if (!el || typeof el.currentTime !== "number") return;

      const ct = Math.floor(el.currentTime);
      if (ct === lastSavedRef.current) return;
      lastSavedRef.current = ct;

      try {
        await trackProgress({
          lessonId: activeLessonId,
          watchedSeconds: ct,
          isCompleted: false,
        });
      } catch {
        // silently fail progress tracking
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeLessonId]);

  const refreshProgress = useCallback(async () => {
    try {
      const prog = await getCourseProgress(courseId);
      setCourseProgress(prog);
      if (Array.isArray(prog.completedLessons)) {
        setProgressSet(new Set(prog.completedLessons));
      }
    } catch {
      // best-effort
    }
  }, [courseId]);

  const handleEnded = useCallback(async () => {
    if (!activeLessonId) return;

    const lesson = coursePlayer?.lessons?.find((l) => l.id === activeLessonId);
    await trackProgress({
      lessonId: activeLessonId,
      watchedSeconds: lesson?.durationSeconds || 0,
      isCompleted: true,
    });

    await refreshProgress();

    const lessons = coursePlayer?.lessons || [];
    const idx = lessons.findIndex((l) => l.id === activeLessonId);
    if (idx >= 0 && idx < lessons.length - 1) {
      setActiveLessonId(lessons[idx + 1].id);
      setPlaybackData(null);
      lastSavedRef.current = 0;
    }
  }, [activeLessonId, coursePlayer, refreshProgress]);

  const handleManualComplete = useCallback(async () => {
    if (!activeLessonId) return;
    const lesson = coursePlayer?.lessons?.find((l) => l.id === activeLessonId);
    await trackProgress({
      lessonId: activeLessonId,
      watchedSeconds: lesson?.durationSeconds || 0,
      isCompleted: true,
    });
    await refreshProgress();
  }, [activeLessonId, coursePlayer, refreshProgress]);

  const modules = coursePlayer?.modules || [];
  const lessons = coursePlayer?.lessons || [];
  const activeLesson = lessons.find((l) => l.id === activeLessonId);
  const isCompleted = progressSet.has(activeLessonId || "");

  const sidebarModules = modules.map((mod) => ({
    ...mod,
    moduleLessons: lessons.filter((l) => l.moduleId === mod.id),
  }));

  const toggleSection = (idx: number) => {
    setOpenSections((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
        >
          Try again
        </button>
      </div>
    );
  }

  const progressPercent = courseProgress?.progressPercent ?? 0;

  const renderPanel = () => {
    if (activePanel === "chat") {
      return (
        <ChatPanel
          lessonId={activeLessonId || courseId || ""}
          accessToken={accessToken}
          onClose={() => setActivePanel(null)}
        />
      );
    }
    if (activePanel === "quiz") {
      return (
        <QuizWidget
          lesson={activeLesson}
          accessToken={accessToken}
          onClose={() => setActivePanel(null)}
        />
      );
    }
    if (activePanel === "discussion") {
      return (
        <ThreadList
          lessonId={activeLessonId || courseId || ""}
          onClose={() => setActivePanel(null)}
        />
      );
    }
    return null;
  };

  return (
    <>
      <div className="p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-36">
        <div className="text-gray-800">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Course Progress</span>
              <span className="text-xs text-gray-500 font-medium">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>

          <h2 className="text-xl font-semibold">Course Content</h2>
          <div className="pt-5">
            {sidebarModules.map((mod, modIdx) => (
              <div
                key={mod.id ?? modIdx}
                className="border border-gray-300 bg-white mb-2 rounded"
              >
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                  onClick={() => toggleSection(modIdx)}
                >
                  <div className="flex items-center gap-2">
                    <img
                      className={`transform transition-transform ${
                        openSections[modIdx] ? "rotate-180" : "rotate-0"
                      }`}
                      src={assets.down_arrow_icon}
                      alt="arrow icon"
                    />
                    <p className="font-medium md:text-base text-sm">
                      {mod.title}
                    </p>
                  </div>
                  <p className="text-sm md:text-default">
                    {mod.moduleLessons.length} lesson
                    {mod.moduleLessons.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openSections[modIdx] ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <ul className="list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300">
                    {mod.moduleLessons.map((lesson) => {
                      const done = progressSet.has(lesson.id);
                      const active = activeLessonId === lesson.id;

                      return (
                        <li
                          key={lesson.id}
                          className="flex items-start gap-2 py-1"
                        >
                          <img
                            src={done ? assets.blue_tick_icon : assets.play_icon}
                            alt={done ? "completed" : "play"}
                            className="w-4 h-4 mt-1 shrink-0"
                          />
                          <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-default">
                            <p
                              className={
                                active
                                  ? "font-semibold text-blue-600 cursor-pointer"
                                  : "cursor-pointer hover:text-blue-500"
                              }
                              onClick={() => handleSelectLesson(lesson.id)}
                            >
                              {lesson.title}
                            </p>
                            <div className="flex gap-2 shrink-0">
                              <p
                                onClick={() => handleSelectLesson(lesson.id)}
                                className="text-blue-500 cursor-pointer"
                              >
                                {active ? "Playing" : "Watch"}
                              </p>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <RateCourse courseId={courseId || ""} accessToken={accessToken} />
        </div>

        <div className="md:mt-10 flex gap-4">
          <div className="flex-1 min-w-0">
            {playbackData ? (
              <div>
                <MuxPlayer
                  ref={playerRef}
                  src={playbackData.playbackUrl || playbackData.legacyContentUrl}
                  streamType="on-demand"
                  metadata={{
                    video_id: activeLessonId,
                    video_title: activeLesson?.title || "Lesson",
                    player_name: "NexaLearn",
                  }}
                  onEnded={handleEnded}
                  autoPlay
                  className="w-full aspect-video"
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm truncate">
                    {activeLesson?.title || "Loading\u2026"}
                  </p>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() =>
                        setActivePanel((prev) => (prev === "chat" ? null : "chat"))
                      }
                      className={`text-sm px-3 py-1 rounded border transition-colors ${
                        activePanel === "chat"
                          ? "border-blue-500 bg-blue-50 text-blue-600"
                          : "border-gray-300 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      Chat
                    </button>
                    {activeLesson?.hasQuiz && (
                      <button
                        onClick={() =>
                          setActivePanel((prev) => (prev === "quiz" ? null : "quiz"))
                        }
                        className={`text-sm px-3 py-1 rounded border transition-colors ${
                          activePanel === "quiz"
                            ? "border-purple-500 bg-purple-50 text-purple-600"
                            : "border-gray-300 text-gray-600 hover:border-gray-400"
                        }`}
                      >
                        Quiz
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setActivePanel((prev) =>
                          prev === "discussion" ? null : "discussion"
                        )
                      }
                      className={`text-sm px-3 py-1 rounded border transition-colors ${
                        activePanel === "discussion"
                          ? "border-green-500 bg-green-50 text-green-600"
                          : "border-gray-300 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      Discuss
                    </button>
                    {!isCompleted && (
                      <button
                        onClick={handleManualComplete}
                        className="text-sm px-3 py-1 rounded border border-blue-500 text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        Mark Complete
                      </button>
                    )}
                    {isCompleted && (
                      <span className="text-sm px-3 py-1 rounded border border-green-500 text-green-600">
                        {"\u2713"} Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full aspect-video bg-black flex items-center justify-center">
                {activeLesson ? (
                  <p className="text-gray-400 text-sm">Loading player\u2026</p>
                ) : (
                  <p className="text-gray-400 text-sm">Select a lesson to begin</p>
                )}
              </div>
            )}
          </div>

          {renderPanel()}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Player;
