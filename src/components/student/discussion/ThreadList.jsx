import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../hooks/useToast";
import { listThreads, deleteThread, pinThread, unpinThread } from "../../../services/discussionService";
import ThreadCard from "./ThreadCard";
import ThreadDetail from "./ThreadDetail";
import CreateThreadForm from "./CreateThreadForm";

const ThreadList = ({ lessonId, onClose }) => {
  const { user } = useAuth();
  const toast = useToast();
  const isInstructor = user?.roles?.includes("INSTRUCTOR") ?? false;

  const [threads, setThreads] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unresolvedOnly, setUnresolvedOnly] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedThread, setSelectedThread] = useState(null);

  const fetchThreads = useCallback(async (cursor) => {
    setLoading(true);
    setError("");
    try {
      const resp = await listThreads(lessonId, {
        cursor,
        limit: 20,
        unresolvedOnly: unresolvedOnly || undefined,
      });
      const data = resp.data;
      if (cursor) {
        setThreads((prev) => [...prev, ...data.items]);
      } else {
        setThreads(data.items);
      }
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load threads.");
    } finally {
      setLoading(false);
    }
  }, [lessonId, unresolvedOnly]);

  useEffect(() => {
    fetchThreads(null);
  }, [fetchThreads]);

  const handleCreated = (thread) => {
    setThreads((prev) => [thread, ...prev]);
    setShowCreate(false);
  };

  const handleDelete = async (thread) => {
    try {
      await deleteThread(lessonId, thread.id);
      setThreads((prev) => prev.filter((t) => t.id !== thread.id));
      toast.success("Thread deleted.");
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to delete thread.");
    }
  };

  const handlePinToggle = async (thread) => {
    try {
      if (thread.isPinned) {
        const resp = await unpinThread(lessonId, thread.id);
        setThreads((prev) =>
          prev.map((t) => (t.id === thread.id ? { ...t, ...resp.data } : t))
        );
        toast.success("Thread unpinned.");
      } else {
        const resp = await pinThread(lessonId, thread.id);
        setThreads((prev) =>
          prev.map((t) => (t.id === thread.id ? { ...t, ...resp.data } : t))
        );
        toast.success("Thread pinned.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to update pin.";
      toast.error(msg);
    }
  };

  if (selectedThread) {
    return (
      <ThreadDetail
        lessonId={lessonId}
        thread={selectedThread}
        onBack={() => setSelectedThread(null)}
      />
    );
  }

  return (
    <div className="w-80 shrink-0 flex flex-col border-l border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800">Discussion</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-sm leading-none"
        >
          ✕
        </button>
      </div>

      <div className="border-b border-gray-200 px-4 py-2">
        {showCreate ? (
          <CreateThreadForm
            lessonId={lessonId}
            onCreated={handleCreated}
            onCancel={() => setShowCreate(false)}
          />
        ) : (
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={unresolvedOnly}
                onChange={(e) => setUnresolvedOnly(e.target.checked)}
                className="rounded"
              />
              Unresolved only
            </label>
            <button
              onClick={() => setShowCreate(true)}
              className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              + New Thread
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0 space-y-2">
        {loading && threads.length === 0 && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm text-center py-4">
            <p>{error}</p>
            <button
              onClick={() => fetchThreads(null)}
              className="mt-2 text-blue-600 hover:underline text-xs"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && threads.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">
            No discussion threads yet.
          </p>
        )}

        {threads.map((thread) => (
          <ThreadCard
            key={thread.id}
            thread={thread}
            onSelect={setSelectedThread}
            isInstructor={isInstructor}
            onPinToggle={handlePinToggle}
            onDelete={handleDelete}
          />
        ))}

        {nextCursor && (
          <div className="flex justify-center pt-2 pb-4">
            <button
              onClick={() => fetchThreads(nextCursor)}
              disabled={loading}
              className="text-xs px-4 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {loading ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadList;
