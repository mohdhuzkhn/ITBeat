import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import NotificationBell from './NotificationBell';

const CATEGORIES = [
  { label: 'All',      slug: '' },
  { label: 'AI & ML',  slug: 'ai-ml' },
  { label: 'Web Dev',  slug: 'web-dev' },
  { label: 'Cloud',    slug: 'cloud-devops' },
  { label: 'Hardware', slug: 'hardware' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isMod = user && ['moderator', 'admin'].includes(user.role);

  function handleLogout() {
    logout();
    navigate('/');
    setMenuOpen(false);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-blue-600 tracking-tight shrink-0">
            ITBeat
          </Link>

          {/* Category pills — desktop only */}
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

          {/* Right side — desktop */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {user ? (
              <>
                {isMod && (
                  <Link to="/admin/queue" className="btn-ghost text-orange-600 hover:bg-orange-50">
                    Queue
                  </Link>
                )}
                <NotificationBell />
                <Link to="/submit" className="btn-primary">+ Submit</Link>
                <span className="text-sm text-gray-500">{user.username}</span>
                <button onClick={handleLogout} className="btn-ghost">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">Login</Link>
                <Link to="/register" className="btn-primary">Sign up</Link>
              </>
            )}
          </div>

          {/* Mobile right side */}
          <div className="flex md:hidden items-center gap-2">
            {user && <NotificationBell />}
            {user && (
              <Link to="/submit" className="btn-primary text-xs px-3 py-1.5">
                + Submit
              </Link>
            )}
            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="w-5 h-0.5 bg-gray-600 mb-1"></div>
              <div className="w-5 h-0.5 bg-gray-600 mb-1"></div>
              <div className="w-5 h-0.5 bg-gray-600"></div>
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2">

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  to={c.slug ? `/?category=${c.slug}` : '/'}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-1 rounded-full text-sm bg-gray-50 text-gray-600 hover:bg-gray-100 whitespace-nowrap transition border border-gray-200"
                >
                  {c.label}
                </Link>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-2 space-y-1">
              {user ? (
                <>
                  <p className="text-sm text-gray-500 px-2 py-1">
                    Signed in as <strong>{user.username}</strong>
                  </p>
                  {isMod && (
                    <Link
                      to="/admin/queue"
                      onClick={() => setMenuOpen(false)}
                      className="block px-2 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg"
                    >
                      Moderation Queue
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-2 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="block px-2 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        ITBeat © {new Date().getFullYear()} — Stay updated.
      </footer>
    </div>
  );
}