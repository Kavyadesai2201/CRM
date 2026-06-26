import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { analyticsApi } from "../../services/api.js";

const COLORS = ["#4f6ef7", "#9333ea", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

export default function LeadSourceChart() {
  const { data: raw = [] } = useQuery({
    queryKey: ["lead-sources"],
    queryFn:  analyticsApi.getLeadsBySource,
  });

  // Coerce PostgreSQL aggregate string counts to numbers
  const data = raw.map(d => ({ ...d, count: Number(d.count) }));

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[220px]">
        <p className="text-sm text-gray-500">No leads yet</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="source"
             cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip
          contentStyle={{ background: "rgba(15,15,20,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
          itemStyle={{ color: "#d1d5db" }}
        />
        <Legend iconType="circle" iconSize={8}
          formatter={v => <span style={{ color: "#9ca3af", fontSize: 11 }}>{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}
