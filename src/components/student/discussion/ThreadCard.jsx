const ThreadCard = ({ thread, onSelect }) => {
  const dateStr = new Date(thread.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <button
      onClick={() => onSelect(thread)}
      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate">
            {thread.title}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {thread.authorUsername} &middot; {dateStr}
          </p>
        </div>
        {thread.isResolved && (
          <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
            Resolved
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
        <span>{thread.postCount} {thread.postCount === 1 ? "reply" : "replies"}</span>
        <span>{thread.upvoteCount} {thread.upvoteCount === 1 ? "upvote" : "upvotes"}</span>
      </div>
    </button>
  );
};

export default ThreadCard;
