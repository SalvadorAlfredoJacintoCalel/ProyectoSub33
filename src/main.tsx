import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import App from "./app/App.tsx";
import { ErrorBoundary } from "./app/components/ErrorBoundary.tsx";
import "./styles/index.css";

// Captura de errores globales (async, event handlers) para diagnóstico en móvil.
function persistGlobalError(message: string, stack?: string): void {
  try {
    localStorage.setItem(
      "sub33.lastError",
      JSON.stringify({
        at: new Date().toISOString(),
        label: "global",
        message,
        stack: stack ?? "",
        componentStack: "",
      }),
    );
  } catch {
    /* noop */
  }
}

window.addEventListener("error", (event) => {
  persistGlobalError(event.message || "Error", event.error?.stack);
});
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const message =
    reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "Promesa rechazada";
  persistGlobalError(message, reason instanceof Error ? reason.stack : undefined);
});

createRoot(document.getElementById("root")!).render(
  <>
    <ErrorBoundary label="app">
      <App />
    </ErrorBoundary>
    <Toaster position="top-right" richColors closeButton />
  </>,
);
