"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "./utils";
import { buttonVariants } from "./button";
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  X,
  Check,
  AlertTriangle as AlertTriangleIcon,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export type AlertType = "success" | "error" | "warning" | "info" | "confirm";

export interface AlertConfig {
  title: string;
  message: string;
  type: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  showCancel?: boolean;
  loading?: boolean;
}

export interface ToastConfig {
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

// ============================================================================
// Toast Component
// ============================================================================

interface ToastItem extends ToastConfig {
  id: string;
}

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2" role="region" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: ToastItem;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(toast.id), 200);
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const typeStyles = {
    success: "bg-green-600 border-green-700",
    error: "bg-red-600 border-red-700",
    warning: "bg-amber-500 border-amber-600",
    info: "bg-blue-600 border-blue-700",
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3.5 text-white shadow-xl border",
        "min-w-[280px] max-w-md animate-in slide-in-from-right duration-300",
        isExiting && "animate-out fade-out-80 slide-out-to-right duration-200",
        typeStyles[toast.type]
      )}
      role="alert"
      aria-live="polite"
    >
      <span className="flex-shrink-0" aria-hidden="true">
        {icons[toast.type]}
      </span>
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onClose(toast.id), 200);
        }}
        className="ml-4 text-white/70 hover:text-white transition-colors p-1 rounded"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Toast Store
interface ToastStoreState {
  toasts: ToastItem[];
  addToast: (toast: ToastConfig) => void;
  removeToast: (id: string) => void;
}

const ToastStore = React.createContext<ToastStoreState | null>(null);

function useToastStore() {
  const context = React.useContext(ToastStore);
  if (!context) throw new Error("useToastStore must be used within ToastProvider");
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const addToast = React.useCallback((config: ToastConfig) => {
    const id = Math.random().toString(36).slice(2, 9);
    const toast: ToastItem = {
      ...config,
      id,
      duration: config.duration ?? 4000,
    };
    setToasts((prev) => [...prev, toast]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastStore.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastStore.Provider>
  );
}

// ============================================================================
// Alert Dialog Component
// ============================================================================

const ALERT_CONFIGS: Record<AlertType, {
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
  titleColor: string;
  iconColor: string;
}> = {
  success: {
    icon: <CheckCircle className="h-7 w-7" />,
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    titleColor: "text-green-800",
    iconColor: "text-green-600",
  },
  error: {
    icon: <AlertCircle className="h-7 w-7" />,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    titleColor: "text-red-800",
    iconColor: "text-red-600",
  },
  warning: {
    icon: <AlertTriangleIcon className="h-7 w-7" />,
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    titleColor: "text-amber-800",
    iconColor: "text-amber-600",
  },
  info: {
    icon: <Info className="h-7 w-7" />,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    titleColor: "text-blue-800",
    iconColor: "text-blue-600",
  },
  confirm: {
    icon: <AlertTriangleIcon className="h-7 w-7" />,
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    titleColor: "text-amber-800",
    iconColor: "text-amber-600",
  },
};

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: AlertConfig;
}

function AlertDialog({ isOpen, onClose, config }: AlertDialogProps) {
  if (!isOpen) return null;

  const { icon, bgColor, borderColor, titleColor, iconColor } = ALERT_CONFIGS[config.type];

  const handleConfirm = async () => {
    if (config.loading) return;
    if (config.onConfirm) {
      try {
        await config.onConfirm();
      } catch (e) {
        // Error handled by caller
      }
    }
    onClose();
  };

  const handleCancel = () => {
    if (config.onCancel) config.onCancel();
    onClose();
  };

  return (
    <AlertDialogPrimitive.Root>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialogPrimitive.Content className={cn(
          "fixed top-[50%] left-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%]",
          "rounded-2xl shadow-xl border",
          "bg-white dark:bg-gray-900",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        )}>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl",
                  "bg-opacity-10"
                )} style={{ backgroundColor: bgColor.replace("bg-", "bg-").replace("-50", "-100") }}>
                  <span className={cn("h-7 w-7", "text-opacity-90")} style={{ color: iconColor.replace("text-", "") }}>
                    {icon}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <AlertDialogPrimitive.Title className="text-lg font-semibold">
                  {config.title}
                </AlertDialogPrimitive.Title>
                <AlertDialogPrimitive.Description className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {config.message}
                </AlertDialogPrimitive.Description>
              </div>
            </div>
          </div>

          <AlertDialogPrimitive.Footer className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            {config.showCancel !== false && (
              <AlertDialogPrimitive.Cancel
                onClick={handleCancel}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full sm:w-auto"
                )}
              >
                {config.cancelText ?? "Cancelar"}
              </AlertDialogPrimitive.Cancel>
            )}

            <AlertDialogPrimitive.Action
              onClick={handleConfirm}
              disabled={config.loading}
              className={cn(
                buttonVariants({ variant: config.type === "error" || config.type === "confirm" ? "destructive" : "default" }),
                "w-full sm:w-auto",
                config.loading && "opacity-50 cursor-not-allowed"
              )}
            >
              {config.loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                config.confirmText ?? (config.type === "confirm" ? "Confirmar" : "Aceptar")
              )}
            </AlertDialogPrimitive.Action>
          </AlertDialogPrimitive.Footer>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
  }

