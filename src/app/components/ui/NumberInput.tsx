"use client";

import { useRef } from "react";
import { Input, type InputProps } from "./input";
import { useAlert } from "./AlertSystem";
import { sanitizeNumber } from "@/hooks/useFormValidation";

interface NumberInputProps extends Omit<InputProps, "type" | "onChange"> {
  value: string | number;
  onChange: (value: string) => void;
  allowDecimal?: boolean;
  min?: number;
  max?: number;
}

export function NumberInput({ value, onChange, allowDecimal = false, min, max, ...props }: NumberInputProps) {
  const { toast } = useAlert();
  const lastToastRef = useRef(0);

  function handleChange(raw: string) {
    const sanitized = sanitizeNumber(raw, allowDecimal);
    if (sanitized !== raw) {
      const now = Date.now();
      if (now - lastToastRef.current > 800) {
        lastToastRef.current = now;
        toast.error("Solo se permiten números en este campo");
      }
    }
    onChange(sanitized);
  }

  return (
    <Input
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      value={String(value ?? "")}
      onChange={(e) => handleChange(e.target.value)}
      min={min}
      max={max}
      {...props}
    />
  );
}
