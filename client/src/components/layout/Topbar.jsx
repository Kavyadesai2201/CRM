// /client/src/components/layout/Topbar.jsx
import { useLocation } from "react-router-dom";

const PAGE_TITLES = {
  "/dashboard":  "Dashboard",
  "/leads":      "Leads",
  "/pipeline":   "Pipeline",
  "/analytics":  "Analytics",
};

export default function Topbar() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? "CRM";
  return (
    <header className="h-14 flex-shrink-0 flex items-center gap-4 px-6 border-b border-white/10 bg-black/10 backdrop-blur-md">
      <h2 className="text-sm font-semibold text-white flex-1">{title}</h2>
      <div className="flex items-center gap-3">
        <button id="btn-notifications" className="btn-ghost py-1.5 px-3 text-base">🔔</button>
        <div className="text-xs text-gray-500">{new Date().toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})}</div>
      </div>
    </header>
  );
}
