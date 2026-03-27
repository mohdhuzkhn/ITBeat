import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { userService } from "../services/api";
import { useAuthStore } from "../store/authStore";
import clsx from "clsx";

const CATEGORY_COLORS = {
  "ai-ml": "bg-purple-100 text-purple-700",
  "web-dev": "bg-blue-100 text-blue-700",
  "cloud-devops": "bg-teal-100 text-teal-700",
  hardware: "bg-amber-100 text-amber-700",
};

const ROLE_STYLES = {
  admin: "bg-red-100 text-red-600",
  moderator: "bg-purple-100 text-purple-700",
  trusted: "bg-green-100 text-green-700",
  user: "bg-gray-100 text-gray-500",
};

const TABS = ["Posts", "Liked", "Comments"];

export default function ProfilePage() {
  const { username } = useParams();
  const { user: me } = useAuthStore();
  const [tab, setTab] = useState("Posts");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => userService.getProfile(username).then((r) => r.data),
  });

  if (isLoading)
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="card p-8 animate-pulse space-y-3">
          <div className="h-12 w-12 rounded-full bg-gray-100" />
          <div className="h-5 bg-gray-100 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-1/4" />
        </div>
      </div>
    );

  if (isError)
    return (
      <div className="text-center py-20 text-gray-400">User not found.</div>
    );

  const { user, posts, likedPosts, comments } = data;
  const joinedAgo = formatDistanceToNow(new Date(user.created_at), {
    addSuffix: true,
  });
  const isOwnProfile = me?.username === username;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile card */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl uppercase shrink-0">
          {user.username[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{user.username}</h1>
            {user.role !== "user" && (
              <span
                className={clsx(
                  "text-xs font-medium px-2 py-0.5 rounded-full capitalize",
                  ROLE_STYLES[user.role],
                )}
              >
                {user.role}
              </span>
            )}
            {isOwnProfile && (
              <span className="text-xs text-gray-400">(you)</span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">Joined {joinedAgo}</p>
          <div className="flex gap-4 mt-3 text-sm text-gray-500">
            <span>
              <strong className="text-gray-800">{posts.length}</strong> posts
            </span>
            <span>
              <strong className="text-gray-800">{likedPosts.length}</strong>{" "}
              liked
            </span>
            <span>
              <strong className="text-gray-800">{comments.length}</strong>{" "}
              comments
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "px-4 py-2 text-sm font-medium border-b-2 transition",
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700",
            )}
          >
            {t}
            <span className="ml-1.5 text-xs text-gray-400">
              {t === "Posts"
                ? posts.length
                : t === "Liked"
                  ? likedPosts.length
                  : comments.length}
            </span>
          </button>
        ))}
      </div>

      {/* Posts tab */}
      {tab === "Posts" && (
        <div className="space-y-3">
          {posts.length === 0 ? (
            <p className="text-center py-12 text-gray-400 text-sm">
              No posts yet.
            </p>
          ) : (
            posts.map((p) => {
              const catColor =
                CATEGORY_COLORS[p.category_slug] || "bg-gray-100 text-gray-600";
              return (
                <Link
                  key={p.id}
                  to={`/posts/${p.id}`}
                  className="card p-5 block hover:shadow-md transition"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={clsx(
                        "badge text-xs px-2 py-0.5 rounded-full font-medium",
                        catColor,
                      )}
                    >
                      {p.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(
                        new Date(p.published_at || p.created_at),
                        { addSuffix: true },
                      )}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">
                    {p.title}
                  </p>
                </Link>
              );
            })
          )}
        </div>
      )}

      {/* Liked tab */}
      {tab === "Liked" && (
        <div className="space-y-3">
          {likedPosts.length === 0 ? (
            <p className="text-center py-12 text-gray-400 text-sm">
              No liked posts yet.
            </p>
          ) : (
            likedPosts.map((p) => {
              const catColor =
                CATEGORY_COLORS[p.category_slug] || "bg-gray-100 text-gray-600";
              return (
                <Link
                  key={p.id}
                  to={`/posts/${p.id}`}
                  className="card p-5 block hover:shadow-md transition"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={clsx(
                        "badge text-xs px-2 py-0.5 rounded-full font-medium",
                        catColor,
                      )}
                    >
                      {p.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(p.published_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">
                    {p.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">by {p.author}</p>
                </Link>
              );
            })
          )}
        </div>
      )}

      {/* Comments tab */}
      {tab === "Comments" && (
        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="text-center py-12 text-gray-400 text-sm">
              No comments yet.
            </p>
          ) : (
            comments.map((c) => (
              <Link
                key={c.id}
                to={`/posts/${c.post_id}`}
                className="card p-5 block hover:shadow-md transition"
              >
                <p className="text-xs text-gray-400 mb-1">
                  on{" "}
                  <span className="text-gray-600 font-medium">
                    {c.post_title}
                  </span>
                </p>
                <p className="text-sm text-gray-700 line-clamp-2">{c.body}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(c.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
