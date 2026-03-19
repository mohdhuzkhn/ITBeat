import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "../store/authStore";
import { postService, adminService } from "../services/api";
import LikeButton from "../components/feed/LikeButton";
import CommentSection from "../components/feed/CommentSection";
import clsx from "clsx";

const CATEGORY_COLORS = {
  "ai-ml": "bg-purple-100 text-purple-700",
  "web-dev": "bg-blue-100 text-blue-700",
  "cloud-devops": "bg-teal-100 text-teal-700",
  hardware: "bg-amber-100 text-amber-700",
};

export default function PostPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const deletePost = useMutation({
    mutationFn: () => adminService.deletePost(id),
    onSuccess: () => navigate("/"),
  });

  function handleDelete() {
    if (window.confirm("Are you sure you want to delete this post?")) {
      deletePost.mutate();
    }
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ["post", id],
    queryFn: () => postService.get(id).then((r) => r.data),
  });

  if (isLoading)
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 animate-pulse space-y-4">
          <div className="h-6 bg-gray-100 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/4" />
          <div className="space-y-2 pt-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );

  if (isError)
    return (
      <div className="text-center py-20 text-gray-400">Post not found.</div>
    );

  const catColor =
    CATEGORY_COLORS[data.category_slug] || "bg-gray-100 text-gray-600";
  const timeAgo = formatDistanceToNow(
    new Date(data.published_at || data.created_at),
    { addSuffix: true }
  );

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to="/"
        className="text-sm text-blue-600 hover:underline mb-6 inline-block"
      >
        ← Back to feed
      </Link>

      <article className="card p-8">
        <div className="flex items-center gap-2 mb-4">
          <span className={clsx("badge", catColor)}>{data.category}</span>
          <span className="text-xs text-gray-400">{timeAgo}</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-6">
          {data.title}
        </h1>

        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-8">
          {data.body}
        </p>

        <div className="flex items-center justify-between border-t border-gray-100 pt-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold uppercase text-sm">
              {data.username?.[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {data.username}
              </p>
              <p className="text-xs text-gray-400">Posted {timeAgo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={handleDelete}
                disabled={deletePost.isPending}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 border border-red-200 hover:bg-red-50 transition active:scale-95"
              >
                {deletePost.isPending ? "Deleting..." : "Delete post"}
              </button>
            )}
            <LikeButton postId={id} />
          </div>
        </div>

        <CommentSection postId={id} />
      </article>
    </div>
  );
}