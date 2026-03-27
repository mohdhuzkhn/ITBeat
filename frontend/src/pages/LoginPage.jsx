import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const BACKEND_URL = import.meta.env.VITE_API_URL;

export default function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState(
    params.get('error') === 'github_failed'
      ? 'GitHub login failed. Please try again.'
      : params.get('error') === 'no_email'
      ? 'Your GitHub account has no verified email. Please use email/password login.'
      : ''
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(e.target);
    try {
      await login({ email: form.get('email'), password: form.get('password') });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  }

  function handleGitHubLogin() {
    // Redirect browser to backend GitHub OAuth start
    window.location.href = `${BACKEND_URL}/auth/github`;
  }

  return (
    <div className="max-w-sm mx-auto mt-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">Welcome back</h1>
      <p className="text-sm text-gray-500 text-center mb-8">
        Sign in to post and join the community.
      </p>

      <div className="card p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* GitHub OAuth button */}
        <button
          onClick={handleGitHubLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition text-sm font-medium text-gray-700"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          Continue with GitHub
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Email/password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" required className="input" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input name="password" type="password" required className="input" placeholder="••••••••" />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>

      <p className="text-sm text-gray-500 text-center mt-4">
        Don't have an account?{' '}
        <Link to="/register" className="text-blue-600 hover:underline">Sign up</Link>
      </p>
    </div>
  );
}