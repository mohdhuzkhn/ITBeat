import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function LikeButton({ postId }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['likes', postId],
    queryFn: () => api.get(`/posts/${postId}/likes`).then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: () => api.post(`/posts/${postId}/like`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['likes', postId] });
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  function handleLike() {
    if (!user) return navigate('/login');
    mutation.mutate();
  }

  const liked = data?.liked || false;
  const likes = data?.likes || 0;

  return (
    <button
      onClick={handleLike}
      disabled={mutation.isPending}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95 ${
        liked
          ? 'bg-red-50 text-red-500 border border-red-200'
          : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-red-50 hover:text-red-400 hover:border-red-200'
      }`}
    >
      <span style={{ fontSize: '14px' }}>{liked ? '❤️' : '🤍'}</span>
      <span>{likes}</span>
    </button>
  );
}