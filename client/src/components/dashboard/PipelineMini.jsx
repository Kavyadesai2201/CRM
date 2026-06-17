import { useDashboardStats } from "../../hooks/useDashboard";

/**
 * PipelineMini — Compact vertical list of pipeline stages
 * Shows: stage name, count badge, progress bar (% of total leads)
 */
export const PipelineMini = () => {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="glass rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Pipeline
        </h3>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="h-3 bg-white/10 rounded w-24"></div>
              <div className="h-5 bg-white/10 rounded-full w-8"></div>
            </div>
            <div className="h-2 bg-white/5 rounded-full w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  const byStage = stats?.byStage || {};
  const total = Object.values(byStage).reduce((a, b) => a + b, 0) || 1;

  const stages = [
    { name: "New", key: "new", color: "blue" },
    { name: "Contacted", key: "contacted", color: "purple" },
    { name: "Qualified", key: "qualified", color: "orange" },
    { name: "Proposal Sent", key: "proposal_sent", color: "yellow" },
    { name: "Closed Won", key: "closed_won", color: "green" },
  ];

  const colorBg = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    yellow: "bg-yellow-500",
    green: "bg-green-500",
  };

  const colorBadge = {
    blue: "bg-blue-500/20 text-blue-200",
    purple: "bg-purple-500/20 text-purple-200",
    orange: "bg-orange-500/20 text-orange-200",
    yellow: "bg-yellow-500/20 text-yellow-200",
    green: "bg-green-500/20 text-green-200",
  };

  return (
    <div className="glass rounded-lg border border-white/10 p-6">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-5">
        📈 Pipeline
      </h3>

      <div className="space-y-4">
        {stages.map((stage) => {
          const count = byStage[stage.key] || 0;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <div key={stage.key}>
              {/* Label & Badge */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">
                  {stage.name}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colorBadge[stage.color]}`}
                >
                  {count}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colorBg[stage.color]} rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>

              {/* Percentage */}
              <div className="text-xs text-gray-500 mt-1">{percentage}%</div>
            </div>
          );
        })}
      </div>

      {/* Total at bottom */}
      <div className="mt-6 pt-4 border-t border-white/5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">Total Leads</span>
          <span className="font-semibold text-gray-200">{total}</span>
        </div>
      </div>
    </div>
  );
};
