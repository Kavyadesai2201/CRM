// /client/src/components/layout/Sidebar.jsx
import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../store/authStore.js";

const NAV = [
  { to: "/dashboard", icon: "📊", label: "Dashboard" },
  { to: "/leads",     icon: "👥", label: "Leads" },
  { to: "/pipeline",  icon: "🔀", label: "Pipeline" },
  { to: "/analytics", icon: "📈", label: "Analytics" },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  return (
    <aside className="w-[260px] flex-shrink-0 flex flex-col border-r border-white/10 bg-black/20 backdrop-blur-md">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 flex items-center justify-center text-xl">🚀</div>
          <div>
            <p className="text-sm font-bold text-white">TechCRM</p>
            <p className="text-xs text-gray-500">Sales Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 mb-2">Menu</p>
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to} to={to} id={`nav-${label.toLowerCase()}`}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-sm font-bold text-brand-400">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name ?? "User"}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role ?? "agent"}</p>
          </div>
          <button id="btn-logout" onClick={logout} title="Sign out"
            className="text-gray-500 hover:text-red-400 transition text-lg">⏻</button>
        </div>
      </div>
    </aside>
  );
}
