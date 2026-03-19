import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { postService } from '../services/api';
import api from '../services/api';

export default function CreatePostPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: postService.create,
    onSuccess: (res) => {
      const { post } = res.data;
      if (post.status === 'approved') {
        navigate(`/posts/${post.id}`);
      } else {
        navigate('/?submitted=true');
      }
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Something went wrong.');
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const form = new FormData(e.target);
    mutation.mutate({
      title:       form.get('title'),
      body:        form.get('body'),
      category_id: form.get('category_id'),
    });
  }

  const categories = catData?.categories || [];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Submit an update</h1>
      <p className="text-sm text-gray-500 mb-8">
        Share a short news update, discovery, or resource with the community.
      </p>
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            name="title"
            required
            className="input"
            placeholder="e.g. GPT-5 announced with new reasoning capabilities"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select name="category_id" required className="input">
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            name="body"
            required
            rows={6}
            className="input resize-none"
            placeholder="Describe the update, include relevant details, links, or context..."
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Submitting...' : 'Submit post'}
          </button>
        </div>
      </form>
      <p className="text-xs text-gray-400 mt-4 text-center">
        New accounts are reviewed before publishing. Trusted members publish instantly.
      </p>
    </div>
  );
}