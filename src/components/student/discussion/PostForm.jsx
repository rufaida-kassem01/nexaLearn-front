import { useState } from "react";
import { useToast } from "../../../hooks/useToast";
import { addPost } from "../../../services/discussionService";

const PostForm = ({ lessonId, threadId, onPosted }) => {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const canSubmit = body.trim().length > 0 && !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const resp = await addPost(lessonId, threadId, { body: body.trim() });
      toast.success("Reply posted!");
      setBody("");
      onPosted?.(resp.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to post reply.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 space-y-2">
      <textarea
        rows={3}
        placeholder="Write a reply…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="text-sm px-4 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Posting…" : "Reply"}
        </button>
      </div>
    </form>
  );
};

export default PostForm;
