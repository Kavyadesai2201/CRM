// /client/src/pages/Landing.jsx
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";

// ─── Feature data ──────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-green-400">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    border: "border-green-500/20",
    bg: "from-green-500/10 to-transparent",
    glow: "bg-green-400",
    title: "Real-time Lead Capture",
    desc: "Every WhatsApp message and Instagram DM becomes a tracked lead automatically — zero manual entry, zero missed conversations.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-purple-400">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
    border: "border-purple-500/20",
    bg: "from-purple-500/10 to-transparent",
    glow: "bg-purple-400",
    title: "AI-Powered Summaries & Replies",
    desc: "Claude AI reads your conversation history and drafts the perfect reply in seconds. Get instant lead summaries without scrolling through threads.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-blue-400">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
      </svg>
    ),
    border: "border-blue-500/20",
    bg: "from-blue-500/10 to-transparent",
    glow: "bg-blue-400",
    title: "Drag-and-Drop Pipeline",
    desc: "Move leads through 7 sales stages with optimistic drag interactions. Your pipeline updates instantly across every connected device via SSE.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-orange-400">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    border: "border-orange-500/20",
    bg: "from-orange-500/10 to-transparent",
    glow: "bg-orange-400",
    title: "Live Analytics Dashboard",
    desc: "Revenue timelines, source breakdowns, and conversion funnels — all updating in real time. Know exactly where every deal stands.",
  },
];

// ─── Hero mock dashboard preview ───────────────────────────────────────────────
function HeroMockup() {
  return (
    <div className="relative">
      {/* Rotating orbit rings */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[540px] h-[540px] rounded-full border border-brand-500/8 animate-spin-slow" />
        <div className="absolute w-[430px] h-[430px] rounded-full border border-purple-500/8 animate-spin-reverse" />
        <div className="absolute w-[310px] h-[310px] rounded-full border border-cyan-500/6 animate-spin-slow" style={{ animationDuration: "42s" }} />
      </div>

      {/* Ambient glow behind the card */}
      <div className="absolute inset-8 -z-10 blur-[60px] rounded-full bg-brand-500/12" />

      {/* Main dashboard card */}
      <div className="relative glass rounded-2xl p-5 shadow-2xl shadow-black/40 border border-white/12 animate-float max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-xs text-gray-400 font-medium tracking-wide">Live Dashboard</span>
          </div>
          <span className="text-xs text-gray-600">Just now</span>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Leads", value: "1,247", color: "text-brand-400" },
            { label: "New Today", value: "23", color: "text-emerald-400" },
            { label: "Revenue", value: "$84K", color: "text-purple-400" },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 rounded-xl p-2.5 text-center">
              <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Pipeline bars */}
        <div className="space-y-2.5 mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-2">Pipeline</p>
          {[
            { stage: "New", count: 34, pct: 68, color: "bg-blue-500" },
            { stage: "Qualified", count: 18, pct: 42, color: "bg-purple-500" },
            { stage: "Proposal", count: 9, pct: 22, color: "bg-cyan-500" },
            { stage: "Closed Won", count: 12, pct: 30, color: "bg-emerald-500" },
          ].map((s) => (
            <div key={s.stage} className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400 w-[68px] flex-shrink-0">{s.stage}</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
              </div>
              <span className="text-[10px] text-gray-500 w-5 text-right tabular-nums">{s.count}</span>
            </div>
          ))}
        </div>

        {/* Inbound message */}
        <div className="bg-white/[0.04] rounded-xl p-3 border border-white/5">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs">💬</span>
            <span className="text-xs font-semibold text-gray-300">Priya Sharma</span>
            <span className="text-[10px] text-gray-600 ml-auto">2m ago</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            "Hi, I'm interested in the enterprise plan…"
          </p>
          <div className="mt-2">
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/20 font-medium">
              ✦ AI Reply Ready
            </span>
          </div>
        </div>
      </div>

      {/* Floating "Live" badge */}
      <div className="absolute -top-3 -right-3 flex items-center gap-1.5 glass px-3 py-1.5 rounded-full border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
        </span>
        <span className="text-[11px] font-bold text-emerald-400">Live</span>
      </div>

      {/* Floating "AI" badge */}
      <div className="absolute -bottom-3 -left-3 flex items-center gap-1.5 glass px-3 py-1.5 rounded-full border border-purple-500/30 shadow-lg shadow-purple-500/10">
        <span className="text-xs text-purple-300">✦</span>
        <span className="text-[11px] font-bold text-purple-300">AI-Powered</span>
      </div>
    </div>
  );
}

