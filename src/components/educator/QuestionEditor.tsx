import { useEffect, useState } from "react";
import { assets } from "../../assets/assets";
import type { Question, QuestionOption } from "../../types";

const QUESTION_TYPES: { value: string; label: string }[] = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TRUE_FALSE", label: "True/False" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
];

interface OptionItem {
  id?: string;
  optionText: string;
  isCorrect: boolean;
  tempId: string;
}

interface QuestionEditorProps {
  question: Partial<Question> | null;
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}

interface Errors {
  questionText?: string;
  points?: string;
  options?: string;
  correct?: string;
}

const QuestionEditor = ({ question, onSave, onCancel }: QuestionEditorProps) => {
  const [questionText, setQuestionText] = useState<string>("");
  const [type, setType] = useState<string>("MULTIPLE_CHOICE");
  const [points, setPoints] = useState<number>(1);
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (question) {
      setQuestionText((question as Record<string, string>).questionText || "");
      setType((question as Record<string, string>).type || "MULTIPLE_CHOICE");
      setPoints((question as Record<string, number>).points || 1);
      setOptions(
        ((question as Record<string, OptionItem[]>).options || []).map((o) => ({
          id: o.id,
          optionText: o.optionText,
          isCorrect: o.isCorrect || false,
          tempId: o.id || `opt-${Date.now()}-${Math.random()}`,
        })),
      );
    } else {
      resetForm();
    }
  }, [question]);

  const resetForm = () => {
    setQuestionText("");
    setType("MULTIPLE_CHOICE");
    setPoints(1);
    if (type === "TRUE_FALSE") {
      setOptions([
        { optionText: "True", isCorrect: true, tempId: "tf-true" },
        { optionText: "False", isCorrect: false, tempId: "tf-false" },
      ]);
    } else if (type === "SHORT_ANSWER") {
      setOptions([]);
    } else {
      setOptions([
        { optionText: "", isCorrect: false, tempId: `opt-${Date.now()}-1` },
        { optionText: "", isCorrect: false, tempId: `opt-${Date.now()}-2` },
      ]);
    }
  };

  useEffect(() => {
    if (!question) {
      if (type === "TRUE_FALSE") {
        setOptions([
          { optionText: "True", isCorrect: true, tempId: "tf-true" },
          { optionText: "False", isCorrect: false, tempId: "tf-false" },
        ]);
      } else if (type === "SHORT_ANSWER") {
        setOptions([]);
      } else if (options.length === 0) {
        setOptions([
          { optionText: "", isCorrect: false, tempId: `opt-${Date.now()}-1` },
          { optionText: "", isCorrect: false, tempId: `opt-${Date.now()}-2` },
        ]);
      }
    }
  }, [type]);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    setErrors({});
    if (newType === "TRUE_FALSE") {
      setOptions([
        { optionText: "True", isCorrect: true, tempId: "tf-true" },
        { optionText: "False", isCorrect: false, tempId: "tf-false" },
      ]);
    } else if (newType === "SHORT_ANSWER") {
      setOptions([]);
    } else {
      setOptions([
        { optionText: "", isCorrect: false, tempId: `opt-${Date.now()}-1` },
        { optionText: "", isCorrect: false, tempId: `opt-${Date.now()}-2` },
      ]);
    }
  };

  const addOption = () => {
    setOptions((prev) => [
      ...prev,
      { optionText: "", isCorrect: false, tempId: `opt-${Date.now()}` },
    ]);
  };

  const removeOption = (tempId: string) => {
    if (options.length <= 2 && type === "MULTIPLE_CHOICE") return;
    setOptions((prev) => prev.filter((o) => o.tempId !== tempId));
  };

  const updateOption = (tempId: string, field: string, value: boolean | string) => {
    setOptions((prev) =>
      prev.map((o) => (o.tempId === tempId ? { ...o, [field]: value } : o)),
    );
  };

  const validate = (): boolean => {
    const errs: Errors = {};
    if (!questionText.trim()) errs.questionText = "Question text is required.";
    if (points < 1) errs.points = "Points must be at least 1.";

    if (type !== "SHORT_ANSWER") {
      const hasEmpty = options.some((o) => !o.optionText.trim());
      if (hasEmpty) errs.options = "All options must have text.";
      const correctCount = options.filter((o) => o.isCorrect).length;
      if (correctCount === 0) errs.correct = "Select at least one correct answer.";
      if (type === "MULTIPLE_CHOICE" && options.length < 2)
        errs.options = "At least 2 options required.";
      if (type === "TRUE_FALSE" && options.length !== 2)
        errs.options = "True/False must have exactly 2 options.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const qData: Record<string, unknown> = {
      questionText: questionText.trim(),
      type,
      points,
      options: options
        .filter((o) => o.optionText.trim())
        .map((o, idx) => ({
          ...(o.id ? { id: o.id } : {}),
          optionText: o.optionText.trim(),
          isCorrect: o.isCorrect,
          orderIndex: idx + 1,
        })),
    };

    onSave(qData);
  };

  const isEditing = !!question;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Question Text
        </label>
        <textarea
          value={questionText}
          onChange={(e) => {
            setQuestionText(e.target.value);
            setErrors((prev) => ({ ...prev, questionText: undefined }));
          }}
          rows={2}
          className="w-full border rounded py-1.5 px-2 text-sm resize-none"
          placeholder="Enter your question..."
        />
        {errors.questionText && (
          <p className="text-red-500 text-xs mt-0.5">{errors.questionText}</p>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full border rounded py-1.5 px-2 bg-white text-sm"
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="w-24">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Points
          </label>
          <input
            type="number"
            min={1}
            value={points}
            onChange={(e) => {
              setPoints(parseInt(e.target.value) || 1);
              setErrors((prev) => ({ ...prev, points: undefined }));
            }}
            className="w-full border rounded py-1.5 px-2 text-sm"
          />
          {errors.points && (
            <p className="text-red-500 text-xs mt-0.5">{errors.points}</p>
          )}
        </div>
      </div>

      {type !== "SHORT_ANSWER" && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-600">
              Options
            </label>
            {type === "MULTIPLE_CHOICE" && (
              <button
                type="button"
                onClick={addOption}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                + Add Option
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            {options.map((opt, idx) => (
              <div key={opt.tempId} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-4">{idx + 1}.</span>
                <input
                  type="text"
                  value={opt.optionText}
                  onChange={(e) =>
                    updateOption(opt.tempId, "optionText", e.target.value)
                  }
                  placeholder="Option text"
                  className="flex-1 border rounded py-1 px-2 text-sm"
                  disabled={type === "TRUE_FALSE"}
                />
                <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer shrink-0">
                  <input
                    type="radio"
                    name={`correct-${(question as Record<string, string>)?.id || "new"}`}
                    checked={opt.isCorrect}
                    onChange={() => {
                      setOptions((prev) =>
                        prev.map((o) => ({
                          ...o,
                          isCorrect: o.tempId === opt.tempId,
                        })),
                      );
                      setErrors((prev) => ({ ...prev, correct: undefined }));
                    }}
                    className="accent-blue-600"
                  />
                  Correct
                </label>
                {type === "MULTIPLE_CHOICE" && options.length > 2 && (
                  <img
                    src={assets.cross_icon}
                    alt=""
                    className="w-3 h-3 cursor-pointer opacity-50 hover:opacity-100"
                    onClick={() => removeOption(opt.tempId)}
                  />
                )}
              </div>
            ))}
          </div>
          {errors.options && (
            <p className="text-red-500 text-xs mt-1">{errors.options}</p>
          )}
          {errors.correct && (
            <p className="text-red-500 text-xs mt-1">{errors.correct}</p>
          )}
        </div>
      )}

      {type === "SHORT_ANSWER" && (
        <p className="text-xs text-gray-400 italic">
          Short answer questions are graded by AI after submission.
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          {isEditing ? "Update" : "Add"} Question
        </button>
      </div>
    </div>
  );
};

export default QuestionEditor;
