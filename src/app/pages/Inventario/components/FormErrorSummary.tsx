import { AlertTriangle } from "lucide-react";

export function FormErrorSummary({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      className="mb-4 flex items-start gap-3 rounded-xl border p-3 text-sm"
      style={{ borderColor: "var(--brand-300)", background: "var(--brand-100)", color: "var(--brand-700)" }}
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: "var(--brand-600)" }} />
      <span>Por favor corrige los campos marcados antes de continuar.</span>
    </div>
  );
}
