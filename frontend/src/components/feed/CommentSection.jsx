import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import clsx from 'clsx';

const ROLE_BADGE = {
  trusted:   { label: 'Trusted',  cls: 'bg-green-100 text-green-700' },
  moderator: { label: 'Mod',      cls: 'bg-orange-100 text-orange-700' },
  admin:     { label: 'Admin',    cls: 'bg-red-100 text-red-700' },
};

export default function CommentSection({ postId }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [body, setBody] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => api.get(`/posts/${postId}/comments`).then(r => r.data),
  });

  const addComment = useMutation({
    mutationFn: () => api.post(`/posts/${postId}/comments`, { body }),
    onSuccess: () => {
      setBody('');
      qc.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: (commentId) => api.delete(`/posts/${postId}/comments/${commentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', postId] }),
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!body.trim()) return;
    addComment.mutate();
  }

  const comments = data?.comments || [];

  return (
    <div className="mt-8 border-t border-gray-100 pt-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">
        {comments.length} Comment{comments.length !== 1 ? 's' : ''}
      </h3>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-6 flex gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold uppercase text-sm shrink-0">
            {user.username?.[0]}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write a comment..."
              className="input flex-1"
              maxLength={1000}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={addComment.isPending || !body.trim()}
            >
              {addComment.isPending ? '...' : 'Post'}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-gray-400 mb-6">
          <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline">
            Sign in
          </button>{' '}
          to leave a comment.
        </p>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      <div className="space-y-4">
        {comments.map((comment) => {
          const roleBadge = ROLE_BADGE[comment.author_role];
          const timeAgo = formatDistanceToNow(
            new Date(comment.created_at), { addSuffix: true }
          );
          const canDelete = user && (
            user.id === comment.user_id ||
            ['moderator', 'admin'].includes(user.role)
          );

          return (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold uppercase text-sm shrink-0">
                {comment.username?.[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-800">
                    {comment.username}
                  </span>
                  {roleBadge && (
                    <span className={clsx('badge', roleBadge.cls)}>
                      {roleBadge.label}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{timeAgo}</span>
                  {canDelete && (
                    <button
                      onClick={() => deleteComment.mutate(comment.id)}
                      className="ml-auto text-xs text-gray-400 hover:text-red-500 transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {comment.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {!isLoading && comments.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-6">
          No comments yet. Be the first!
        </p>
      )}
    </div>
  );
}