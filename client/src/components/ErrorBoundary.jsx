// /client/src/components/ErrorBoundary.jsx
import { Component } from "react";
import { useLocation } from "react-router-dom";

// ── Fallback UI ──────────────────────────────────────────────────────────────

function ErrorFallback({ error, onReset }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4"
         style={{ backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(239,68,68,0.04) 0%, transparent 60%)" }}>
      <div className="glass max-w-md w-full p-8 text-center space-y-6">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
                 strokeLinecap="round" strokeLinejoin="round"
                 className="w-8 h-8 text-red-400">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">Something went wrong</h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            An unexpected error occurred. Please refresh the page.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="btn-primary justify-center"
          >
            Refresh Page
          </button>
          {onReset && (
            <button onClick={onReset} className="btn-ghost justify-center">
              Try again
            </button>
          )}
        </div>

        {/* Dev-only error details */}
        {import.meta.env.DEV && error && (
          <details className="text-left mt-2">
            <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400 transition-colors select-none">
              Error details (dev only)
            </summary>
            <pre className="mt-2 p-3 rounded-xl bg-black/40 border border-white/5
                            text-xs text-red-400 overflow-auto whitespace-pre-wrap break-all">
              {error.message}
              {error.stack ? `\n\n${error.stack}` : ""}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// ── Class boundary ───────────────────────────────────────────────────────────

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Caught error:", error.message);
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary] Component stack:", info.componentStack);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={this.reset} />;
    }
    return this.props.children;
  }
}

// ── Route-level wrapper ──────────────────────────────────────────────────────
// Uses `key={pathname}` so navigating away from a crashed route resets the
// boundary automatically — no stale error state carries over to other pages.

export function RouteErrorBoundary({ children }) {
  const { pathname } = useLocation();
  return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>;
}
