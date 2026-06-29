import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../hooks/useToast";
import { getThread, upvoteThread, acceptPost, deleteThread } from "../../../services/discussionService";
import PostCard from "./PostCard";
import PostForm from "./PostForm";

interface ThreadDetailItem {
  id: string;
  title: string;
  body: string;
  authorUsername?: string;
  authorName?: string;
  isPinned: boolean;
  isResolved: boolean;
  postCount: number;
  upvoteCount: number;
  createdAt: string;
}

interface PostItem {
  id: string;
  body: string;
  authorUsername?: string;
  authorName?: string;
  isAccepted: boolean;
  isInstructorPost?: boolean;
  upvoteCount: number;
  createdAt: string;
  threadId?: string;
}

interface ThreadDetailProps {
  lessonId: string;
  thread: ThreadDetailItem;
  onBack: () => void;
}

const ThreadDetail = ({ lessonId, thread, onBack }: ThreadDetailProps) => {
  const { user } = useAuth();
  const toast = useToast();
  const isInstructor = user?.roles?.includes("INSTRUCTOR") ?? false;

  const [threadData, setThreadData] = useState<ThreadDetailItem>(thread);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [threadUpvotes, setThreadUpvotes] = useState<number>(thread.upvoteCount);

  const fetchPosts = useCallback(async (cursor: string | null) => {
    setLoading(true);
    setError("");
    try {
      const resp = await getThread(lessonId, threadData.id, { cursor: cursor ?? undefined, limit: 20 });
      const data = resp.data;
      setThreadData(data.thread);
      if (cursor) {
        setPosts((prev) => [...prev, ...data.posts.items]);
      } else {
        setPosts(data.posts.items);
      }
      setNextCursor(data.posts.nextCursor);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(apiErr?.response?.data?.message || apiErr.message || "Failed to load posts.");
    } finally {
      setLoading(false);
    }
  }, [lessonId, threadData.id]);

  useEffect(() => {
    fetchPosts(null);
  }, [fetchPosts]);

  const handleUpvoteThread = async () => {
    try {
      const resp = await upvoteThread(lessonId, threadData.id);
      if (resp.data.upvoted) {
        setThreadUpvotes((c) => c + 1);
      }
    } catch {
      toast.error("Failed to upvote.");
    }
  };

  const handlePosted = (newPost: PostItem) => {
    setPosts((prev) => [...prev, newPost]);
    setThreadData((prev) => ({ ...prev, postCount: prev.postCount + 1 }));
  };

  const handleAcceptPost = async (postId: string) => {
    await acceptPost(lessonId, threadData.id, postId);
    setThreadData((prev) => ({ ...prev, isResolved: true }));
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isAccepted: true } : p))
    );
    toast.success("Answer accepted!");
  };

  const handleDeleteThread = async () => {
    if (!window.confirm("Delete this thread? This cannot be undone.")) return;
    try {
      await deleteThread(lessonId, threadData.id);
      toast.success("Thread deleted.");
      onBack();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(apiErr?.response?.data?.message || apiErr.message || "Failed to delete thread.");
    }
  };

  const dateStr = new Date(threadData.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="w-80 shrink-0 flex flex-col border-l border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-gray-600 text-sm leading-none"
        >
          &larr;
        </button>
        <h3 className="text-sm font-semibold text-gray-800 truncate">
          {threadData.title}
        </h3>
        {isInstructor && (
          <button
            onClick={handleDeleteThread}
            className="ml-auto text-xs text-gray-400 hover:text-red-600 transition-colors"
            title="Delete thread"
          >
            Delete
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs text-gray-500">{threadData.authorUsername} &middot; {dateStr}</p>
            {threadData.isResolved && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                Solved
              </span>
            )}
          </div>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{threadData.body}</p>
          <button
            onClick={handleUpvoteThread}
            className="mt-2 flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-colors text-gray-400"
          >
            &#9650; {threadUpvotes}
          </button>
        </div>

        <div className="px-4 py-3 space-y-2">
          {loading && posts.length === 0 && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm text-center py-4">
              <p>{error}</p>
              <button
                onClick={() => fetchPosts(null)}
                className="mt-2 text-blue-600 hover:underline text-xs"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && posts.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">
              No replies yet. Be the first to reply!
            </p>
          )}

          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              lessonId={lessonId}
              threadId={threadData.id}
              isInstructor={isInstructor}
              onAccept={handleAcceptPost}
            />
          ))}

          {nextCursor && (
            <div className="flex justify-center pt-2 pb-4">
              <button
                onClick={() => fetchPosts(nextCursor)}
                disabled={loading}
                className="text-xs px-4 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {loading ? "Loading\u2026" : "Load more"}
              </button>
            </div>
          )}
        </div>
      </div>

      <PostForm
        lessonId={lessonId}
        threadId={threadData.id}
        onPosted={handlePosted}
      />
    </div>
  );
};

export default ThreadDetail;
