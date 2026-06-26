// /client/src/pages/Pipeline.jsx
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { pipelineApi, leadsApi } from "../services/api.js";

const STAGES = [
  { key: "new",          label: "New",          color: "border-blue-500/40 bg-blue-500/5" },
  { key: "contacted",    label: "Contacted",    color: "border-yellow-500/40 bg-yellow-500/5" },
  { key: "qualified",    label: "Qualified",    color: "border-purple-500/40 bg-purple-500/5" },
  { key: "proposal",     label: "Proposal",     color: "border-cyan-500/40 bg-cyan-500/5" },
  { key: "negotiation",  label: "Negotiation",  color: "border-orange-500/40 bg-orange-500/5" },
  { key: "closed_won",   label: "Closed Won",   color: "border-emerald-500/40 bg-emerald-500/5" },
  { key: "closed_lost",  label: "Closed Lost",  color: "border-red-500/40 bg-red-500/5" },
];

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function Pipeline() {
  const queryClient = useQueryClient();
  const [activeLead, setActiveLead] = useState(null);
  const [errorMsg,   setErrorMsg]   = useState(null);

  // Require at least 8px of pointer movement to start a drag so clicks
  // on cards still feel snappy and don't accidentally drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const { data: leadsRes = { data: [] } } = useQuery({
    queryKey: ["leads-all"],
    queryFn:  () => leadsApi.getAll({ limit: 200 }),
  });
  const leads = leadsRes.data ?? [];

  // Derive groupings from the cache so they update on every optimistic write
  const leadsByStage = STAGES.reduce((acc, { key }) => {
    acc[key] = leads.filter(l => l.stage === key);
    return acc;
  }, {});

  // Deal-value totals from leads data — reflects optimistic updates immediately
  const dealValueByStage = STAGES.reduce((acc, { key }) => {
    acc[key] = leadsByStage[key].reduce(
      (sum, l) => sum + (Number(l.deal_value) || 0), 0
    );
    return acc;
  }, {});

  // ── Toast helper ─────────────────────────────────────────────────────────────
  const showError = useCallback((msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  }, []);

  // ── Move-to-stage mutation ───────────────────────────────────────────────────
  const moveMutation = useMutation({
    mutationFn: ({ leadId, stage }) => pipelineApi.moveToStage(leadId, stage),

    onMutate: async ({ leadId, stage }) => {
      // Freeze any in-flight refetch so it doesn't clobber the optimistic write
      await queryClient.cancelQueries({ queryKey: ["leads-all"] });

      // Snapshot for rollback
      const snapshot = queryClient.getQueryData(["leads-all"]);

      // Optimistic update: move the card in cache
      queryClient.setQueryData(["leads-all"], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map(l => l.id === leadId ? { ...l, stage } : l),
        };
      });

      return { snapshot };
    },

    onError: (_err, _vars, context) => {
      // Roll back to pre-drag state
      if (context?.snapshot) {
        queryClient.setQueryData(["leads-all"], context.snapshot);
      }
      showError("Failed to move lead — changes reverted. Please try again.");
    },

    onSettled: () => {
      // Re-sync with server regardless of success or error
      queryClient.invalidateQueries({ queryKey: ["leads-all"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline-stages"] });
    },
  });

  // ── DnD event handlers ───────────────────────────────────────────────────────
  const handleDragStart = ({ active }) => {
    const lead = leads.find(l => l.id === active.id);
    setActiveLead(lead ?? null);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveLead(null);
    if (!over) return;

    const destStage   = String(over.id);
    const sourceStage = active.data.current?.stage;
    if (sourceStage === destStage) return;          // dropped in same column

    moveMutation.mutate({ leadId: active.id, stage: destStage });
  };

  const handleDragCancel = () => setActiveLead(null);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Pipeline</h1>
        <p className="text-gray-400 mt-1">Drag leads through your sales stages</p>
      </div>

      {/* Error toast */}
      {errorMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2
                        px-4 py-3 rounded-xl shadow-xl
                        bg-red-500/20 border border-red-500/40 text-red-300 text-sm">
          <span>⚠</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Kanban board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(({ key, label, color }) => (
            <PipelineColumn
              key={key}
              stageKey={key}
              label={label}
              color={color}
              leads={leadsByStage[key] ?? []}
              dealValue={dealValueByStage[key]}
            />
          ))}
        </div>

        {/* Floating clone rendered above everything while dragging */}
        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// ─── Droppable column ──────────────────────────────────────────────────────────

function PipelineColumn({ stageKey, label, color, leads, dealValue }) {
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-64 border rounded-2xl p-4 space-y-3 transition-all duration-150
        ${color}
        ${isOver ? "ring-2 ring-white/25 ring-inset brightness-125" : ""}`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">{label}</span>
        <span className="text-xs text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">
          {leads.length}
        </span>
      </div>

      {/* Deal-value total — updates instantly from optimistic cache */}
      {dealValue > 0 && (
        <p className="text-xs text-gray-500">
          ${dealValue.toLocaleString()} pipeline
        </p>
      )}

      {/* Cards */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {leads.length === 0 ? (
          <p className="text-xs text-gray-600 py-4 text-center">No leads</p>
        ) : (
          leads.map(lead => (
            <DraggableLeadCard key={lead.id} lead={lead} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Draggable card wrapper ────────────────────────────────────────────────────

function DraggableLeadCard({ lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id:   lead.id,
    data: { stage: lead.stage, lead },
  });

  // Translate without touching z-index so DragOverlay stays on top
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      // Ghost while the overlay clone is floating above
      className={`transition-opacity duration-100 ${isDragging ? "opacity-30" : "opacity-100"}`}
    >
      <LeadCard lead={lead} />
    </div>
  );
}

// ─── Visual card (shared by in-place and DragOverlay) ─────────────────────────

const SOURCE_META = {
  whatsapp:  { icon: "☎️", color: "text-green-400",  label: "WhatsApp" },
  instagram: { icon: "📷", color: "text-pink-400",   label: "Instagram" },
  default:   { icon: "👤", color: "text-gray-400",   label: "Manual" },
};

function cardTimeAgo(dateStr) {
  if (!dateStr) return null;
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60)    return "now";
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function LeadCard({ lead, isOverlay = false }) {
  const src   = SOURCE_META[lead.source] ?? SOURCE_META.default;
  const phone = lead.phone ? `+${lead.phone}` : null;
  const lastMsg      = lead.last_message?.substring(0, 55);
  const showEllipsis = (lead.last_message?.length ?? 0) > 55;
  const activityTime = cardTimeAgo(lead.last_message_at ?? lead.updated_at);

  return (
    <div
      className={`glass p-3 rounded-xl select-none transition-all space-y-1.5
        ${isOverlay
          ? "shadow-2xl ring-1 ring-white/20 rotate-1 scale-105 cursor-grabbing"
          : "cursor-grab hover:bg-white/10 active:cursor-grabbing"
        }`}
    >
      {/* Name + source icon */}
      <div className="flex items-center justify-between gap-1">
        <p className="text-sm font-medium text-white truncate flex-1">{lead.name}</p>
        <span className={`text-base leading-none flex-shrink-0 ${src.color}`} title={src.label}>
          {src.icon}
        </span>
      </div>

      {/* Phone or company */}
      {(phone || lead.company) && (
        <p className="text-xs text-gray-400 truncate">
          {phone ?? lead.company}
        </p>
      )}

      {/* Last message preview */}
      {lastMsg && (
        <p className="text-xs text-gray-500 leading-snug line-clamp-2">
          {lastMsg}{showEllipsis ? "…" : ""}
        </p>
      )}

      {/* Footer: deal value + last activity */}
      <div className="flex items-center justify-between gap-1 pt-0.5">
        {Number(lead.deal_value) > 0 ? (
          <span className="text-xs text-brand-400 font-semibold">
            ${Number(lead.deal_value).toLocaleString()}
          </span>
        ) : <span />}
        {activityTime && (
          <span className="text-[10px] text-gray-600">{activityTime}</span>
        )}
      </div>
    </div>
  );
}
