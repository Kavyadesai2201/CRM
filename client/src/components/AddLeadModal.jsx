// /client/src/components/AddLeadModal.jsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useCreateLead } from "../hooks/useLeads.js";

// ─── Constants ─────────────────────────────────────────────────────────────────

const STAGES = [
  { value: "new",         label: "New" },
  { value: "contacted",   label: "Contacted" },
  { value: "qualified",   label: "Qualified" },
  { value: "proposal",    label: "Proposal" },
  { value: "closed_won",  label: "Closed Won" },
];

const SOURCES = [
  { value: "whatsapp",  label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "manual",    label: "Manual" },
  { value: "referral",  label: "Referral" },
  { value: "other",     label: "Other" },
];

const EMPTY_FORM = {
  name: "", phone: "", source: "manual", stage: "new", notes: "",
};

// ─── Validation ────────────────────────────────────────────────────────────────

function validate(form) {
  const errors = {};
  if (!form.name.trim())  errors.name  = "Name is required";
  if (!form.phone.trim()) errors.phone = "Phone number is required";
  return errors;
}

// ─── Style helpers ─────────────────────────────────────────────────────────────

const inputCls = (hasError) =>
  [
    "w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-gray-600",
    "bg-white/5 border focus:outline-none transition",
    hasError
      ? "border-red-500/50 focus:border-red-500"
      : "border-white/10 focus:border-brand-500",
  ].join(" ");

const selectCls =
  "w-full px-3 py-2.5 rounded-xl text-sm text-gray-300 " +
  "bg-gray-900 border border-white/10 focus:outline-none focus:border-brand-500 transition";

// ─── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-400">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

export default function AddLeadModal({ isOpen, onClose, onSuccess }) {
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [errors,      setErrors]      = useState({});
  const [serverError, setServerError] = useState("");

  const { mutate, isPending } = useCreateLead();

  // Reset every time the modal opens
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

  const set = (field) => (e) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setServerError("");

    mutate(
      {
        name:   form.name.trim(),
        phone:  form.phone.trim(),
        source: form.source || "manual",
        stage:  form.stage  || "new",
        ...(form.notes.trim() && { notes: form.notes.trim() }),
      },
      {
        onSuccess: () => { onClose(); onSuccess?.(); },
        onError:   (err) =>
          setServerError(err?.response?.data?.error || "Failed to create lead. Please try again."),
      }
    );
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="glass w-full max-w-md rounded-2xl p-6 space-y-5 pointer-events-auto
                     shadow-2xl shadow-black/60"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Add Lead</h2>
              <p className="text-xs text-gray-500 mt-0.5">Create a new lead manually</p>
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

          {/* Server error */}
          {serverError && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Name */}
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

            {/* Phone */}
            <Field label="Phone Number *" error={errors.phone}>
              <input
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                placeholder="+91 98765 43210"
                className={inputCls(!!errors.phone)}
              />
            </Field>

            {/* Source + Stage */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Source">
                <select value={form.source} onChange={set("source")} className={selectCls}>
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

            {/* Notes */}
            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={set("notes")}
                placeholder="Any additional context about this lead…"
                rows={3}
                className={inputCls(false) + " resize-none"}
              />
            </Field>

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
