interface ThreadCardItem {
  id: string;
  title: string;
  authorUsername?: string;
  authorName?: string;
  isPinned: boolean;
  isResolved: boolean;
  postCount: number;
  upvoteCount: number;
  createdAt: string;
}

interface ThreadCardProps {
  thread: ThreadCardItem;
  onSelect: (thread: ThreadCardItem) => void;
  isInstructor: boolean;
  onPinToggle: (thread: ThreadCardItem) => void;
  onDelete: (thread: ThreadCardItem) => void;
}

const ThreadCard = ({ thread, onSelect, isInstructor, onPinToggle, onDelete }: ThreadCardProps) => {
  const dateStr = new Date(thread.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className={`rounded-lg border ${
        thread.isPinned
          ? "border-yellow-300 bg-yellow-50/40"
          : "border-gray-200"
      }`}
    >
      <button
        onClick={() => onSelect(thread)}
        className="w-full text-left p-3 hover:bg-blue-50/30 transition-colors rounded-t-lg"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 truncate">
              {thread.isPinned && <span className="mr-1">&#x1F4CC;</span>}
              {thread.title}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              {thread.authorUsername} &middot; {dateStr}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {thread.isPinned && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                Pinned
              </span>
            )}
            {thread.isResolved && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                Resolved
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          <span>{thread.postCount} {thread.postCount === 1 ? "reply" : "replies"}</span>
          <span>{thread.upvoteCount} {thread.upvoteCount === 1 ? "upvote" : "upvotes"}</span>
        </div>
      </button>

      {isInstructor && (
        <div className="flex justify-end gap-1 px-3 pb-2">
          <button
            onClick={(e) => { e.stopPropagation(); onPinToggle(thread); }}
            className="text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-500 hover:text-yellow-600 hover:border-yellow-300 transition-colors"
            title={thread.isPinned ? "Unpin" : "Pin"}
          >
            {thread.isPinned ? "Unpin" : "Pin"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm("Delete this thread? This cannot be undone.")) {
                onDelete(thread);
              }
            }}
            className="text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300 transition-colors"
            title="Delete thread"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default ThreadCard;
