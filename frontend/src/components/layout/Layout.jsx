import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import NotificationBell from './NotificationBell';

const CATEGORIES = [
  { label: 'All',        slug: '' },
  { label: 'AI & ML',    slug: 'ai-ml' },
  { label: 'Web Dev',    slug: 'web-dev' },
  { label: 'Cloud',      slug: 'cloud-devops' },
  { label: 'Hardware',   slug: 'hardware' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  const isMod = user && ['moderator', 'admin'].includes(user.role);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="text-xl font-bold text-blue-600 tracking-tight">
            ITBeat
          </Link>
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                to={c.slug ? `/?category=${c.slug}` : '/'}
                className="px-3 py-1 rounded-full text-sm text-gray-600 hover:bg-gray-100 whitespace-nowrap transition"
              >
                {c.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <>
                {isMod && (
                  <Link to="/admin/queue" className="btn-ghost text-orange-600 hover:bg-orange-50">
                    Queue
                  </Link>
                )}
                <NotificationBell />
                <Link to="/submit" className="btn-primary">+ Submit</Link>
                <span className="text-sm text-gray-500 hidden md:block">{user.username}</span>
                <button onClick={handleLogout} className="btn-ghost">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">Login</Link>
                <Link to="/register" className="btn-primary">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        ITBeat © {new Date().getFullYear()} — Stay updated.
      </footer>
    </div>
  );
}