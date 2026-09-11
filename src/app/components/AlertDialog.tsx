import React from "react";

type AlertType = "success" | "warning" | "error";

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: AlertType;
}

function getIconClassName(type: AlertType): string {
  switch (type) {
    case "success":
      return "text-green-600";
    case "warning":
      return "text-yellow-600";
    case "error":
      return "text-red-600";
  }
}

function getIconElement(type: AlertType): React.ReactElement {
  switch (type) {
    case "success":
      return <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
      </svg>;
    case "warning":
      return <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zM12 4l-2 4h4l2-4M12 1l-2 4h4l2-4" />
      </svg>;
    case "error":
      return <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>;
  }
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  type,
}: AlertDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
    >
      <div
        className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-sm overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-gray-100"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex items-center gap-4">
          <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${getIconClassName(type)}`}>
            {getIconElement(type)}
          </div>
          <div>
            <p className="text-sm text-gray-700">{message}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-90"
            style={{ background: "#D32F2F" }}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}