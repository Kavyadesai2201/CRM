// /client/src/components/layout/Topbar.jsx
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications.js';
import NotificationPanel from './NotificationPanel.jsx';

const PAGE_TITLES = {
  '/dashboard':  'Dashboard',
  '/inbox':      'Inbox',
  '/leads':      'Leads',
  '/pipeline':   'Pipeline',
  '/analytics':  'Analytics',
};

export default function Topbar() {
  const { pathname }                    = useLocation();
  const title                           = PAGE_TITLES[pathname] ?? 'CRM';
  const [panelOpen, setPanelOpen]       = useState(false);
  const { data: notifications = [] }    = useNotifications();
  const unreadCount                     = notifications.filter(n => !n.read).length;

  return (
    <header className="h-14 flex-shrink-0 flex items-center gap-4 px-6 border-b border-white/10 bg-black/10 backdrop-blur-md">
      <h2 className="text-sm font-semibold text-white flex-1">{title}</h2>

      <div className="flex items-center gap-3">
        {/* Bell button with badge */}
        <div className="relative">
          <button
            id="btn-notifications"
            onClick={() => setPanelOpen(prev => !prev)}
            className="btn-ghost py-1.5 px-3 text-base relative"
            aria-label="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1
                               rounded-full bg-red-500 text-white text-[9px] font-bold
                               flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {panelOpen && (
            <NotificationPanel onClose={() => setPanelOpen(false)} />
          )}
        </div>

        <div className="text-xs text-gray-500">
          {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
        </div>
      </div>
    </header>
  );
}
