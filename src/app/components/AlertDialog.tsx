import React, { useEffect } from "react";

type AlertType = "success" | "warning" | "error" | "incomplete";

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: AlertType;
}

function ClockIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function getIconElement(type: AlertType): React.ReactElement {
  switch (type) {
    case "success":
      return <CheckIcon />;
    case "warning":
    case "incomplete":
      return <ClockIcon />;
    case "error":
      return <AlertIcon />;
    default:
      return <ClockIcon />;
  }
}

function getIconContainerClass(type: AlertType): string {
  switch (type) {
    case "success":
      return "w-12 h-12 rounded-full border-2 border-green-300 bg-green-50 text-green-600 flex items-center justify-center";
    case "warning":
      return "w-12 h-12 rounded-full border-2 border-[#eab308] bg-[#fefce8] text-[#ca8a04] flex items-center justify-center";
    case "incomplete":
      return "w-12 h-12 rounded-full border-2 border-[#eab308] bg-[#fefce8] text-[#ca8a04] flex items-center justify-center";
    case "error":
      return "w-12 h-12 rounded-full border-2 border-red-300 bg-red-50 text-red-600 flex items-center justify-center";
    default:
      return "w-12 h-12 rounded-full border-2 border-[#eab308] bg-[#fefce8] text-[#ca8a04] flex items-center justify-center";
  }
}

function getButtonClass(type: AlertType): string {
  switch (type) {
    case "success":
      return "w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-medium transition-colors";
    case "warning":
    case "incomplete":
      return "w-full bg-[#d92d20] text-white py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity";
    case "error":
      return "w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-medium transition-colors";
    default:
      return "w-full bg-[#d92d20] text-white py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity";
  }
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  type,
}: AlertDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    if (type === "warning" || type === "incomplete") {
      const timer = setTimeout(() => {
        onClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 w-full max-w-sm text-center flex flex-col items-center gap-4"
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-gray-100"
          >
            <svg
              className="h-5 w-5 text-gray-500"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Icon */}
        <div className={getIconContainerClass(type)}>
          {getIconElement(type)}
        </div>

        {/* Message */}
        <p className="text-sm text-gray-700">{message}</p>

        {/* Button */}
        <button
          onClick={onClose}
          className={getButtonClass(type)}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}