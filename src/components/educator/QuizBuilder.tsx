import { useCallback, useEffect, useState } from "react";
import { assets } from "../../assets/assets";
import { useToast } from "../../hooks/useToast";
import * as assessmentService from "../../services/assessmentService";
import QuestionEditor from "./QuestionEditor";
import QuizPreview from "./QuizPreview";
import type { Quiz, Question } from "../../types";

interface QuizBuilderProps {
  courseId: string;
  lessonId: string;
  lessonTitle?: string;
  onClose: () => void;
}

interface QuizSettings {
  title: string;
  description: string;
  passingScore: number;
  timeLimitMins: string;
  maxAttempts: string;
}

interface QuizResponse extends Quiz {
  totalMarks?: number;
  timeLimitMins?: number;
  isPublished?: boolean;
}

interface QuestionWithOrder extends Question {
  orderIndex?: number;
  questionText?: string;
  points?: number;
}

const QuizBuilder = ({ courseId, lessonId, lessonTitle, onClose }: QuizBuilderProps) => {
  const { addToast } = useToast();

  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<QuizSettings>({
    title: "",
    description: "",
    passingScore: 70,
    timeLimitMins: "",
    maxAttempts: "",
  });
  const [showQuestionEditor, setShowQuestionEditor] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionWithOrder | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [needsSave, setNeedsSave] = useState<boolean>(false);

  const noRealIds: boolean = !courseId || !lessonId;

  const fetchQuiz = useCallback(async () => {
    if (noRealIds) {
      setLoading(false);
      setNeedsSave(true);
      return;
    }
    setLoading(true);
    try {
      const data: QuizResponse = await assessmentService.instructorGetQuiz(courseId, lessonId);
      setQuiz(data);
      setSettings({
        title: data.title || "",
        description: data.description || "",
        passingScore: data.passingScore ?? 70,
        timeLimitMins: data.timeLimitMins != null ? String(data.timeLimitMins) : "",
        maxAttempts: data.maxAttempts != null ? String(data.maxAttempts) : "",
      });
    } catch {
      setQuiz(null);
    } finally {
      setLoading(false);
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const handleCreateOrUpdateQuiz = async () => {
    if (!settings.title.trim()) {
      addToast("Quiz title is required.", "error");
      return;
    }

    try {
      const payload = {
        title: settings.title.trim(),
        description: settings.description.trim() || undefined,
        passingScore: parseInt(String(settings.passingScore)) || 70,
        timeLimitMins: settings.timeLimitMins ? parseInt(String(settings.timeLimitMins)) : undefined,
        maxAttempts: settings.maxAttempts ? parseInt(String(settings.maxAttempts)) : undefined,
      };

      const result: QuizResponse = await assessmentService.createQuiz(courseId, lessonId, payload);
      setQuiz(result);
      addToast("Quiz created!", "success");
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      addToast(
        apiErr?.response?.data?.message || apiErr.message || "Failed to create quiz.",
        "error",
      );
    }
  };

  const handleAddQuestion = async (qData: Record<string, unknown>) => {
    try {
      const result: QuizResponse = await assessmentService.addQuestion(courseId, lessonId, qData);
      setQuiz(result);
      setShowQuestionEditor(false);
      setEditingQuestion(null);
      addToast("Question added!", "success");
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      addToast(
        apiErr?.response?.data?.message || apiErr.message || "Failed to add question.",
        "error",
      );
    }
  };

  const handleUpdateQuestion = async (qData: Record<string, unknown>) => {
    if (!editingQuestion?.id) return;
    try {
      const result: QuizResponse = await assessmentService.updateQuestion(
        courseId,
        lessonId,
        editingQuestion.id,
        qData,
      );
      setQuiz(result);
      setShowQuestionEditor(false);
      setEditingQuestion(null);
      addToast("Question updated!", "success");
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      addToast(
        apiErr?.response?.data?.message || apiErr.message || "Failed to update question.",
        "error",
      );
    }
  };

  const handleRemoveQuestion = async (questionId: string) => {
    try {
      const result: QuizResponse = await assessmentService.removeQuestion(courseId, lessonId, questionId);
      setQuiz(result);
      addToast("Question removed.", "success");
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      addToast(
        apiErr?.response?.data?.message || apiErr.message || "Failed to remove question.",
        "error",
      );
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const result: QuizResponse = await assessmentService.publishQuiz(courseId, lessonId);
      setQuiz((prev) => ({ ...prev, ...result }));
      addToast("Quiz published!", "success");
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      addToast(
        apiErr?.response?.data?.message || apiErr.message || "Failed to publish quiz.",
        "error",
      );
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setPublishing(true);
    try {
      const result: QuizResponse = await assessmentService.unpublishQuiz(courseId, lessonId);
      setQuiz((prev) => ({ ...prev, ...result }));
      addToast("Quiz unpublished.", "success");
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      addToast(
        apiErr?.response?.data?.message || apiErr.message || "Failed to unpublish quiz.",
        "error",
      );
    } finally {
      setPublishing(false);
    }
  };

  const openNewQuestion = () => {
    setEditingQuestion(null);
    setShowQuestionEditor(true);
  };

  const openEditQuestion = (q: QuestionWithOrder) => {
    setEditingQuestion(q);
    setShowQuestionEditor(true);
  };

  const questions: QuestionWithOrder[] = (quiz?.questions || []).slice().sort(
    (a: QuestionWithOrder, b: QuestionWithOrder) => (a.orderIndex || 0) - (b.orderIndex || 0)
  );

  return (
    <div className="fixed inset-0 flex items-start justify-center bg-black/30 backdrop-blur-sm z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Quiz Builder{lessonTitle ? ` \u2014 ${lessonTitle}` : ""}
          </h2>
          <img
            onClick={onClose}
            src={assets.cross_icon}
            className="w-4 cursor-pointer"
            alt=""
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-blue-500 border-dashed rounded-full animate-spin" />
          </div>
        ) : needsSave ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">
              Save the course first, then manage quizzes in the course editor.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-800 text-white rounded text-sm hover:bg-black transition"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {!quiz && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  No quiz exists for this lesson yet. Create one below.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Quiz Title
                    </label>
                    <input
                      type="text"
                      value={settings.title}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="e.g. Chapter 1 Quiz"
                      className="w-full border rounded py-1.5 px-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      value={settings.description}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={2}
                      className="w-full border rounded py-1.5 px-2 text-sm resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Passing Score %
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={settings.passingScore}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            passingScore: Number(e.target.value),
                          }))
                        }
                        className="w-full border rounded py-1.5 px-2 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Time Limit (min)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={settings.timeLimitMins}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            timeLimitMins: e.target.value,
                          }))
                        }
                        placeholder="Untimed"
                        className="w-full border rounded py-1.5 px-2 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Max Attempts
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={settings.maxAttempts}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            maxAttempts: e.target.value,
                          }))
                        }
                        placeholder="Unlimited"
                        className="w-full border rounded py-1.5 px-2 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateOrUpdateQuiz}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm transition"
                  >
                    Create Quiz
                  </button>
                </div>
              </div>
            )}

            {quiz && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{quiz.title}</h3>
                    {quiz.description && (
                      <p className="text-xs text-gray-500">{quiz.description}</p>
                    )}
                    <div className="flex gap-3 mt-1 text-xs text-gray-400">
                      <span>
                        {questions.length} question{questions.length !== 1 ? "s" : ""}
                      </span>
                      <span>Pass: {quiz.passingScore || 70}%</span>
                      {quiz.totalMarks != null && (
                        <span>{quiz.totalMarks} pts</span>
                      )}
                      {quiz.timeLimitMins && <span>{quiz.timeLimitMins} min</span>}
                      {quiz.maxAttempts && (
                        <span>Max: {quiz.maxAttempts}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        quiz.isPublished
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {quiz.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openNewQuestion}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition"
                  >
                    + Add Question
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="text-xs border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded transition"
                  >
                    Preview
                  </button>
                  {!quiz.isPublished ? (
                    <button
                      type="button"
                      disabled={questions.length === 0 || publishing}
                      onClick={handlePublish}
                      className="text-xs bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-3 py-1.5 rounded transition"
                    >
                      {publishing ? "..." : "Publish"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={publishing}
                      onClick={handleUnpublish}
                      className="text-xs border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 px-3 py-1.5 rounded transition"
                    >
                      Unpublish
                    </button>
                  )}
                </div>

                {showQuestionEditor && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <QuestionEditor
                      question={editingQuestion}
                      onSave={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
                      onCancel={() => {
                        setShowQuestionEditor(false);
                        setEditingQuestion(null);
                      }}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  {questions.length === 0 && !showQuestionEditor && (
                    <p className="text-center text-gray-400 py-6 text-sm">
                      No questions yet. Click &quot;Add Question&quot; to get started.
                    </p>
                  )}
                  {questions.map((q, i) => (
                    <div
                      key={q.id}
                      className="flex items-start justify-between gap-2 border rounded-lg p-3 hover:bg-gray-50 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-5 shrink-0">
                            {i + 1}.
                          </span>
                          <p className="text-sm font-medium truncate">
                            {q.questionText}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 ml-7">
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            {q.type === "MULTIPLE_CHOICE"
                              ? "MCQ"
                              : q.type === "TRUE_FALSE"
                                ? "TF"
                                : "SA"}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {q.points || 1} pt{q.points !== 1 ? "s" : ""}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {(q.options || []).length} option
                            {(q.options || []).length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditQuestion(q)}
                          className="text-[10px] text-blue-600 hover:text-blue-800 px-1.5 py-0.5"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(q.id)}
                          className="text-[10px] text-red-500 hover:text-red-700 px-1.5 py-0.5"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {showPreview && (
          <QuizPreview quiz={quiz} onClose={() => setShowPreview(false)} />
        )}
      </div>
    </div>
  );
};

export default QuizBuilder;
