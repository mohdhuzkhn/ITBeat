import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "../store/authStore";
import { postService, adminService } from "../services/api";
import LikeButton from "../components/feed/LikeButton";
import CommentSection from "../components/feed/CommentSection";
import clsx from "clsx";
import api from "../services/api";

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
  const qc = useQueryClient();
  const isAdmin = user?.role === "admin";

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editError, setEditError] = useState("");

  // Fetch post
  const { data, isLoading, isError } = useQuery({
    queryKey: ["post", id],
    queryFn: () => postService.get(id).then((r) => r.data),
  });

  // Fetch categories (for dropdown)
  const { data: catData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories").then((r) => r.data),
    enabled: isAdmin, // only fetch if admin
  });

  const categories = catData?.categories || [];

  // Delete mutation
  const deletePost = useMutation({
    mutationFn: () => adminService.deletePost(id),
    onSuccess: () => navigate("/"),
  });

  // Edit mutation
  const editPost = useMutation({
    mutationFn: (payload) => api.patch(`/posts/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["post", id] });
      setEditing(false);
      setEditError("");
    },
    onError: (err) => {
      setEditError(err.response?.data?.error || "Failed to update post.");
    },
  });

  function handleDelete() {
    if (window.confirm("Are you sure you want to delete this post?")) {
      deletePost.mutate();
    }
  }

  function handleEditOpen() {
    // Pre-fill form with current values
    setEditTitle(data.title);
    setEditBody(data.body);
    // Find matching category id from categories list
    const match = categories.find((c) => c.slug === data.category_slug);
    setEditCategoryId(match?.id || "");
    setEditError("");
    setEditing(true);
  }

  function handleEditSubmit(e) {
    e.preventDefault();
    if (!editCategoryId) {
      setEditError("Please select a category.");
      return;
    }
    editPost.mutate({
      title: editTitle,
      body: editBody,
      category_id: editCategoryId,
    });
  }

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

  // ── EDIT MODE ──────────────────────────────────────────────
  if (editing) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setEditing(false)}
          className="text-sm text-blue-600 hover:underline mb-6 inline-block"
        >
          ← Cancel edit
        </button>

        <div className="card p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Edit Post</h2>

          <form onSubmit={handleEditSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="input w-full"
                minLength={5}
                maxLength={200}
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                className="input w-full"
                required
              >
                <option value="">Select a category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="input w-full"
                rows={10}
                minLength={10}
                maxLength={5000}
                required
                style={{ resize: "vertical" }}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {editBody.length} / 5000
              </p>
            </div>

            {/* Error */}
            {editError && (
              <p className="text-sm text-red-500">{editError}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={editPost.isPending}
                className="btn-primary flex-1"
              >
                {editPost.isPending ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="btn-ghost flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── VIEW MODE ──────────────────────────────────────────────
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
              <>
                <button
                  onClick={handleEditOpen}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition active:scale-95"
                >
                  Edit post
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deletePost.isPending}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 border border-red-200 hover:bg-red-50 transition active:scale-95"
                >
                  {deletePost.isPending ? "Deleting..." : "Delete post"}
                </button>
              </>
            )}
            <LikeButton postId={id} />
          </div>
        </div>

        <CommentSection postId={id} />
      </article>
    </div>
  );
}