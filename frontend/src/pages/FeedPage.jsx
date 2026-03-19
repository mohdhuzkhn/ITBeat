import { useQuery } from "@tanstack/react-query";
import { postService } from "../services/api";
import PostCard from "../components/feed/PostCard";
import { useSearchParams, useLocation } from "react-router-dom";

const CATEGORIES = [
  { label: "All", slug: "" },
  { label: "AI & ML", slug: "ai-ml" },
  { label: "Web Dev", slug: "web-dev" },
  { label: "Cloud/DevOps", slug: "cloud-devops" },
  { label: "Hardware", slug: "hardware" },
];

export default function FeedPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "";
  const search = params.get("q") || "";
  const submitted = params.get("submitted") === "true";
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

      <div className="flex md:hidden gap-2 overflow-x-auto pb-2 mb-6">
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => setParams(c.slug ? { category: c.slug } : {})}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition ${
              category === c.slug
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            {c.label}
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
