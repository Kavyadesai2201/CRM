// /client/src/pages/Inbox.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLeadList, useConversation, useSendMessage } from "../hooks/useInbox.js";
import { useLeadAI } from "../hooks/useLeads.js";

// ── Palette: deterministic avatar color from lead name ───────────────────────

const AVATAR_PALETTE = [
  ["bg-blue-500/25",    "text-blue-300"   ],
  ["bg-purple-500/25",  "text-purple-300" ],
  ["bg-emerald-500/25", "text-emerald-300"],
  ["bg-orange-500/25",  "text-orange-300" ],
  ["bg-pink-500/25",    "text-pink-300"   ],
  ["bg-cyan-500/25",    "text-cyan-300"   ],
];

const STAGE_BADGE = {
  new:         "badge-blue",
  contacted:   "badge-yellow",
  qualified:   "badge-purple",
  proposal:    "badge-blue",
  negotiation: "badge-yellow",
  closed_won:  "badge-green",
  closed_lost: "badge-red",
};

const SOURCE_ICON = { whatsapp: "☎️", instagram: "📷" };

const FILTERS = [
  { key: "all",       label: "All"       },
  { key: "unread",    label: "Unread"    },
  { key: "whatsapp",  label: "WhatsApp"  },
  { key: "instagram", label: "Instagram" },
];

// ── Micro-helpers ────────────────────────────────────────────────────────────

function avatarClasses(name) {
  const [bg, text] = AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];
  return `${bg} ${text}`;
}

