// /client/src/components/AddLeadModal.jsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useCreateLead } from "../hooks/useLeads.js";

// ─── Constants ─────────────────────────────────────────────────────────────────

const STAGES = [
  { value: "new",          label: "New" },
  { value: "contacted",    label: "Contacted" },
  { value: "qualified",    label: "Qualified" },
  { value: "proposal",     label: "Proposal" },
  { value: "negotiation",  label: "Negotiation" },
  { value: "closed_won",   label: "Closed Won" },
  { value: "closed_lost",  label: "Closed Lost" },
];

const SOURCES = [
  { value: "web",       label: "Web" },
  { value: "whatsapp",  label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "email",     label: "Email" },
  { value: "referral",  label: "Referral" },
  { value: "cold_call", label: "Cold Call" },
  { value: "other",     label: "Other" },
];

const EMPTY_FORM = {
  name: "", email: "", phone: "", company: "",
  source: "", stage: "new", deal_value: "",
};

// ─── Validation ────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
  const errors = {};
  if (!form.name.trim())
    errors.name = "Name is required";
  if (!form.email.trim())
    errors.email = "Email is required";
  else if (!EMAIL_RE.test(form.email.trim()))
    errors.email = "Enter a valid email address";
  if (form.deal_value !== "" &&
      (isNaN(Number(form.deal_value)) || Number(form.deal_value) < 0))
    errors.deal_value = "Must be a non-negative number";
  return errors;
}

// ─── Shared style helpers ──────────────────────────────────────────────────────

const inputCls = (hasError) =>
  [
    "w-full px-3 py-2 rounded-xl text-sm text-white placeholder-gray-600",
    "bg-white/5 border focus:outline-none transition",
    hasError
      ? "border-red-500/50 focus:border-red-500"
      : "border-white/10 focus:border-brand-500",
  ].join(" ");

const selectCls =
  "w-full px-3 py-2 rounded-xl text-sm text-gray-300 " +
  "bg-gray-900 border border-white/10 focus:outline-none focus:border-brand-500 transition";

// ─── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-400">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

export default function AddLeadModal({ isOpen, onClose }) {
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [errors,      setErrors]      = useState({});
  const [serverError, setServerError] = useState("");

  const { mutate, isPending } = useCreateLead();

  // Reset state every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
      setServerError("");
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Per-field change handler — clears that field's error on edit
  const set = (field) => (e) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setServerError("");

    const payload = {
      name:    form.name.trim(),
      email:   form.email.trim(),
      stage:   form.stage || "new",
      ...(form.phone.trim()  && { phone:      form.phone.trim() }),
      ...(form.company.trim() && { company:   form.company.trim() }),
      ...(form.source        && { source:     form.source }),
      ...(form.deal_value !== "" && { deal_value: Number(form.deal_value) }),
    };

    mutate(payload, {
      onSuccess: () => onClose(),
      onError:   (err) =>
        setServerError(
          err?.response?.data?.error || "Failed to create lead. Please try again."
        ),
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel — sits above backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="glass w-full max-w-lg rounded-2xl p-6 space-y-5 pointer-events-auto
                     shadow-2xl shadow-black/60"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Add Lead</h2>
              <p className="text-xs text-gray-500 mt-0.5">Fill in the details to create a new lead</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-gray-500 hover:text-white transition text-2xl leading-none
                         w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
            >
              ×
            </button>
          </div>

          {/* Server error banner */}
          {serverError && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30
                            text-red-400 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Row: Name + Email */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name *" error={errors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Jane Doe"
                  autoFocus
                  className={inputCls(!!errors.name)}
                />
              </Field>
              <Field label="Email *" error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="jane@company.com"
                  className={inputCls(!!errors.email)}
                />
              </Field>
            </div>

            {/* Row: Phone + Company */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="+1 555 0100"
                  className={inputCls(false)}
                />
              </Field>
              <Field label="Company">
                <input
                  type="text"
                  value={form.company}
                  onChange={set("company")}
                  placeholder="Acme Corp"
                  className={inputCls(false)}
                />
              </Field>
            </div>

            {/* Row: Source + Stage */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Source">
                <select value={form.source} onChange={set("source")} className={selectCls}>
                  <option value="">— Select —</option>
                  {SOURCES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Stage">
                <select value={form.stage} onChange={set("stage")} className={selectCls}>
                  {STAGES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Deal Value */}
            <Field label="Deal Value ($)" error={errors.deal_value}>
              <input
                type="number"
                min="0"
                step="any"
                value={form.deal_value}
                onChange={set("deal_value")}
                placeholder="0"
                className={inputCls(!!errors.deal_value)}
              />
            </Field>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={onClose} className="btn-ghost">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? "Creating…" : "Create Lead"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
}
