import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import clsx from "clsx";
import LikeButton from "./LikeButton";

const CATEGORY_COLORS = {
  "ai-ml": "bg-purple-100 text-purple-700",
  "web-dev": "bg-blue-100 text-blue-700",
  "cloud-devops": "bg-teal-100 text-teal-700",
  hardware: "bg-amber-100 text-amber-700",
};

const ROLE_BADGE = {
  trusted: { label: "Trusted", cls: "bg-green-100 text-green-700" },
  moderator: { label: "Mod", cls: "bg-orange-100 text-orange-700" },
  admin: { label: "Admin", cls: "bg-red-100 text-red-700" },
};

export default function PostCard({ post }) {
  const timeAgo = formatDistanceToNow(
    new Date(post.published_at || post.created_at),
    { addSuffix: true },
  );
  const catColor =
    CATEGORY_COLORS[post.category_slug] || "bg-gray-100 text-gray-600";
  const roleBadge = ROLE_BADGE[post.author_role];

  return (
    <article className="card p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-center gap-2 mb-3">
        <span className={clsx("badge", catColor)}>{post.category}</span>
        <span className="text-xs text-gray-400">{timeAgo}</span>
      </div>
      <Link to={`/posts/${post.id}`}>
        <h2 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug mb-2">
          {post.title}
        </h2>
      </Link>
      <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">
        {post.body}
      </p>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold uppercase">
            {post.username?.[0]}
          </div>
          <span>{post.username}</span>
          {roleBadge && (
            <span className={clsx("badge", roleBadge.cls)}>
              {roleBadge.label}
            </span>
          )}
        </div>
        <LikeButton postId={post.id} />
      </div>
    </article>
  );
}
