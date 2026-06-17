// /client/src/pages/NotFound.jsx
import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-8xl">🔍</p>
      <h1 className="text-3xl font-bold text-white">404 — Page not found</h1>
      <p className="text-gray-400">The route you visited does not exist.</p>
      <Link to="/dashboard" className="btn-primary mt-2">Go to Dashboard</Link>
    </div>
  );
}
