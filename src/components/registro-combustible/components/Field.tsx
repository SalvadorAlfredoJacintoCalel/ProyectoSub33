import type { ChangeEvent } from "react";
import type { FieldType } from "../types/spec";
import { SignaturePad } from "./SignaturePad";

interface FieldProps {
  fieldType: FieldType;
  value?: string | number | null;
  onChange?: (value: string | null) => void;
  options?: string[];
  label?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  required?: boolean;
}

const alignClass: Record<string, string> = {
  number: "rc-input--right",
  decimal: "rc-input--right",
  currency: "rc-input--right",
};

export function Field({ fieldType, value, onChange, options, label, placeholder, min, max, required }: FieldProps) {
  const common = {
    className: `rc-input ${alignClass[fieldType] ?? ""}`,
    value: value ?? "",
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange?.(e.target.value),
    placeholder,
    required,
  };

  switch (fieldType) {
    case "date":
      return <input type="text" {...common} inputMode="numeric" placeholder={placeholder ?? "DD/MM/YYYY"} />;
    case "number":
      return <input type="number" {...common} min={min} max={max} step={1} />;
    case "decimal":
      return <input type="number" {...common} min={min} step="0.01" />;
    case "currency":
      return <input type="number" {...common} min={min} step="0.01" />;
    case "select":
      return (
        <select {...common}>
          <option value="">—</option>
          {(options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case "textarea":
      return <textarea {...common} rows={2} style={{ resize: "none", whiteSpace: "pre-wrap" }} />;
    case "signature":
      return (
        <SignaturePad
          value={typeof value === "string" ? value : null}
          onChange={(b64) => onChange?.(b64)}
        />
      );
    case "compound":
      return <input type="text" {...common} />;
    default:
      return <input type="text" {...common} />;
  }
}
