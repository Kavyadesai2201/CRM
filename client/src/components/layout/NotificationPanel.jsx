// /client/src/components/layout/NotificationPanel.jsx
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, useMarkAllRead } from '../../hooks/useNotifications.js';

const TYPE_META = {
  new_lead:     { icon: '👤', color: 'text-green-400',  label: 'New lead'     },
  stage_change: { icon: '🔀', color: 'text-blue-400',   label: 'Stage change' },
  note_added:   { icon: '📝', color: 'text-purple-400', label: 'Note'         },
};

function timeAgo(dateStr) {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60)    return 'now';
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function NotificationPanel({ onClose }) {
  const panelRef      = useRef(null);
  const navigate      = useNavigate();
  const { data: notifications = [] } = useNotifications();
  const markAllRead   = useMarkAllRead();

  // Close on click-outside
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleNotifClick = (notif) => {
    onClose();
    if (notif.lead_id) navigate('/leads');
  };

  const handleMarkAll = () => {
    markAllRead.mutate();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 z-50
                 glass border border-white/10 rounded-2xl shadow-2xl shadow-black/60
                 flex flex-col overflow-hidden"
      style={{ maxHeight: '420px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full
                             bg-red-500/20 text-red-400 border border-red-500/30">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <span className="text-2xl">🔔</span>
            <p className="text-sm text-gray-500">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const meta = TYPE_META[notif.type] ?? { icon: '•', color: 'text-gray-400', label: notif.type };
            return (
              <button
                key={notif.id}
                onClick={() => handleNotifClick(notif)}
                className={`w-full text-left px-4 py-3 border-b border-white/5 last:border-0
                            flex items-start gap-3 transition-colors
                            ${notif.read
                              ? 'hover:bg-white/5'
                              : 'bg-white/[0.04] hover:bg-white/[0.07]'
                            }`}
              >
                {/* Unread dot */}
                <span className="mt-1 flex-shrink-0 relative">
                  {!notif.read && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                  )}
                  <span className={`text-base leading-none ${meta.color}`}>{meta.icon}</span>
                </span>

                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${notif.read ? 'text-gray-400' : 'text-gray-200'}`}>
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{timeAgo(notif.created_at)}</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
