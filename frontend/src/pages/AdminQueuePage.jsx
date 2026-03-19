import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { adminService } from '../services/api';

export default function AdminQueuePage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-queue'],
    queryFn:  () => adminService.getQueue().then(r => r.data),
    refetchInterval: 30000,
  });

  const approve = useMutation({
    mutationFn: adminService.approvePost,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-queue'] }),
  });

  const reject = useMutation({
    mutationFn: adminService.rejectPost,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-queue'] }),
  });

  const queue = data?.queue || [];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Moderation Queue</h1>
        <span className="badge bg-orange-100 text-orange-700 text-sm">
          {queue.length} pending
        </span>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 h-28 animate-pulse bg-gray-100" />
          ))}
        </div>
      )}

      {!isLoading && queue.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p>Queue is empty. All posts reviewed.</p>
        </div>
      )}

      <div className="space-y-4">
        {queue.map((post) => {
          const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
          const isPending = approve.isPending || reject.isPending;
          return (
            <div key={post.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 leading-snug mb-1">
                    {post.title}
                  </p>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {post.body}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="badge bg-gray-100 text-gray-600">{post.category}</span>
                    <span>by <strong className="text-gray-600">{post.username}</strong></span>
                    <span>{timeAgo}</span>
                    <span>{post.approved_posts_count} approved posts</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    className="btn-primary bg-green-600 hover:bg-green-700 text-sm px-4 py-1.5"
                    onClick={() => approve.mutate(post.id)}
                    disabled={isPending}
                  >
                    Approve
                  </button>
                  <button
                    className="btn-ghost text-red-500 hover:bg-red-50 text-sm px-4 py-1.5"
                    onClick={() => reject.mutate(post.id)}
                    disabled={isPending}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}