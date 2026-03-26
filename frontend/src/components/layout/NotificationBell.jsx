import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open]);

  const { data: countData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: () => api.get('/notifications/unread-count').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: notifsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    enabled: open,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      // FIX 1: Only do optimistic update — NO refetch calls
      // Update count to 0
      qc.setQueryData(['notif-count'], { count: 0 });

      // Update notifications list in cache directly (mark all as read)
      qc.setQueryData(['notifications'], (old) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map(n => ({ ...n, is_read: true })),
        };
      });
    },
  });

  const unread = countData?.count || 0;
  const notifications = notifsData?.notifications || [];

  function handleOpen() {
    const newOpen = !open;
    setOpen(newOpen);
    // FIX 2: Removed auto mark-all-read on bell click
    // Let the user explicitly click "Mark all read" instead
  }

  function handleNotifClick(postId) {
    setOpen(false);
    navigate(`/posts/${postId}`);
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={handleOpen}
        className="btn-ghost relative"
        style={{ padding: '6px 10px' }}
      >
        <span style={{ fontSize: '18px' }}>🔔</span>
        {unread > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '999px',
            fontSize: '10px',
            fontWeight: '600',
            minWidth: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="card"
          style={{
            position: 'fixed',
            top: '56px',
            right: '8px',
            left: '8px',
            maxWidth: '360px',
            marginLeft: 'auto',
            maxHeight: '70vh',
            overflowY: 'auto',
            zIndex: 999,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-800">
              Notifications
            </span>
            <div className="flex items-center gap-3">
              {notifications.some(n => !n.is_read) && (
                <button
                  onClick={() => markAllRead.mutate()}
                  // FIX 3: Disable button while mutation is running
                  disabled={markAllRead.isPending}
                  className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                >
                  {markAllRead.isPending ? 'Marking...' : 'Mark all read'}
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No notifications yet
            </div>
          ) : (
            <div>
              {notifications.map((n) => {
                const timeAgo = formatDistanceToNow(
                  new Date(n.created_at), { addSuffix: true }
                );
                const message = n.type === 'like'
                  ? 'liked your post'
                  : 'commented on your post';

                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n.post_id)}
                    // FIX 4: Visual distinction for unread notifications
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0 ${
                      !n.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <p className="text-sm text-gray-800">
                      {/* FIX 4: Bold dot indicator for unread */}
                      {!n.is_read && (
                        <span style={{
                          display: 'inline-block',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#3b82f6',
                          marginRight: '6px',
                          verticalAlign: 'middle',
                        }} />
                      )}
                      <strong>{n.actor_username}</strong> {message}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {n.post_title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}