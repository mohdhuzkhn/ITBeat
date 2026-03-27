import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuthStore();

  useEffect(() => {
    const token = params.get('token');
    const userRaw = params.get('user');
    const error = params.get('error');

    if (error || !token || !userRaw) {
      navigate('/login?error=github_failed');
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw));
      loginWithToken(token, user);
      navigate('/');
    } catch {
      navigate('/login?error=github_failed');
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500 text-sm">Signing you in with GitHub...</p>
    </div>
  );
}