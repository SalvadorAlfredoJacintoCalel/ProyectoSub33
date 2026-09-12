import React, { useEffect } from "react";

type AlertType = "success" | "warning";

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

function getIconElement(type: AlertType): React.ReactElement {
  switch (type) {
    case "success":
      return (
        <svg
          className="h-6 w-6 text-green-600"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
        </svg>
      );
    case "warning":
      return <ClockIcon />;
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
    default:
      return "w-12 h-12 rounded-full border-2 border-[#eab308] bg-[#fefce8] text-[#ca8a04] flex items-center justify-center";
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
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

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
          className="w-full bg-[#d92d20] text-white py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}