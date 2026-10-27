"use client";

import * as React from "react";

import { cn } from "./utils";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
type AvatarStatus = "online" | "offline" | "busy" | "away";

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
  xl: "size-20 text-2xl",
};

const STATUS_COLORS: Record<AvatarStatus, string> = {
  online: "bg-[var(--success-500)]",
  offline: "bg-[var(--neutral-300)]",
  busy: "bg-[var(--brand-500)]",
  away: "bg-[var(--warning-500)]",
};

const STATUS_SIZE: Record<AvatarSize, string> = {
  xs: "size-2",
  sm: "size-2.5",
  md: "size-3",
  lg: "size-3.5",
  xl: "size-4",
};

function getInitials(name?: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  onUpload?: (file: File) => void;
}

function Avatar({
  src,
  alt,
  name,
  size = "md",
  status,
  onUpload,
  className,
  ...props
}: AvatarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const imgSrc = preview ?? src;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload?.(file);
    setPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full ring-2 ring-white",
        SIZE_CLASSES[size],
        onUpload && "group cursor-pointer",
        className,
      )}
      onClick={() => onUpload && inputRef.current?.click()}
      {...props}
    >
      {imgSrc ? (
        <img src={imgSrc} alt={alt ?? name ?? "avatar"} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[var(--grad-primary)] font-semibold text-white">
          {getInitials(name)}
        </div>
      )}
      {onUpload && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="rounded-md bg-[var(--glass-bg-subtle)] px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
            Cambiar
          </span>
        </div>
      )}
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-white",
            STATUS_SIZE[size],
            STATUS_COLORS[status],
          )}
        />
      )}
      {onUpload && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      )}
    </div>
  );
}

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  max?: number;
}

function AvatarGroup({ children, max, className, ...props }: AvatarGroupProps) {
  const childrenArray = React.Children.toArray(children);
  const visible = max ? childrenArray.slice(0, max) : childrenArray;
  const overflow = max ? childrenArray.length - max : 0;

  return (
    <div className={cn("flex items-center -space-x-2", className)} {...props}>
      {visible.map((child, i) => (
        <div key={i} className="relative" style={{ zIndex: visible.length - i }}>
          {child}
        </div>
      ))}
      {overflow > 0 && (
        <div className="flex size-10 items-center justify-center rounded-full bg-[var(--bg-hover)] text-xs font-semibold text-[var(--text-2)] ring-2 ring-white">
          +{overflow}
        </div>
      )}
    </div>
  );
}

export { Avatar, AvatarGroup };
export type { AvatarProps, AvatarGroupProps, AvatarSize, AvatarStatus };
