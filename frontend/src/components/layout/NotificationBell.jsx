import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

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
      qc.invalidateQueries({ queryKey: ['notif-count'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unread = countData?.count || 0;
  const notifications = notifsData?.notifications || [];

  function handleOpen() {
    setOpen(!open);
    if (!open && unread > 0) markAllRead.mutate();
  }

  function handleNotifClick(postId) {
    setOpen(false);
    navigate(`/posts/${postId}`);
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleOpen}
        className="btn-ghost relative"
        style={{ padding: '6px 10px' }}
      >
        <span style={{ fontSize: '18px' }}>🔔</span>
        {unread > 0 && (
          <span
            style={{
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
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="card"
          style={{
            position: 'absolute',
            right: 0,
            top: '44px',
            width: '320px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 100,
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-800">
              Notifications
            </span>
            {notifications.length > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs text-blue-600 hover:underline"
              >
                Mark all read
              </button>
            )}
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
                  ? `liked your post`
                  : `commented on your post`;

                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n.post_id)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0"
                  >
                    <p className="text-sm text-gray-800">
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