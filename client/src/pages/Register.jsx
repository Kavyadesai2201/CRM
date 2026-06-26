// /client/src/pages/Register.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../services/api.js";

// ─── Helpers ────────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ name, email, password, confirmPassword }) {
  const errors = {};
  if (!name.trim())
    errors.name = "Name is required";
  if (!email.trim())
    errors.email = "Email is required";
  else if (!EMAIL_RE.test(email.trim()))
    errors.email = "Enter a valid email address";
  if (!password)
    errors.password = "Password is required";
  else if (password.length < 6)
    errors.password = "Password must be at least 6 characters";
  if (!confirmPassword)
    errors.confirmPassword = "Please confirm your password";
  else if (password !== confirmPassword)
    errors.confirmPassword = "Passwords do not match";
  return errors;
}

const inputCls = (hasError) =>
  [
    "w-full px-4 py-2.5 rounded-xl bg-white/5 border text-white",
    "placeholder-gray-600 text-sm focus:outline-none transition",
    hasError
      ? "border-red-500/50 focus:border-red-500"
      : "border-white/10 focus:border-brand-500",
  ].join(" ");

// ─── Field wrapper ───────────────────────────────────────────────────────────────

function Field({ label, error, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-400 block mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────────

const EMPTY = { name: "", email: "", password: "", confirmPassword: "" };

export default function Register() {
  const navigate = useNavigate();

  const [form,        setForm]        = useState(EMPTY);
  const [errors,      setErrors]      = useState({});
  const [serverError, setServerError] = useState("");
  const [loading,     setLoading]     = useState(false);

  // Per-field change handler — clears that field's validation error on edit
  const set = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field])
      setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setServerError("");
    try {
      await authApi.register({
        name:     form.name.trim(),
        email:    form.email.trim(),
        password: form.password,
      });
      navigate("/login", { state: { email: form.email.trim() } });
    } catch (err) {
      setServerError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass w-full max-w-md p-8 space-y-6">

        {/* Logo + heading */}
        <div className="text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-brand-500/20 items-center justify-center text-3xl mb-4">
            🚀
          </div>
          <h1 className="text-2xl font-bold text-white">TechCRM</h1>
          <p className="text-gray-400 text-sm mt-1">Create your account to get started</p>
        </div>

        {/* Server error banner */}
        {serverError && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          <Field label="Full Name" error={errors.name}>
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              autoFocus
              value={form.name}
              onChange={set("name")}
              placeholder="Jane Doe"
              className={inputCls(!!errors.name)}
            />
          </Field>

          <Field label="Email" error={errors.email}>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set("email")}
              placeholder="you@company.com"
              className={inputCls(!!errors.email)}
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={set("password")}
              placeholder="••••••••"
              className={inputCls(!!errors.password)}
            />
          </Field>

          <Field label="Confirm Password" error={errors.confirmPassword}>
            <input
              id="register-confirm-password"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={set("confirmPassword")}
              placeholder="••••••••"
              className={inputCls(!!errors.confirmPassword)}
            />
          </Field>

          <button
            id="btn-register"
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-2.5"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        {/* Cross-link to login */}
        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
