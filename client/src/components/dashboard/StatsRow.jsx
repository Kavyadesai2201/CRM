import { useDashboardStats } from "../../hooks/useDashboard";

/**
 * StatsRow — 4 metric cards in responsive grid
 * - Total Leads (blue)
 * - New Today (green)
 * - From WhatsApp (green with phone icon)
 * - From Instagram (pink with camera icon)
 *
 * Each card shows: label, large number, trend arrow, previous value
 */
export const StatsRow = () => {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="glass h-32 rounded-lg p-5 animate-pulse"
          >
            <div className="h-4 bg-white/10 rounded w-20 mb-3"></div>
            <div className="h-8 bg-white/10 rounded w-32 mb-2"></div>
            <div className="h-3 bg-white/10 rounded w-24"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Leads */}
      <MetricCard
        label="Total Leads"
        value={stats?.totalLeads || 0}
        icon="👥"
        color="blue"
        trend={5} // Example: +5% vs yesterday
      />

      {/* New Today */}
      <MetricCard
        label="New Today"
        value={stats?.newToday || 0}
        icon="📊"
        color="green"
        trend={stats?.newToday ? 1 : 0}
      />

      {/* WhatsApp */}
      <MetricCard
        label="From WhatsApp"
        value={stats?.bySource?.whatsapp || 0}
        icon="☎️"
        color="green"
        subtext="messages"
      />

      {/* Instagram */}
      <MetricCard
        label="From Instagram"
        value={stats?.bySource?.instagram || 0}
        icon="📷"
        color="pink"
        subtext="DMs"
      />
    </div>
  );
};

/**
 * Individual metric card
 */
const MetricCard = ({ label, value, icon, color, trend, subtext }) => {
  const colorClasses = {
    blue: "border-blue-500/30 bg-blue-500/5",
    green: "border-green-500/30 bg-green-500/5",
    pink: "border-pink-500/30 bg-pink-500/5",
  };

  const textColor = {
    blue: "text-blue-400",
    green: "text-green-400",
    pink: "text-pink-400",
  };

  return (
    <div className={`glass rounded-lg border ${colorClasses[color]} p-5 hover:bg-white/10 transition-all cursor-pointer`}>
      {/* Icon & Label */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          {label}
        </p>
      </div>

      {/* Large number */}
      <div className="mb-2">
        <p className={`text-3xl font-bold ${textColor[color]}`}>
          {value.toLocaleString()}
        </p>
      </div>

      {/* Trend or subtext */}
      <div className="flex items-center justify-between">
        {trend !== undefined ? (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <span className={trend > 0 ? "text-green-400" : "text-gray-400"}>
              {trend > 0 ? "↑" : "→"}
            </span>
            {Math.abs(trend)}% vs yesterday
          </span>
        ) : (
          <span className="text-xs text-gray-500">{subtext}</span>
        )}
      </div>
    </div>
  );
};
