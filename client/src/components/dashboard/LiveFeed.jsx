import { useState, useEffect, useRef } from "react";
import {
  useRecentMessages,
  useSendWhatsAppMessage,
  useSendInstagramReply,
} from "../../hooks/useDashboard";
import { useLeadAI } from "../../hooks/useLeads.js";

/**
 * LiveFeed — Real-time message log backed by GET /api/messages/recent.
 * Refetches every 15 seconds via useRecentMessages.
 */
export const LiveFeed = () => {
  const { data, isLoading } = useRecentMessages({ limit: 20 });
  const messages = data?.messages ?? [];
  const [expandedReplyId, setExpandedReplyId] = useState(null);
  const scrollRef = useRef(null);

  // Scroll to top when new messages arrive
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [messages.length]);

  if (isLoading && messages.length === 0) {
    return <LiveFeedSkeleton />;
  }

  return (
    <div className="glass rounded-lg border border-white/10 p-6 h-[600px] flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          💬 Live Feed
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {messages.length} recent messages · refreshes every 15s
        </p>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar"
      >
        {messages.length > 0 ? (
          messages.map((msg) => (
            <LiveFeedMessageItem
              key={msg.id}
              message={msg}
              isExpanded={expandedReplyId === msg.id}
              onToggleReply={() =>
                setExpandedReplyId(expandedReplyId === msg.id ? null : msg.id)
              }
              onReplySuccess={() => setExpandedReplyId(null)}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p className="text-sm">No messages yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Individual message item with inline reply and AI suggest-reply.
 * message shape: { id, lead_id, lead_name, phone, instagram_id,
 *                  channel, direction, content, sent_at }
 */
const LiveFeedMessageItem = ({ message, isExpanded, onToggleReply, onReplySuccess }) => {
  const [replyText,    setReplyText]    = useState("");
  const [isSending,    setIsSending]    = useState(false);
  const [aiError,      setAiError]      = useState("");
  const sendWhatsApp  = useSendWhatsAppMessage();
  const sendInstagram = useSendInstagramReply();
  const aiMutation    = useLeadAI();

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setIsSending(true);
    try {
      if (message.channel === "whatsapp") {
        await sendWhatsApp.mutateAsync({ to: message.phone, message: replyText });
      } else if (message.channel === "instagram") {
        await sendInstagram.mutateAsync({
          commentId: message.instagram_id,
          message: replyText,
          leadId: message.lead_id,
        });
      }
      setReplyText("");
      onReplySuccess();
    } catch (err) {
      console.error("Failed to send reply:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSuggestReply = () => {
    setAiError("");
    aiMutation.mutate(
      { id: message.lead_id, mode: "suggest_reply" },
      {
        onSuccess: (data) => setReplyText(data.result),
        onError:   (err)  =>
          setAiError(err?.response?.data?.error || "AI unavailable. Please try again."),
      }
    );
  };

  const sourceIcon  = message.channel === "whatsapp" ? "☎️" : "📷";
  const sourceColor = message.channel === "whatsapp" ? "text-green-400" : "text-pink-400";
  const directionLabel = message.direction === "outbound"
    ? <span className="text-xs text-gray-600 ml-1">(sent)</span>
    : null;
  const timeAgo = formatTimeAgo(message.sent_at);

  // Only allow replying to inbound messages
  const canReply = message.direction === "inbound";

  const preview  = message.content?.substring(0, 80) ?? "";
  const showMore = (message.content?.length ?? 0) > 80;

  return (
    <div
      className={`border-l-4 pl-4 py-3 rounded
        ${message.direction === "outbound"
          ? "border-brand-500/30 bg-brand-500/5"
          : "border-transparent"
        }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-lg ${sourceColor}`}>{sourceIcon}</span>
            <span className="text-sm font-medium text-gray-200 truncate">
              {message.lead_name}
            </span>
            {directionLabel}
            <span className="text-xs text-gray-500 flex-shrink-0">{timeAgo}</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed break-words">
            "{preview}{showMore ? "…" : ""}"
          </p>
        </div>

        {canReply && (
          <button
            onClick={onToggleReply}
            className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded
                       bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
          >
            Reply
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
          {/* AI error banner */}
          {aiError && (
            <p className="text-xs text-red-400 px-1">{aiError}</p>
          )}

          <textarea
            value={replyText}
            onChange={(e) => { setReplyText(e.target.value); setAiError(""); }}
            placeholder="Reply here…"
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2
                       text-sm text-gray-200 placeholder-gray-500
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
          />
          <div className="flex items-center justify-between gap-2">
            {/* Suggest reply button — left side */}
            <button
              onClick={handleSuggestReply}
              disabled={aiMutation.isPending}
              className="text-xs px-2.5 py-1.5 rounded font-medium transition-colors
                         bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/30
                         text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiMutation.isPending ? "Drafting…" : "✦ Suggest reply"}
            </button>

            {/* Send / cancel — right side */}
            <div className="flex gap-2">
              <button
                onClick={() => { setReplyText(""); setAiError(""); onToggleReply(); }}
                className="text-xs px-3 py-1.5 rounded bg-white/5 hover:bg-white/10
                           text-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReply}
                disabled={isSending || !replyText.trim()}
                className="text-xs px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700
                           disabled:bg-blue-600/50 text-white font-medium transition-colors"
              >
                {isSending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LiveFeedSkeleton = () => (
  <div className="glass rounded-lg border border-white/10 p-6 h-[600px] flex flex-col">
    <div className="mb-4">
      <div className="h-4 bg-white/10 rounded w-24" />
      <div className="h-3 bg-white/10 rounded w-20 mt-2" />
    </div>
    <div className="flex-1 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-white/10 rounded-full" />
            <div className="h-4 bg-white/10 rounded w-32" />
            <div className="h-3 bg-white/10 rounded w-16 ml-auto" />
          </div>
          <div className="h-3 bg-white/10 rounded w-full" />
        </div>
      ))}
    </div>
  </div>
);

function formatTimeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
