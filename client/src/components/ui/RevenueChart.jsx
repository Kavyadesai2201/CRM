// /client/src/components/ui/RevenueChart.jsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function RevenueChart({ data }) {
  const formatted = data.map(d => ({
    month: new Date(d.month).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
    revenue: Number(d.revenue),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#4f6ef7" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4f6ef7" stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false}
               tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{ background:"rgba(15,15,20,0.9)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"12px" }}
          labelStyle={{ color:"#d1d5db" }} itemStyle={{ color:"#4f6ef7" }}
          formatter={v => [`$${v.toLocaleString()}`, "Revenue"]}
        />
        <Area type="monotone" dataKey="revenue" stroke="#4f6ef7" strokeWidth={2} fill="url(#revGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
