import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listNotifications, markAsRead, markAllAsRead } from "../services/notificationService";

const NotificationList = ({ onClose }) => {
  const navigate = useNavigate();
  const ref = useRef(null);
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (cursor) => {
    setLoading(true);
    try {
      const resp = await listNotifications({ cursor, limit: 20 });
      const data = resp.data;
      if (cursor) {
        setItems((prev) => [...prev, ...data.items]);
      } else {
        setItems(data.items);
      }
      setNextCursor(data.nextCursor);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(null);
  }, [fetch]);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent
    }
  };

  const handleClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id);
        setItems((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
      } catch {
        // silent
      }
    }
    const data = notification.data || {};
    if (data.courseId) {
      navigate(`/course/${data.courseId}`);
    } else if (data.lessonId) {
      navigate(`/player/${data.courseId || ""}/${data.lessonId}`);
    }
    onClose?.();
  };

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-custom-card border border-gray-100 z-50 max-h-96 flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h4 className="text-sm font-semibold text-gray-800">Notifications</h4>
        {items.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-blue-600 hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        {loading && items.length === 0 && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">
            No notifications yet.
          </p>
        )}

        {items.map((n) => (
          <button
            key={n.id}
            onClick={() => handleClick(n)}
            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-b-0 ${
              !n.isRead ? "bg-blue-50/40" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {!n.isRead && (
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5 shrink-0" />
                  )}
                  {n.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                  {n.body}
                </p>
              </div>
              <span className="shrink-0 text-xs text-gray-400">
                {timeAgo(n.createdAt)}
              </span>
            </div>
          </button>
        ))}

        {nextCursor && (
          <button
            onClick={() => fetch(nextCursor)}
            disabled={loading}
            className="w-full text-center py-2 text-xs text-blue-600 hover:bg-gray-50 disabled:opacity-50 transition"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationList;
