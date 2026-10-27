"use client";

import * as React from "react";
import { Eraser, PenLine, Save, Upload, X } from "lucide-react";
import { Button } from "./button";
import { Modal } from "./modal";
import { Tabs } from "./tabs";

interface SignatureModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (base64: string) => void;
  title?: string;
}

interface SignaturePadHandle {
  clear: () => void;
  toDataUrl: () => string | null;
}

const INK_COLOR = "#111827";

const SignaturePad = React.forwardRef<
  SignaturePadHandle,
  { className?: string; onInkChange?: (hasInk: boolean) => void }
>(function SignaturePad({ className, onInkChange }, ref) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const drawingRef = React.useRef(false);
    const lastPointRef = React.useRef<{ x: number; y: number } | null>(null);
    const hasInkRef = React.useRef(false);
    const [hasInk, setHasInk] = React.useState(false);

    const syncSize = React.useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const density = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width * density));
      const height = Math.max(1, Math.round(rect.height * density));
      if (canvas.width === width && canvas.height === height) return;

      const snapshot = document.createElement("canvas");
      snapshot.width = canvas.width;
      snapshot.height = canvas.height;
      if (snapshot.width > 0 && snapshot.height > 0) {
        snapshot.getContext("2d")?.drawImage(canvas, 0, 0);
      }

      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = INK_COLOR;
      context.fillStyle = INK_COLOR;

      if (snapshot.width > 0 && snapshot.height > 0) {
        context.drawImage(snapshot, 0, 0, snapshot.width, snapshot.height, 0, 0, width, height);
      }
    }, []);

    const clear = React.useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
      hasInkRef.current = false;
      lastPointRef.current = null;
      setHasInk(false);
      onInkChange?.(false);
    }, [onInkChange]);

    React.useImperativeHandle(
      ref,
      () => ({
        clear,
        toDataUrl: () => {
          const canvas = canvasRef.current;
          if (!canvas || !hasInkRef.current) return null;
          return canvas.toDataURL("image/png");
        },
      }),
      [clear],
    );

    React.useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      syncSize();
      const observer = new ResizeObserver(syncSize);
      observer.observe(canvas);
      window.addEventListener("orientationchange", syncSize);
      return () => {
        observer.disconnect();
        window.removeEventListener("orientationchange", syncSize);
      };
    }, [syncSize]);

    function pointFromEvent(event: React.PointerEvent<HTMLCanvasElement>) {
      const canvas = event.currentTarget;
      const rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * (canvas.width / rect.width),
        y: (event.clientY - rect.top) * (canvas.height / rect.height),
      };
    }

    function strokeWidth(canvas: HTMLCanvasElement) {
      return Math.max(2, Math.round(canvas.width / 320));
    }

    function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      const canvas = event.currentTarget;
      const context = canvas.getContext("2d");
      if (!context) return;
      canvas.setPointerCapture(event.pointerId);
      drawingRef.current = true;
      const point = pointFromEvent(event);
      lastPointRef.current = point;
      const width = strokeWidth(canvas);
      context.fillStyle = INK_COLOR;
      context.beginPath();
      context.arc(point.x, point.y, width / 2, 0, Math.PI * 2);
      context.fill();
      hasInkRef.current = true;
      setHasInk(true);
      onInkChange?.(true);
    }

    function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
      if (!drawingRef.current) return;
      event.preventDefault();
      const canvas = event.currentTarget;
      const context = canvas.getContext("2d");
      const previous = lastPointRef.current;
      if (!context || !previous) return;
      const point = pointFromEvent(event);
      context.strokeStyle = INK_COLOR;
      context.lineWidth = strokeWidth(canvas);
      context.beginPath();
      context.moveTo(previous.x, previous.y);
      context.lineTo(point.x, point.y);
      context.stroke();
      lastPointRef.current = point;
    }

    function handlePointerEnd(event: React.PointerEvent<HTMLCanvasElement>) {
      drawingRef.current = false;
      lastPointRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }

    return (
      <div className={`relative overflow-hidden rounded-xl ${className ?? ""}`} style={{ background: "#ffffff" }}>
        <canvas
          ref={canvasRef}
          aria-label="Área de firma"
          className="h-full w-full"
          style={{ touchAction: "none", cursor: "crosshair" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onLostPointerCapture={() => {
            drawingRef.current = false;
            lastPointRef.current = null;
          }}
        />
        {!hasInk && (
          <span
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-semibold"
            style={{ color: "#9ca3af" }}
          >
            Firma aquí
          </span>
        )}
      </div>
    );
  },
);

function canvasToPng(source: HTMLCanvasElement): string {
  const maxSize = 1200;
  const ratio = Math.min(1, maxSize / Math.max(source.width, source.height));
  if (ratio === 1) return source.toDataURL("image/png");
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * ratio));
  canvas.height = Math.max(1, Math.round(source.height * ratio));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se pudo procesar la imagen.");
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

async function fileToPng(file: File): Promise<string> {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const documento = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    try {
      const pagina = await documento.getPage(1);
      const viewport = pagina.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No se pudo procesar el PDF.");
      await pagina.render({ canvasContext: context, viewport }).promise;
      return canvasToPng(canvas);
    } finally {
      await documento.destroy();
    }
  }

  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo procesar la imagen.");
    context.drawImage(bitmap, 0, 0);
    return canvasToPng(canvas);
  } finally {
    bitmap.close();
  }
}

