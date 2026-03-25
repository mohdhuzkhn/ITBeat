import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const ref = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  const { data: countData } = useQuery({
    queryKey: ["notif-count"],
    queryFn: () => api.get("/notifications/unread-count").then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: notifsData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get("/notifications").then((r) => r.data),
    enabled: open,
  });

  // const markAllRead = useMutation({
  //   mutationFn: () => api.patch("/notifications/read-all"),
  //   onSuccess: () => {
  //     qc.setQueryData(["notif-count"], { count: 0 });
  //     qc.invalidateQueries({ queryKey: ["notif-count"] });
  //     qc.invalidateQueries({ queryKey: ["notifications"] });
  //   },
  // });
  const markAllRead = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => {
      // 1. Set count to 0 instantly
      qc.setQueryData(["notif-count"], { count: 0 });

      // 2. Update the notification list cache manually to show them as "read"
      qc.setQueryData(["notifications"], (old) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((n) => ({
            ...n,
            is_read: true,
          })),
        };
      });

      // 3. Then fetch fresh data from server to be safe
      qc.invalidateQueries({ queryKey: ["notif-count"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unread = countData?.count || 0;
  const notifications = notifsData?.notifications || [];

  function handleOpen() {
    const newOpen = !open;
    setOpen(newOpen);
    if (newOpen && unread > 0) markAllRead.mutate();
  }

  function handleNotifClick(postId) {
    setOpen(false);
    navigate(`/posts/${postId}`);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="btn-ghost relative"
        style={{ padding: "6px 10px" }}
      >
        <span style={{ fontSize: "18px" }}>🔔</span>
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              background: "#ef4444",
              color: "white",
              borderRadius: "999px",
              fontSize: "10px",
              fontWeight: "600",
              minWidth: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="card"
          style={{
            position: "fixed",
            top: "56px",
            right: "8px",
            left: "8px",
            maxWidth: "360px",
            marginLeft: "auto",
            maxHeight: "70vh",
            overflowY: "auto",
            zIndex: 999,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-800">
              Notifications
            </span>
            <div className="flex items-center gap-3">
              {notifications.length > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No notifications yet
            </div>
          ) : (
            <div>
              {/* {notifications.map((n) => {
                const timeAgo = formatDistanceToNow(new Date(n.created_at), {
                  addSuffix: true,
                });
                const message =
                  n.type === "like"
                    ? "liked your post"
                    : "commented on your post";

                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n.post_id)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0"
                  >
                    <p className="text-sm text-gray-800">
                      <strong>{n.actor_username}</strong> {message}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {n.post_title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo}</p>
                  </button>
                );
              })} */}
              {notifications.map((n) => {
                // 1. Check for unread status (Postgres usually returns true/false)
                const isUnread = n.is_read === false;

                // 2. Prepare the time and message strings
                const timeAgo = n.created_at
                  ? formatDistanceToNow(new Date(n.created_at), {
                      addSuffix: true,
                    })
                  : "";

                const message =
                  n.type === "like"
                    ? "liked your post"
                    : "commented on your post";

                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n.post_id)}
                    className={`w-full text-left px-4 py-3 transition border-b border-gray-50 last:border-0 ${
                      isUnread
                        ? "bg-blue-50/40 hover:bg-blue-100/60" // Light blue tint for unread
                        : "bg-white hover:bg-gray-50" // Plain white for read
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">
                          <strong
                            className={
                              isUnread
                                ? "text-blue-700 font-bold"
                                : "font-semibold"
                            }
                          >
                            {n.actor_username}
                          </strong>{" "}
                          {message}
                        </p>

                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {n.post_title}
                        </p>

                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-medium">
                          {timeAgo}
                        </p>
                      </div>

                      {/* 3. The Visual "Unread Dot" Indicator */}
                      {isUnread && (
                        <span
                          className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5 shadow-sm shadow-blue-200"
                          title="Unread"
                        ></span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