function getInitials(name) {
  return (name ?? "?").split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function timeAgoShort(dateStr) {
  if (!dateStr) return "";
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60)    return "now";
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function timeAgoLong(dateStr) {
  if (!dateStr) return "";
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function dayLabel(dateStr) {
  const d    = new Date(dateStr);
  const now  = new Date();
  const yest = new Date(); yest.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString())  return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

// ── Shared sub-components ────────────────────────────────────────────────────

function Avatar({ name, size = "md" }) {
  const dim = size === "sm" ? "w-7 h-7 text-[9px]" : "w-9 h-9 text-[11px]";
  return (
    <div className={`${dim} ${avatarClasses(name)} rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
      {getInitials(name)}
    </div>
  );
}

function Spinner({ className = "w-4 h-4" }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path  className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function Toast({ msg, type }) {
  if (!msg) return null;
  const isErr = type === "error";
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5
                    px-4 py-3 rounded-xl shadow-xl text-sm animate-fade-up
                    ${isErr
                      ? "bg-red-500/15 border border-red-500/30 text-red-300"
                      : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"}`}>
      {isErr
        ? <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        : <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
      }
      {msg}
    </div>
  );
}

function DateSeparator({ label }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-white/5" />
      <span className="text-[10px] font-medium text-gray-600 uppercase tracking-widest flex-shrink-0">{label}</span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

// ── Left panel: lead row ─────────────────────────────────────────────────────

function LeadRow({ lead, isSelected, onClick }) {
  const isUnread = lead.last_message_direction === "inbound";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-start gap-3 px-4 py-3.5
                  border-b border-white/5 last:border-0 transition-all
                  ${isSelected
                    ? "bg-brand-500/15 border-l-[3px] border-l-brand-500 pl-[13px]"
                    : "hover:bg-white/5 border-l-[3px] border-l-transparent"}`}
    >
      {/* Avatar + unread dot */}
      <div className="relative flex-shrink-0 mt-0.5">
        <Avatar name={lead.name} />
        {isUnread && !isSelected && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand-500 border-2 border-gray-950" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Name + timestamp row */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${isUnread && !isSelected ? "font-semibold text-white" : "font-medium text-gray-300"}`}>
            {lead.name}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {lead.source && <span className="text-xs">{SOURCE_ICON[lead.source] ?? ""}</span>}
            <span className="text-[10px] text-gray-600">{timeAgoShort(lead.last_message_at ?? lead.updated_at)}</span>
          </div>
        </div>
        {/* Preview */}
        <p className={`text-xs mt-0.5 truncate ${isUnread && !isSelected ? "text-gray-400" : "text-gray-600"}`}>
          {lead.last_message_direction === "outbound" && "You: "}
          {lead.last_message ?? "No messages yet"}
        </p>
      </div>
    </button>
  );
}

// ── Left panel: skeleton loader ──────────────────────────────────────────────

function LeadListSkeleton() {
  return (
    <div className="p-4 space-y-1">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-0 py-3.5 animate-pulse">
          <div className="w-9 h-9 rounded-full bg-white/8 flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="flex justify-between">
              <div className="h-3 bg-white/8 rounded w-1/2" />
              <div className="h-2.5 bg-white/5 rounded w-8" />
            </div>
            <div className="h-2.5 bg-white/5 rounded w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Right panel: message bubble ──────────────────────────────────────────────

function MessageBubble({ msg, lead, showAvatar }) {
  const isOut = msg.direction === "outbound";

  return (
    <div className={`flex items-end gap-2 ${isOut ? "flex-row-reverse" : ""}`}>
      {/* Avatar column — always 28px wide so outbound bubbles align */}
      <div className="w-7 flex-shrink-0">
        {!isOut && showAvatar && <Avatar name={lead.name} size="sm" />}
      </div>

      <div className={`flex flex-col max-w-[72%] ${isOut ? "items-end" : "items-start"}`}>
        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap
                        ${isOut
                          ? "bg-brand-500/20 border border-brand-500/30 text-gray-100 rounded-br-sm"
                          : "bg-white/5 border border-white/10 text-gray-200 rounded-bl-sm"}`}>
          {msg.content}
        </div>
        <div className={`flex items-center gap-1.5 mt-1 ${isOut ? "flex-row-reverse" : ""}`}>
          <span className="text-[10px] text-gray-600">{timeAgoLong(msg.sent_at)}</span>
          {isOut && <span className="text-[10px] text-gray-700">✓ Sent</span>}
        </div>
      </div>
    </div>
  );
}

// ── Right panel: conversation skeleton ──────────────────────────────────────

function ConversationSkeleton() {
  return (
    <div className="flex-1 p-4 space-y-4 overflow-hidden">
      {[false, true, false, false, true].map((isOut, i) => (
        <div key={i} className={`flex items-end gap-2 animate-pulse ${isOut ? "flex-row-reverse" : ""}`}>
          <div className="w-7 h-7 rounded-full bg-white/8 flex-shrink-0" />
          <div className={`rounded-2xl h-10 ${isOut ? "bg-brand-500/10" : "bg-white/5"}`}
               style={{ width: `${100 + (i * 47) % 130}px` }} />
        </div>
      ))}
    </div>
  );
}

// ── Right panel: reply box ───────────────────────────────────────────────────

function ReplyBox({ lead, onAfterSend }) {
  const [text,    setText]    = useState("");
  const [toast,   setToast]   = useState(null);
  const taRef                 = useRef(null);
  const sendMutation          = useSendMessage();
  const aiMutation            = useLeadAI();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const adjustHeight = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 96)}px`; // max 4 rows ≈ 96px
  };

  const handleSend = async () => {
    const msg = text.trim();
    if (!msg || sendMutation.isPending) return;
    try {
      await sendMutation.mutateAsync({ to: String(lead.phone), message: msg, leadId: lead.id });
      setText("");
      if (taRef.current) taRef.current.style.height = "auto";
      onAfterSend?.();
      showToast("Message sent");
    } catch (err) {
      showToast(err?.response?.data?.error || "Failed to send message", "error");
    }
  };

  const handleSuggest = () => {
    aiMutation.mutate(
      { id: lead.id, mode: "suggest_reply" },
      {
        onSuccess: (data) => {
          setText(data.result ?? "");
          setTimeout(adjustHeight, 0);
        },
        onError: (err) => showToast(err?.response?.data?.error || "AI unavailable", "error"),
      }
    );
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="flex-shrink-0 border-t border-white/10 p-4 space-y-3">
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => { setText(e.target.value); adjustHeight(); }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Ctrl+Enter to send)"
          rows={1}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
                     text-sm text-gray-200 placeholder-gray-600
                     focus:outline-none focus:border-brand-500 transition resize-none
                     custom-scrollbar"
          style={{ minHeight: "42px" }}
        />
        <div className="flex items-center gap-3">
          <button
            onClick={handleSuggest}
            disabled={aiMutation.isPending}
            className="btn-ghost text-sm py-1.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {aiMutation.isPending ? <Spinner className="w-3.5 h-3.5" /> : <span>✦</span>}
            Suggest reply
          </button>
          <div className="flex-1" />
          <span className="text-[10px] text-gray-700 hidden sm:block select-none">Ctrl+Enter</span>
          <button
            onClick={handleSend}
            disabled={!text.trim() || sendMutation.isPending}
            className="btn-primary py-1.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sendMutation.isPending && <Spinner className="w-3.5 h-3.5" />}
            Send
          </button>
        </div>
      </div>
    </>
  );
}

// ── Right panel: conversation view ───────────────────────────────────────────

function ConversationView({ lead }) {
  const navigate  = useNavigate();
  const { data: convData, isLoading } = useConversation(lead.id);
  const messages  = convData?.data ?? [];
  const bottomRef = useRef(null);

  // Scroll to bottom on new messages and on lead switch
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, lead.id]);

  // Build render list: inject day separators and track avatar grouping
  const renderItems = [];
  let lastDay = null;
  let lastDir = null;

  for (const msg of messages) {
    const day = new Date(msg.sent_at).toDateString();
    if (day !== lastDay) {
      renderItems.push({ type: "sep", key: `sep-${day}`, label: dayLabel(msg.sent_at) });
      lastDay = day;
      lastDir = null; // reset run on day change
    }
    renderItems.push({
      type:       "msg",
      key:        msg.id,
      msg,
      showAvatar: msg.direction !== lastDir, // show avatar at start of each inbound run
    });
    lastDir = msg.direction;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10 flex-shrink-0">
        <Avatar name={lead.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm">{lead.name}</span>
            {lead.source && (
              <span className="text-base leading-none">{SOURCE_ICON[lead.source] ?? ""}</span>
            )}
            <span className={`badge text-[10px] ${STAGE_BADGE[lead.stage] ?? "badge-blue"}`}>
              {lead.stage?.replaceAll("_", " ")}
            </span>
          </div>
          {lead.phone && (
            <p className="text-xs text-gray-500 mt-0.5">+{lead.phone}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => navigate("/leads")}
            title="View in Leads"
            className="btn-ghost py-1.5 px-3 text-xs"
          >
            ↗ Leads
          </button>
          <button className="btn-ghost py-1.5 px-2.5 text-sm" title="More options">
            ···
          </button>
        </div>
      </div>

      {/* Messages */}
      {isLoading ? (
        <ConversationSkeleton />
      ) : messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <span className="text-3xl">💬</span>
          <p className="text-sm text-gray-500">No messages yet</p>
          <p className="text-xs text-gray-700">Send the first message below</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scrollbar">
          {renderItems.map(item =>
            item.type === "sep"
              ? <DateSeparator key={item.key} label={item.label} />
              : <MessageBubble key={item.key} msg={item.msg} lead={lead} showAvatar={item.showAvatar} />
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <ReplyBox lead={lead} onAfterSend={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })} />
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Inbox() {
  const [selectedLead,    setSelectedLead]    = useState(null);
  const [search,          setSearch]          = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter,          setFilter]          = useState("all");
  const [mobileView,      setMobileView]      = useState("list"); // "list" | "conversation"

  // Debounce search — 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const queryParams = {
    ...(debouncedSearch               && { search: debouncedSearch }),
    ...(filter === "whatsapp"         && { source: "whatsapp"      }),
    ...(filter === "instagram"        && { source: "instagram"     }),
  };

  const { data: leadsData, isLoading: leadsLoading } = useLeadList(queryParams);
  const allLeads = leadsData?.data ?? [];

  // "Unread" filter: last message is inbound (approximation per spec)
  const leads = filter === "unread"
    ? allLeads.filter(l => l.last_message_direction === "inbound")
    : allLeads;

  const handleSelectLead = (lead) => {
    setSelectedLead(lead);
    setMobileView("conversation");
  };

  return (
    // -m-6 undoes MainLayout's p-6 padding so the Inbox can be truly full-bleed.
    // calc(100vh - 56px) subtracts the h-14 topbar.
    <div className="-m-6 flex overflow-hidden" style={{ height: "calc(100vh - 56px)" }}>

      {/* ═══ LEFT PANEL ═══════════════════════════════════════════════════════ */}
      <div className={`
        ${mobileView === "conversation" ? "hidden" : "flex"} md:flex
        w-full md:w-[300px] lg:w-[320px] flex-shrink-0
        flex-col border-r border-white/10 bg-black/10 overflow-hidden
      `}>
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/10 space-y-3 flex-shrink-0">
          <h1 className="text-lg font-bold text-white">Inbox</h1>
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10
                       text-sm text-white placeholder-gray-600
                       focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-3 py-2 border-b border-white/10 flex-shrink-0">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all
                         ${filter === key
                           ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                           : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Lead list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {leadsLoading ? (
            <LeadListSkeleton />
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
              <span className="text-2xl">📭</span>
              <p className="text-sm text-gray-500">
                {search ? "No leads match your search" : "No leads found"}
              </p>
            </div>
          ) : (
            leads.map(lead => (
              <LeadRow
                key={lead.id}
                lead={lead}
                isSelected={selectedLead?.id === lead.id}
                onClick={() => handleSelectLead(lead)}
              />
            ))
          )}
        </div>
      </div>

      {/* ═══ RIGHT PANEL ══════════════════════════════════════════════════════ */}
      <div className={`
        ${mobileView === "list" ? "hidden" : "flex"} md:flex
        flex-1 flex-col overflow-hidden
      `}>
        {/* Mobile back button */}
        <button
          onClick={() => setMobileView("list")}
          className="md:hidden flex items-center gap-2 px-4 py-2.5 border-b border-white/10
                     text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
        >
          ← Back to list
        </button>

        {!selectedLead ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <span className="text-5xl opacity-30">💬</span>
            <p className="text-base text-gray-500">Select a lead to view their conversation</p>
            <p className="text-xs text-gray-700">Choose from the list on the left</p>
          </div>
        ) : (
          // key forces full remount (scroll reset, cleared reply box) on lead change
          <ConversationView key={selectedLead.id} lead={selectedLead} />
        )}
      </div>
    </div>
  );
}