// ============================================================================
// Alert Provider & Hook
// ============================================================================

interface AlertState {
  isOpen: boolean;
  config: AlertConfig | null;
}

const AlertStore = React.createContext<{
  alert: (config: AlertConfig) => Promise<boolean>;
  closeAlert: () => void;
  alertState: AlertState;
} | null>(null);

function useAlertStore() {
  const context = React.useContext(AlertStore);
  if (!context) throw new Error("useAlert must be used within AlertProvider");
  return context;
}

interface AlertProviderProps {
  children: React.ReactNode;
}

export function AlertProvider({ children }: AlertProviderProps) {
  const [alertState, setAlertState] = React.useState<AlertState>({
    isOpen: false,
    config: null,
  });

  const alert = React.useCallback((config: AlertConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        config: {
          ...config,
          onConfirm: async () => {
            if (config.onConfirm) await config.onConfirm();
            resolve(true);
          },
          onCancel: () => {
            if (config.onCancel) config.onCancel();
            resolve(false);
          },
        },
      });
    });
  }, []);

  const closeAlert = React.useCallback(() => {
    setAlertState({ isOpen: false, config: null });
  }, []);

  return (
    <AlertStore.Provider value={{ alert, closeAlert, alertState }}>
      {children}
      <AlertDialog isOpen={alertState.isOpen} onClose={closeAlert} config={alertState.config!} />
      <ToastProvider>
        {/* ToastProvider handles its own rendering */}
      </ToastProvider>
    </AlertStore.Provider>
  );
}

// ============================================================================
// Hooks for easy usage
// ============================================================================

export function useAlert() {
  const { alert, closeAlert, alertState } = useAlertStore();
  return { alert, closeAlert, alertState };
}

export function useToast() {
  const { addToast, removeToast } = useToastStore();
  return { toast: addToast, dismissToast: removeToast };
}

// ============================================================================
// Convenience functions
// ============================================================================

export const alert = {
  success: (title: string, message: string) =>
    alert({ type: "success", title, message }),

  error: (title: string, message: string) =>
    alert({ type: "error", title, message }),

  warning: (title: string, message: string) =>
    alert({ type: "warning", title, message }),

  info: (title: string, message: string) =>
    alert({ type: "info", title, message }),

  confirm: (title: string, message: string) =>
    alert({ type: "confirm", title, message, showCancel: true }),
};

export const toast = {
  success: (message: string, duration?: number) =>
    toast({ type: "success", message, duration }),

  error: (message: string, duration?: number) =>
    toast({ type: "error", message, duration }),

  warning: (message: string, duration?: number) =>
    toast({ type: "warning", message, duration }),

  info: (message: string, duration?: number) =>
    toast({ type: "info", message, duration }),
};

export default {
  AlertProvider,
  useAlert,
  useToast,
  AlertDialog,
  ToastProvider,
  toast,
  alert,
};