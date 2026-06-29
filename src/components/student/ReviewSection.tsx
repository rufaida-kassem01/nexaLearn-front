import { useCallback, useEffect, useRef, useState } from "react";
import { assets } from "../../assets/assets";
import Rating from "./Rating";
import { useToast } from "../../hooks/useToast";
import type { User } from "../../types";
import {
  getCourseReviews,
  createReview,
  updateReview,
  deleteReview,
  flagReview,
} from "../../services/reviewService";

const REVIEWS_PER_PAGE = 10;

const FLAG_REASONS: { label: string; value: string }[] = [
  { label: "Spam or misleading", value: "USER_REPORTED" },
  { label: "Inappropriate content", value: "USER_REPORTED" },
  { label: "Harassment", value: "USER_REPORTED" },
];

interface ReviewUser {
  id?: string;
  firstName?: string;
  lastName?: string;
}

interface ReviewItem {
  id: string;
  userId?: string;
  rating: number;
  comment?: string;
  body?: string;
  title?: string;
  createdAt: string;
  user?: ReviewUser;
}

interface ReviewSectionProps {
  courseId: string;
  user: User | null;
  enrolled: boolean;
}

const ReviewSection = ({ courseId, user, enrolled }: ReviewSectionProps) => {
  const toast = useToast();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsPage, setReviewsPage] = useState<number>(1);
  const [reviewsTotal, setReviewsTotal] = useState<number>(0);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(false);
  const reviewsFetched = useRef<boolean>(false);

  const [reviewFormShown, setReviewFormShown] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string>("");

  const [editReviewId, setEditReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number>(0);
  const [editComment, setEditComment] = useState<string>("");
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);
  const [editError, setEditError] = useState<string>("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState<boolean>(false);

  const [flaggedReviewIds, setFlaggedReviewIds] = useState<Set<string>>(new Set());
  const [activeFlagReviewId, setActiveFlagReviewId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState<string>(FLAG_REASONS[0].label);
  const [flagSubmitting, setFlagSubmitting] = useState<boolean>(false);

  const myReview: ReviewItem | undefined = Array.isArray(reviews)
    ? reviews.find((r) => (r.user as ReviewUser)?.id === user?.id)
    : undefined;

  const resetForm = useCallback(() => {
    setReviewFormShown(false);
    setReviewRating(0);
    setReviewComment("");
    setReviewError("");
  }, []);

  const resetEdit = useCallback(() => {
    setEditReviewId(null);
    setEditRating(0);
    setEditComment("");
    setEditError("");
    setDeleteConfirmId(null);
  }, []);

  const fetchReviews = useCallback(async (page: number) => {
    setReviewsLoading(true);
    try {
      const data = await getCourseReviews(courseId, { page, limit: REVIEWS_PER_PAGE });
      const list: ReviewItem[] = Array.isArray(data.items) ? data.items : Array.isArray(data.reviews) ? data.reviews : [];
      setReviews((prev) => (page === 1 ? list : [...prev, ...list]));
      setReviewsTotal(data.total ?? 0);
      setReviewsPage(page);
    } catch {
      // silently fail
    } finally {
      setReviewsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (!reviewsFetched.current) {
      reviewsFetched.current = true;
      fetchReviews(1);
    }
  }, [fetchReviews]);

  const handleCreateReview = async () => {
    if (reviewRating === 0) return;
    setReviewSubmitting(true);
    setReviewError("");

    const optimistic: ReviewItem = {
      id: `optimistic-${Date.now()}`,
      rating: reviewRating,
      comment: reviewComment.trim(),
      user: { id: user?.id, firstName: user?.firstName, lastName: user?.lastName },
      createdAt: new Date().toISOString(),
    };

    const prevReviews = reviews;
    setReviews((prev) => [optimistic, ...prev]);
    setReviewsTotal((prev) => prev + 1);
    resetForm();

    try {
      const saved = await createReview(courseId, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviews((prev) =>
        prev.map((r) => (r.id === optimistic.id ? { ...saved, user: optimistic.user } : r)),
      );
    } catch (err: unknown) {
      setReviews(prevReviews);
      setReviewsTotal((prev) => prev - 1);
      const apiErr = err as { status?: number; message?: string; response?: { data?: { message?: string } } };
      if (apiErr.status === 403) {
        setReviewError("Complete at least one lesson to leave a review.");
      } else {
        setReviewError(apiErr.message || "Failed to submit review.");
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleStartEdit = () => {
    if (!myReview) return;
    setEditReviewId(myReview.id);
    setEditRating(myReview.rating);
    setEditComment(myReview.comment || "");
  };

  const handleUpdateReview = async () => {
    if (editRating === 0 || !editReviewId) return;
    setEditSubmitting(true);
    setEditError("");

    const prevReviews = reviews;
    setReviews((prev) =>
      prev.map((r) =>
        r.id === editReviewId
          ? { ...r, rating: editRating, comment: editComment.trim() }
          : r,
      ),
    );

    try {
      await updateReview(editReviewId, {
        rating: editRating,
        comment: editComment.trim(),
      });
      resetEdit();
    } catch (err: unknown) {
      setReviews(prevReviews);
      const apiErr = err as { message?: string };
      setEditError(apiErr.message || "Failed to update review.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!myReview || !deleteConfirmId) return;
    setDeleteSubmitting(true);

    const prevReviews = reviews;
    setReviews((prev) => prev.filter((r) => r.id !== deleteConfirmId));
    setReviewsTotal((prev) => prev - 1);
    setDeleteConfirmId(null);
    resetEdit();

    try {
      await deleteReview(deleteConfirmId);
    } catch {
      const deleted = prevReviews.find((r) => r.id === deleteConfirmId);
      if (deleted) {
        setReviews((prev) => [...prev, deleted]);
        setReviewsTotal((prev) => prev + 1);
      }
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const reviewCommentText = (review: ReviewItem): string =>
    review.comment || review.body || review.title || "";

  return (
    <div className="pb-20">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">
        Reviews ({reviewsTotal})
      </h3>

      {enrolled === true && !reviewFormShown && !myReview && (
        <button
          onClick={() => setReviewFormShown(true)}
          className="mb-6 px-5 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition"
        >
          Write a Review
        </button>
      )}

      {enrolled === true && reviewFormShown && !myReview && (
        <div className="mb-6 border border-gray-200 rounded-lg p-5">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">
            Write Your Review
          </h4>
          <Rating initialRating={reviewRating} onRate={setReviewRating} />
          <textarea
            rows={4}
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Share your thoughts about this course\u2026"
            className="mt-3 w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
          />
          {reviewError && (
            <p className="mt-2 text-red-500 text-xs">{reviewError}</p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleCreateReview}
              disabled={reviewRating === 0 || reviewSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {reviewSubmitting ? "Submitting\u2026" : "Submit"}
            </button>
            <button
              onClick={resetForm}
              disabled={reviewSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded text-sm hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {myReview && editReviewId !== myReview.id && (
        <div className="mb-6 border border-blue-100 bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
              Your Review
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleStartEdit}
                className="text-xs text-blue-600 hover:underline"
              >
                Edit
              </button>
              {deleteConfirmId === myReview.id ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteReview}
                    disabled={deleteSubmitting}
                    className="text-xs text-red-600 hover:underline disabled:opacity-50"
                  >
                    {deleteSubmitting ? "Deleting\u2026" : "Confirm"}
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirmId(myReview.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <img
                key={star}
                src={
                  star <= myReview.rating
                    ? assets.star
                    : assets.star_blank
                }
                alt=""
                className="w-3 h-3"
              />
            ))}
          </div>
          {reviewCommentText(myReview) && (
            <p className="text-sm text-gray-700">
              {reviewCommentText(myReview)}
            </p>
          )}
        </div>
      )}

      {editReviewId && (
        <div className="mb-6 border border-yellow-200 bg-yellow-50 rounded-lg p-5">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">
            Edit Your Review
          </h4>
          <Rating initialRating={editRating} onRate={setEditRating} />
          <textarea
            rows={4}
            value={editComment}
            onChange={(e) => setEditComment(e.target.value)}
            placeholder="Update your thoughts\u2026"
            className="mt-3 w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
          />
          {editError && (
            <p className="mt-2 text-red-500 text-xs">{editError}</p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleUpdateReview}
              disabled={editRating === 0 || editSubmitting}
              className="px-4 py-2 bg-yellow-600 text-white rounded text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {editSubmitting ? "Saving\u2026" : "Save"}
            </button>
            <button
              onClick={resetEdit}
              disabled={editSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded text-sm hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {reviews.length === 0 && !reviewsLoading && (
        <p className="text-gray-400 text-sm">No reviews yet.</p>
      )}

      <div className="space-y-5">
        {reviews.map((review) => {
          if (myReview && review.id === myReview.id) return null;
          return (
            <div
              key={review.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-700">
                  {((review.user as ReviewUser)?.firstName?.[0] || "U").toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {(review.user as ReviewUser)?.firstName || "Anonymous"}{" "}
                    {(review.user as ReviewUser)?.lastName || ""}
                  </p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <img
                        key={star}
                        src={
                          star <= (review.rating || 0)
                            ? assets.star
                            : assets.star_blank
                        }
                        alt=""
                        className="w-3 h-3"
                      />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              {reviewCommentText(review) && (
                <p className="text-sm text-gray-600 mt-1">
                  {reviewCommentText(review)}
                </p>
              )}

              <div className="mt-2">
                {flaggedReviewIds.has(review.id) ? (
                  <span className="text-xs text-gray-400 italic">Reported</span>
                ) : activeFlagReviewId === review.id ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={flagReason}
                      onChange={(e) => setFlagReason(e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                      {FLAG_REASONS.map((r) => (
                        <option key={r.label} value={r.label}>{r.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={async () => {
                        setFlagSubmitting(true);
                        try {
                          await flagReview(review.id, { reason: "USER_REPORTED" });
                          setFlaggedReviewIds((prev) => new Set(prev).add(review.id));
                          setActiveFlagReviewId(null);
                          toast.success("Review reported.");
                        } catch (err: unknown) {
                          const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
                          toast.error(apiErr?.response?.data?.message || apiErr.message || "Failed to report.");
                        } finally {
                          setFlagSubmitting(false);
                        }
                      }}
                      disabled={flagSubmitting}
                      className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {flagSubmitting ? "\u2026" : "Submit"}
                    </button>
                    <button
                      onClick={() => setActiveFlagReviewId(null)}
                      className="text-xs text-gray-500 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setActiveFlagReviewId(review.id);
                      setFlagReason(FLAG_REASONS[0].label);
                    }}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Report
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {reviewsLoading && (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!reviewsLoading && reviews.length < reviewsTotal && (
        <button
          onClick={() => fetchReviews(reviewsPage + 1)}
          className="mt-6 text-blue-600 text-sm font-medium hover:underline"
        >
          Load more reviews ({reviewsTotal - reviews.length} remaining)
        </button>
      )}
    </div>
  );
};

export default ReviewSection;
