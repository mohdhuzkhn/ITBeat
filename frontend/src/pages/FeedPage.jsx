import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { postService } from "../services/api";
import PostCard from "../components/feed/PostCard";
import api from "../services/api";

export default function FeedPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "";
  const search = params.get("q") || "";
  const submitted = params.get("submitted") === "true";

  // Fetch categories for filter tabs
  const { data: catData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories").then(r => r.data),
  });

  // Filter tabs: exclude General
  const filterCategories = (catData?.categories || []).filter(
    c => c.slug !== "general"
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["posts", category, search],
    queryFn: () =>
      postService
        .list({
          category: category || undefined,
          q: search || undefined,
        })
        .then((r) => r.data),
  });

  function handleSearch(e) {
    e.preventDefault();
    const q = e.target.q.value.trim();
    setParams(q ? { q } : {});
  }

  function handleCategoryTab(slug) {
    if (slug === "") {
      setParams({});
    } else {
      setParams({ category: slug });
    }
  }

  return (
    <div>
      {submitted && (
        <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 flex items-start gap-3">
          <span style={{ fontSize: "20px" }}>🕐</span>
          <div>
            <p className="text-sm font-semibold text-blue-800">
              Post submitted for review!
            </p>
            <p className="text-sm text-blue-600 mt-0.5">
              Your post is in the moderation queue. It will appear on the feed
              once approved by a moderator. You will be notified when it goes
              live.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          name="q"
          defaultValue={search}
          placeholder="Search IT updates..."
          className="input flex-1"
        />
        <button type="submit" className="btn-primary">
          Search
        </button>
        {search && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setParams({})}
          >
            Clear
          </button>
        )}
      </form>

      {/* Category filter tabs — General is excluded */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => handleCategoryTab("")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
            category === ""
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {filterCategories.map((c) => (
          <button
            key={c.id}
            onClick={() => handleCategoryTab(c.slug)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              category === c.slug
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {search && (
        <p className="text-sm text-gray-500 mb-4">
          Results for <strong>"{search}"</strong>
        </p>
      )}

      {isLoading && (
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 h-32 animate-pulse bg-gray-100" />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-20 text-gray-400">
          Failed to load posts. Please try again.
        </div>
      )}

      {!isLoading && data?.posts?.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          No posts yet. Be the first to submit one!
        </div>
      )}

      {data?.posts && (
        <div className="grid gap-4">
          {data.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}