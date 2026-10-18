export function SelectField({
  label,
  required = false,
  value,
  onChange,
  options,
  error,
  placeholder,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  placeholder: string;
}) {
  return (
    <div className="w-full">
      <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>
        {label} {required && <span style={{ color: "var(--brand-600)" }}>*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus-ring-premium"
        style={{
          background: "var(--bg-input)",
          color: "var(--text-1)",
          border: error ? "1px solid var(--brand-500)" : "1px solid var(--border)",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-xs font-medium" style={{ color: "var(--brand-600)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
