import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

const LAST_ERROR_KEY = "sub33.lastError";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Cambiar este valor reinicia el boundary (p. ej. al navegar entre módulos). */
  resetKey?: unknown;
  /** Etiqueta para identificar la zona que falló (ej. "Personal"). */
  label?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

function persistError(label: string | undefined, error: Error, info?: ErrorInfo): void {
  try {
    const payload = {
      at: new Date().toISOString(),
      label: label ?? "app",
      message: error.message,
      stack: error.stack ?? "",
      componentStack: info?.componentStack ?? "",
    };
    localStorage.setItem(LAST_ERROR_KEY, JSON.stringify(payload));
  } catch {
    /* noop */
  }
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || "Error inesperado" };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    persistError(this.props.label, error, info);
    // Mantener la traza en consola para depuración desde el teléfono.
    console.error(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ""}]`, error, info);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, message: "" });
    }
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, message: "" });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleHome = (): void => {
    try {
      localStorage.removeItem("sub33.activeNav");
    } catch {
      /* noop */
    }
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="flex min-h-screen w-full flex-col items-center justify-center gap-6 px-6 py-10"
        style={{ background: "var(--bg-page)", fontFamily: "Inter, sans-serif" }}
      >
        <div
          className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl p-8 text-center"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "var(--brand-50)", color: "var(--brand-600)" }}
          >
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-lg font-bold" style={{ color: "var(--text-1)", fontFamily: "Manrope, sans-serif" }}>
              Algo salió mal
            </h1>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              Ocurrió un error al mostrar esta sección. Puedes reintentar sin perder tus datos guardados.
            </p>
            {this.state.message ? (
              <p className="mt-1 break-words text-xs" style={{ color: "var(--text-3)" }}>
                {this.state.message}
              </p>
            ) : null}
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={this.handleRetry}
              className="flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--grad-primary)" }}
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-colors"
              style={{ background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)" }}
            >
              <RefreshCw className="h-4 w-4" />
              Recargar
            </button>
            <button
              type="button"
              onClick={this.handleHome}
              className="flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-colors"
              style={{ background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)" }}
            >
              <Home className="h-4 w-4" />
              Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export function readLastError(): { at: string; label: string; message: string; stack: string } | null {
  try {
    const raw = localStorage.getItem(LAST_ERROR_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
