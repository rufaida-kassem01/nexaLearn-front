import { useState } from "react";
import { useToast } from "../../../hooks/useToast";
import { upvotePost } from "../../../services/discussionService";

interface PostCardItem {
  id: string;
  body: string;
  authorUsername?: string;
  authorName?: string;
  isAccepted: boolean;
  isInstructorPost?: boolean;
  upvoteCount: number;
  createdAt: string;
}

interface PostCardProps {
  post: PostCardItem;
  lessonId: string;
  threadId: string;
  isInstructor: boolean;
  onAccept: (postId: string) => Promise<void>;
}

const PostCard = ({ post, lessonId, threadId, isInstructor, onAccept }: PostCardProps) => {
  const [upvoteCount, setUpvoteCount] = useState<number>(post.upvoteCount);
  const [accepted, setAccepted] = useState<boolean>(post.isAccepted);
  const toast = useToast();

  const dateStr = new Date(post.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleUpvote = async () => {
    try {
      const resp = await upvotePost(lessonId, threadId, post.id);
      if (resp.data.upvoted) {
        setUpvoteCount((c) => c + 1);
      }
    } catch {
      toast.error("Failed to upvote.");
    }
  };

  const handleAccept = async () => {
    try {
      await onAccept(post.id);
      setAccepted(true);
    } catch {
      toast.error("Failed to accept answer.");
    }
  };

  return (
    <div
      className={`p-3 rounded-lg border ${
        accepted
          ? "border-green-300 bg-green-50/50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-gray-500">
            <span className="font-medium text-gray-700">{post.authorUsername}</span>
            {" "}&middot; {dateStr}
            {post.isInstructorPost && (
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
                Instructor
              </span>
            )}
            {accepted && (
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                Accepted
              </span>
            )}
          </p>
          <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{post.body}</p>
        </div>

        <div className="shrink-0 flex flex-col items-center gap-1">
          <button
            onClick={handleUpvote}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-200 hover:border-blue-300 hover:text-blue-600 transition-colors text-gray-400"
          >
            &#9650; {upvoteCount}
          </button>
          {isInstructor && !accepted && (
            <button
              onClick={handleAccept}
              className="text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-500 hover:text-green-600 hover:border-green-300 transition-colors"
              title="Accept as answer"
            >
              Accept
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;