function SignatureActions({
  onClose,
  onClear,
  onSave,
  canSave,
  saving,
}: {
  onClose: () => void;
  onClear: () => void;
  onSave: () => void;
  canSave: boolean;
  saving?: boolean;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button variant="outline" type="button" onClick={onClose}>
        <X size={16} />
        Cancelar
      </Button>
      <Button variant="outline" type="button" onClick={onClear}>
        <Eraser size={16} />
        Limpiar
      </Button>
      <Button type="button" onClick={onSave} disabled={!canSave} loading={saving}>
        <Save size={16} />
        Guardar firma
      </Button>
    </div>
  );
}

function DesktopSignature({ onClose, onSave }: { onClose: () => void; onSave: (base64: string) => void }) {
  const padRef = React.useRef<SignaturePadHandle>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [tab, setTab] = React.useState("dibujar");
  const [hasInk, setHasInk] = React.useState(false);
  const [uploaded, setUploaded] = React.useState<string | null>(null);
  const [processing, setProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      setUploaded(await fileToPng(file));
    } catch (e) {
      setUploaded(null);
      setError(e instanceof Error ? e.message : "No se pudo procesar el archivo.");
    } finally {
      setProcessing(false);
    }
  }

  function clear() {
    padRef.current?.clear();
    setHasInk(false);
    setUploaded(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function save() {
    const base64 = tab === "dibujar" ? padRef.current?.toDataUrl() : uploaded;
    if (!base64) {
      setError("Dibuja o sube una firma antes de guardar.");
      return;
    }
    onSave(base64);
    onClose();
  }

  const drawTab = (
    <div className="flex flex-col gap-2">
      <SignaturePad ref={padRef} className="h-56 w-full border" onInkChange={setHasInk} />
      <p className="text-xs" style={{ color: "var(--text-3)" }}>
        Usa el mouse, el touchpad o un lápiz. La firma se guarda como PNG con fondo transparente.
      </p>
      <span className="sr-only">{hasInk ? "Firma dibujada" : "Sin firma"}</span>
    </div>
  );

  const uploadTab = (
    <div className="flex flex-col gap-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,application/pdf"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          void handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors"
        style={{ borderColor: "var(--border)", background: "var(--bg-hover)", color: "var(--text-2)" }}
      >
        <Upload size={24} />
        <span className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
          {processing ? "Procesando archivo..." : "Seleccionar archivo"}
        </span>
        <span className="text-xs">PNG, JPG o PDF. Del PDF se usa la primera página.</span>
      </button>
      {uploaded && (
        <div className="rounded-xl border p-2" style={{ borderColor: "var(--border)", background: "#ffffff" }}>
          <img src={uploaded} alt="Firma cargada" className="mx-auto max-h-48 w-auto object-contain" />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <Tabs
        value={tab}
        onChange={(id) => {
          setTab(id);
          setError(null);
        }}
        tabs={[
          { id: "dibujar", label: "Dibujar", icon: <PenLine size={16} />, content: drawTab },
          { id: "subir", label: "Subir", icon: <Upload size={16} />, content: uploadTab },
        ]}
      />
      {error && (
        <p className="text-xs font-medium" style={{ color: "var(--brand-600)" }}>
          {error}
        </p>
      )}
      <SignatureActions
        onClose={onClose}
        onClear={clear}
        onSave={save}
        canSave={tab === "dibujar" ? hasInk : Boolean(uploaded)}
        saving={processing}
      />
    </div>
  );
}

function MobileSignature({ onClose, onSave }: { onClose: () => void; onSave: (base64: string) => void }) {
  const padRef = React.useRef<SignaturePadHandle>(null);
  const [hasInk, setHasInk] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function clear() {
    padRef.current?.clear();
    setHasInk(false);
    setError(null);
  }

  function save() {
    const base64 = padRef.current?.toDataUrl();
    if (!base64) {
      setError("Dibuja tu firma antes de guardar.");
      return;
    }
    onSave(base64);
    onClose();
  }

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col gap-3">
      <SignaturePad ref={padRef} className="min-h-[45vh] flex-1 border" onInkChange={setHasInk} />
      <span className="sr-only">{hasInk ? "Firma dibujada" : "Sin firma"}</span>
      {error && (
        <p className="text-xs font-medium" style={{ color: "var(--brand-600)" }}>
          {error}
        </p>
      )}
      <SignatureActions onClose={onClose} onClear={clear} onSave={save} canSave={hasInk} />
    </div>
  );
}

export function SignatureModal({ open, onClose, onSave, title = "Firma digital" }: SignatureModalProps) {
  if (!open) return null;

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={title}
      description="Captura la firma con el dedo, lápiz o mouse, o sube una imagen."
      className="max-sm:inset-0 max-sm:top-0 max-sm:left-0 max-sm:h-[100dvh] max-sm:max-h-none max-sm:w-screen max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0"
    >
      <div className="hidden sm:block">
        <DesktopSignature onClose={onClose} onSave={onSave} />
      </div>
      <div className="sm:hidden">
        <MobileSignature onClose={onClose} onSave={onSave} />
      </div>
    </Modal>
  );
}

export type { SignatureModalProps };
