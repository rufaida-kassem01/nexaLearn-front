import { useState, type FormEvent } from "react";
import { useToast } from "../../../hooks/useToast";
import { createThread } from "../../../services/discussionService";

interface ThreadCreated {
  id: string;
  title: string;
  body?: string;
  authorUsername?: string;
  authorName?: string;
  isPinned: boolean;
  isResolved: boolean;
  postCount: number;
  upvoteCount: number;
  createdAt: string;
}

interface CreateThreadFormProps {
  lessonId: string;
  onCreated: (thread: ThreadCreated) => void;
  onCancel: () => void;
}

const SUBMIT_STATE = {
  IDLE: "idle",
  SUBMITTING: "submitting",
  ERROR: "error",
} as const;

type SubmitState = (typeof SUBMIT_STATE)[keyof typeof SUBMIT_STATE];

const CreateThreadForm = ({ lessonId, onCreated, onCancel }: CreateThreadFormProps) => {
  const [title, setTitle] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [submitState, setSubmitState] = useState<SubmitState>(SUBMIT_STATE.IDLE);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const toast = useToast();

  const canSubmit = title.trim().length > 0 && submitState !== SUBMIT_STATE.SUBMITTING;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitState(SUBMIT_STATE.SUBMITTING);
    setErrorMsg("");
    try {
      const resp = await createThread(lessonId, {
        title: title.trim(),
        body: body.trim(),
      });
      toast.success("Thread created!");
      onCreated?.(resp.data);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(apiErr?.response?.data?.message || apiErr.message || "Failed to create thread.");
      setSubmitState(SUBMIT_STATE.ERROR);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-800">New Thread</h3>

      <input
        type="text"
        placeholder="Thread title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
      />

      <textarea
        rows={4}
        placeholder="What's on your mind? (optional)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
      />

      {errorMsg && (
        <p className="text-xs text-red-600">{errorMsg}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="text-sm px-4 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {submitState === SUBMIT_STATE.SUBMITTING ? "Posting\u2026" : "Post"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm px-4 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default CreateThreadForm;
