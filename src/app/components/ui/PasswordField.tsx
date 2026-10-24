"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./input";
import { cn } from "./utils";

interface PasswordFieldProps extends React.ComponentProps<"input"> {
  label?: string;
  error?: string;
  show?: boolean;
  onToggle?: () => void;
}

function PasswordField({ label, error, show, onToggle, className, id, ...props }: PasswordFieldProps) {
  const [internalShow, setInternalShow] = React.useState(false);
  const visible = show !== undefined ? show : internalShow;
  const toggle = onToggle ?? (() => setInternalShow((v) => !v));

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        label={label}
        error={error}
        className={cn("pr-11", className)}
        {...props}
      />
      <button
        type="button"
        onClick={toggle}
        tabIndex={-1}
        title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 transition-colors"
        style={{ color: "var(--text-3)", background: "transparent", border: "none", cursor: "pointer" }}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export { PasswordField };
export type { PasswordFieldProps };
