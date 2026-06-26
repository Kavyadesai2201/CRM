// /client/src/pages/Leads.jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { leadsApi } from "../services/api.js";
import { useLeadAI } from "../hooks/useLeads.js";
import AddLeadModal from "../components/AddLeadModal.jsx";

const STAGE_BADGE = {
  new:         "badge-blue",
  contacted:   "badge-yellow",
  qualified:   "badge-purple",
  proposal:    "badge-blue",
  negotiation: "badge-yellow",
  closed_won:  "badge-green",
  closed_lost: "badge-red",
};

export default function Leads() {
  const [search,       setSearch]       = useState("");
  const [stage,        setStage]        = useState("");
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [toast,        setToast]        = useState("");
  // Per-lead AI summary state: { [leadId]: { loading, result, error } }
  const [summaries,    setSummaries]    = useState({});

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["leads", search, stage],
    queryFn:  () => leadsApi.getAll({ search, stage }),
    keepPreviousData: true,
  });

  const aiMutation = useLeadAI();

  const handleSummarize = (leadId) => {
    // Toggle off if result already shown
    if (summaries[leadId]?.result) {
      setSummaries(prev => { const n = { ...prev }; delete n[leadId]; return n; });
      return;
    }
    setSummaries(prev => ({ ...prev, [leadId]: { loading: true, result: null, error: null } }));
    aiMutation.mutate(
      { id: leadId, mode: "summary" },
      {
        onSuccess: (data) =>
          setSummaries(prev => ({ ...prev, [leadId]: { loading: false, result: data.result, error: null } })),
        onError: (err) =>
          setSummaries(prev => ({
            ...prev,
            [leadId]: {
              loading: false,
              result:  null,
              error:   err?.response?.data?.error || "AI unavailable. Please try again.",
            },
          })),
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-gray-400 mt-1">Manage and track all your prospects</p>
        </div>
        <button
          id="btn-add-lead"
          className="btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          + Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          id="leads-search"
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 rounded-xl bg-white/5 border border-white/10
                     text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition"
        />
        <select
          id="leads-stage-filter"
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300
                     focus:outline-none focus:border-brand-500 transition"
        >
          <option value="">All Stages</option>
          {["new","contacted","qualified","proposal","negotiation","closed_won","closed_lost"].map(s => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-left">
              {["Name", "Email", "Company", "Stage", "Source", "Created", ""].map(h => (
                <th key={h} className="px-5 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-gray-500">Loading…</td>
              </tr>
            ) : !data?.data?.length ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-gray-500">No leads found</td>
              </tr>
            ) : data.data.map(lead => {
              const summary = summaries[lead.id];
              return (
                <>
                  <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer">
                    <td className="px-5 py-3.5 font-medium text-white">{lead.name}</td>
                    <td className="px-5 py-3.5 text-gray-400">{lead.email}</td>
                    <td className="px-5 py-3.5 text-gray-400">{lead.company}</td>
                    <td className="px-5 py-3.5">
                      <span className={STAGE_BADGE[lead.stage] ?? "badge"}>{lead.stage}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400">{lead.source}</td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleSummarize(lead.id)}
                        disabled={summary?.loading}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors
                                   bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/30
                                   text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed
                                   whitespace-nowrap"
                      >
                        {summary?.loading
                          ? "…"
                          : summary?.result
                            ? "Hide AI"
                            : "✦ Summarize"}
                      </button>
                    </td>
                  </tr>

                  {/* Inline AI summary panel */}
                  {(summary?.result || summary?.error) && (
                    <tr key={`${lead.id}-ai`} className="border-b border-white/5 bg-purple-500/5">
                      <td colSpan={7} className="px-5 py-3">
                        {summary.error ? (
                          <p className="text-xs text-red-400">{summary.error}</p>
                        ) : (
                          <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {summary.result}
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Success toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5
                        px-4 py-3 rounded-xl shadow-xl
                        bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm
                        animate-fade-up">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {toast}
        </div>
      )}

      {/* Add Lead modal */}
      <AddLeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => showToast("Lead created successfully!")}
      />
    </div>
  );
}
