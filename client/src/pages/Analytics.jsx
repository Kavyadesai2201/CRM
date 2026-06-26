// /client/src/pages/Analytics.jsx
import { useQuery }      from "@tanstack/react-query";
import { analyticsApi }  from "../services/api.js";
import RevenueChart      from "../components/ui/RevenueChart.jsx";
import LeadSourceChart   from "../components/ui/LeadSourceChart.jsx";

export default function Analytics() {
  const { data: conversion = [] } = useQuery({
    queryKey: ["conversion"],
    queryFn:  analyticsApi.getConversionReport,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-1">Deep-dive into your sales performance</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass p-6">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">Revenue Over Time</h2>
          <RevenueChart />
        </div>
        <div className="glass p-6">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">Leads by Source</h2>
          <LeadSourceChart />
        </div>
      </div>

      <div className="glass overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-gray-400">Stage Conversion Breakdown</h2>
        </div>
        {conversion.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            No stage data yet — leads will appear here once created
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-left">
                <th className="px-6 py-3 font-medium">Stage</th>
                <th className="px-6 py-3 font-medium">Count</th>
                <th className="px-6 py-3 font-medium">% of Total</th>
                <th className="px-6 py-3 font-medium">Bar</th>
              </tr>
            </thead>
            <tbody>
              {conversion.map(row => (
                <tr key={row.stage} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-6 py-3 text-white font-medium capitalize">
                    {row.stage?.replaceAll("_", " ")}
                  </td>
                  <td className="px-6 py-3 text-gray-300">{row.count}</td>
                  <td className="px-6 py-3 text-gray-300">{row.percentage}%</td>
                  <td className="px-6 py-3 w-48">
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all"
                        style={{ width: `${row.percentage}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
