// /client/src/pages/Dashboard.jsx
import { StatsRow }       from "../components/dashboard/StatsRow.jsx";
import { LiveFeed }       from "../components/dashboard/LiveFeed.jsx";
import { PipelineMini }   from "../components/dashboard/PipelineMini.jsx";
import RevenueChart       from "../components/ui/RevenueChart.jsx";
import LeadSourceChart    from "../components/ui/LeadSourceChart.jsx";
import { useEventStream } from "../hooks/useEventStream.js";

export default function Dashboard() {
  useEventStream();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome back — here is your real-time sales overview</p>
      </div>

      <section>
        <StatsRow />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LiveFeed />
        </div>
        <div className="lg:col-span-1">
          <PipelineMini />
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass p-6">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">Revenue Timeline</h2>
          <RevenueChart />
        </div>
        <div className="glass p-6">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">Leads by Source</h2>
          <LeadSourceChart />
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 py-4">
        <p>Live — updates in real time via SSE</p>
      </div>
    </div>
  );
}
