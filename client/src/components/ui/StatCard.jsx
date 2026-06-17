// /client/src/components/ui/StatCard.jsx
const COLOR_MAP = {
  blue:   "text-blue-400   bg-blue-500/10   border-blue-500/20",
  green:  "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  red:    "text-red-400    bg-red-500/10    border-red-500/20",
};

export default function StatCard({ label, value, icon, color = "blue" }) {
  return (
    <div className="stat-card group hover:scale-[1.02] transition-transform duration-200">
      <div className={`self-start p-2.5 rounded-xl border text-xl ${COLOR_MAP[color]}`}>{icon}</div>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}