// ─── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, border, bg, glow, title, desc }) {
  return (
    <div
      className={`group relative glass rounded-2xl p-7 border ${border} bg-gradient-to-br ${bg}
                  transition-all duration-300 hover:-translate-y-1.5
                  hover:shadow-xl hover:shadow-black/30 overflow-hidden`}
    >
      {/* Hover glow */}
      <div className={`absolute -top-8 -left-8 w-24 h-24 ${glow}/10 blur-3xl rounded-full
                       opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="relative z-10">
        <div className="mb-4 inline-flex p-2.5 rounded-xl bg-white/5 border border-white/8">
          {icon}
        </div>
        <h3 className="text-base font-bold text-white mb-2 tracking-tight">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function Landing() {
  const token = useAuthStore((s) => s.token);

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-x-hidden">

      {/* ── Animated background layer ──────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none select-none" style={{ zIndex: 0 }}>
        <div className="absolute inset-0 dot-grid" />
        {/* Blue orb — top left */}
        <div
          className="absolute rounded-full bg-brand-500/[0.14] blur-[130px] animate-orb-drift"
          style={{ width: 700, height: 600, top: "-20%", left: "-12%" }}
        />
        {/* Purple orb — top right */}
        <div
          className="absolute rounded-full bg-purple-500/[0.11] blur-[110px] animate-orb-drift-alt"
          style={{ width: 600, height: 560, top: "-15%", right: "-8%" }}
        />
        {/* Cyan orb — bottom center */}
        <div
          className="absolute rounded-full bg-cyan-500/[0.07] blur-[150px] animate-orb-drift"
          style={{ width: 800, height: 500, bottom: "-15%", left: "15%", animationDuration: "24s" }}
        />
      </div>

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-14 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center text-lg">
            🚀
          </div>
          <div>
            <span className="text-sm font-black text-white tracking-tight">TechCRM</span>
            <span className="ml-2 text-[10px] font-medium text-gray-600 uppercase tracking-widest hidden sm:inline">
              Sales Platform
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {token ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600
                         text-white text-sm font-semibold transition-all duration-150
                         shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 active:scale-95"
            >
              Go to Dashboard
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-2"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600
                           text-white text-sm font-semibold transition-all duration-150
                           shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 active:scale-95"
              >
                Get Started
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-14 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="grid lg:grid-cols-[1fr_auto] gap-16 xl:gap-24 items-center">

          {/* Left: copy */}
          <div className="max-w-2xl space-y-8">

            {/* Eyebrow badge */}
            <div
              className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full
                         border border-brand-500/25 animate-fade-up"
              style={{ animationDelay: "0ms" }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-400" />
              </span>
              <span className="text-xs font-semibold text-brand-300 tracking-wide">
                Real-time sales intelligence — WhatsApp &amp; Instagram
              </span>
            </div>

            {/* Headline */}
            <div className="animate-fade-up" style={{ animationDelay: "90ms" }}>
              <h1 className="text-[clamp(2.6rem,6vw,5rem)] font-black leading-[1.04] tracking-tight">
                <span className="text-white">The CRM that</span>
                <br />
                <span className="gradient-text">never misses</span>
                <br />
                <span className="text-white">a message.</span>
              </h1>
            </div>

            {/* Sub */}
            <p
              className="text-lg md:text-xl text-gray-400 leading-relaxed animate-fade-up"
              style={{ animationDelay: "180ms" }}
            >
              Capture leads from WhatsApp &amp; Instagram in real time, manage your pipeline
              with drag-and-drop precision, and let AI draft the perfect reply — all in one place.
            </p>

            {/* CTAs */}
            <div
              className="flex items-center gap-4 flex-wrap animate-fade-up"
              style={{ animationDelay: "270ms" }}
            >
              {token ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-brand-500
                             hover:bg-brand-600 text-white text-sm font-bold transition-all duration-200
                             shadow-lg shadow-brand-500/40 hover:shadow-brand-500/60
                             hover:-translate-y-0.5 active:scale-95"
                >
                  Go to Dashboard
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-brand-500
                               hover:bg-brand-600 text-white text-sm font-bold transition-all duration-200
                               shadow-lg shadow-brand-500/40 hover:shadow-brand-500/60
                               hover:-translate-y-0.5 active:scale-95"
                  >
                    Start for Free
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white/5
                               hover:bg-white/10 text-gray-200 text-sm font-semibold transition-all duration-200
                               border border-white/10 hover:border-white/20 hover:-translate-y-0.5 active:scale-95"
                  >
                    Log In
                  </Link>
                </>
              )}
            </div>

            {/* Micro-copy */}
            <p
              className="text-xs text-gray-600 animate-fade-up"
              style={{ animationDelay: "360ms" }}
            >
              No credit card required &nbsp;·&nbsp; Set up in under 2 minutes
            </p>
          </div>

          {/* Right: dashboard mockup */}
          <div
            className="hidden lg:flex items-center justify-center animate-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* ── Stats strip ────────────────────────────────────────────────────── */}
      <div className="relative z-10 border-y border-white/5 bg-white/[0.015]">
        <div className="max-w-7xl mx-auto px-6 md:px-14 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "Real-time", label: "Lead capture via webhooks" },
              { value: "7-stage", label: "Drag-and-drop pipeline" },
              { value: "AI-first", label: "Reply drafting with Claude" },
              { value: "< 1s", label: "WhatsApp webhook latency" },
            ].map((s) => (
              <div key={s.label} className="space-y-1.5">
                <p className="text-2xl md:text-3xl font-black text-white tracking-tight">{s.value}</p>
                <p className="text-xs text-gray-500 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-14 py-28">
        {/* Section header */}
        <div className="text-center mb-16 space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-400">
            Everything your team needs
          </p>
          <h2 className="text-[clamp(1.9rem,4vw,3.25rem)] font-black text-white tracking-tight leading-tight">
            Built for teams that sell through{" "}
            <span className="gradient-text">social channels.</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto leading-relaxed text-base md:text-lg">
            From the first DM to a signed deal — TechCRM keeps your entire
            sales motion in sync, in real time.
          </p>
        </div>

        {/* 2×2 feature grid */}
        <div className="grid sm:grid-cols-2 gap-5">
          {FEATURES.map((feat) => (
            <FeatureCard key={feat.title} {...feat} />
          ))}
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-14 pb-28">
        <div className="relative glass rounded-3xl p-12 md:p-20 text-center overflow-hidden border border-brand-500/20">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-purple-500/8 pointer-events-none" />
          {/* Central glow */}
          <div
            className="absolute w-96 h-96 rounded-full bg-brand-500/12 blur-3xl pointer-events-none animate-hero-glow"
            style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
          />

          <div className="relative z-10 space-y-6">
            <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-black text-white tracking-tight">
              Ready to close more deals?
            </h2>
            <p className="text-gray-400 max-w-md mx-auto text-base md:text-lg leading-relaxed">
              Join sales teams that never lose a lead from WhatsApp or Instagram again.
            </p>
            <div className="flex items-center justify-center gap-5 flex-wrap pt-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-brand-500
                           hover:bg-brand-600 text-white text-sm font-bold transition-all duration-200
                           shadow-xl shadow-brand-500/40 hover:shadow-brand-500/60
                           hover:-translate-y-0.5 active:scale-95"
              >
                Get Started Free
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                to="/login"
                className="text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-4 decoration-gray-600 hover:decoration-gray-400"
              >
                Already have an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 px-6 md:px-14 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-brand-500/15 border border-brand-500/20 flex items-center justify-center text-sm">
              🚀
            </div>
            <span className="text-sm font-bold text-white">TechCRM</span>
            <span className="text-xs text-gray-700 hidden sm:inline">Sales Platform</span>
          </div>
          <p className="text-xs text-gray-700">
            © {new Date().getFullYear()} TechCRM · Built for modern sales teams
          </p>
        </div>
      </footer>
    </div>
  );
}
