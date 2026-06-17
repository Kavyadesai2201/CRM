// /client/src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/api.js";
import { useAuthStore } from "../store/authStore.js";

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { user, token } = await authApi.login(form);
      setAuth(user, token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-brand-500/20 items-center justify-center text-3xl mb-4">🚀</div>
          <h1 className="text-2xl font-bold text-white">TechCRM</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to your workspace</p>
        </div>
        {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">Email</label>
            <input id="login-email" type="email" required value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white
                         placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500 transition"
              placeholder="you@company.com" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-1.5">Password</label>
            <input id="login-password" type="password" required value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white
                         placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500 transition"
              placeholder="••••••••" />
          </div>
          <button id="btn-login" type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
