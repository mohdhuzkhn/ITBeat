import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { postService } from '../services/api';
import PostCard from '../components/feed/PostCard';

const CATEGORIES = [
  { label: 'All',          slug: '' },
  { label: 'AI & ML',      slug: 'ai-ml' },
  { label: 'Web Dev',      slug: 'web-dev' },
  { label: 'Cloud/DevOps', slug: 'cloud-devops' },
  { label: 'Hardware',     slug: 'hardware' },
];

export default function FeedPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const search   = params.get('q') || '';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['posts', category, search],
    queryFn:  () => postService.list({
      category: category || undefined,
      q: search || undefined
    }).then(r => r.data),
  });

  function handleSearch(e) {
    e.preventDefault();
    const q = e.target.q.value.trim();
    setParams(q ? { q } : {});
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          name="q"
          defaultValue={search}
          placeholder="Search IT updates..."
          className="input flex-1"
        />
        <button type="submit" className="btn-primary">Search</button>
        {search && (
          <button type="button" className="btn-ghost" onClick={() => setParams({})}>
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
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600'
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