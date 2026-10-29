import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearDraftKey,
  emitDraftsChanged,
  readDraftMeta,
  readDraftValue,
  writeDraftValue,
  type DraftMeta,
} from "@/services/drafts/draftRegistry";

export interface FormDraftState<T> {
  draft: T | null;
  savedAt: number | null;
  online: boolean;
  save: (value: T) => void;
  clear: () => void;
  reset: () => void;
}

export interface UseFormDraftOptions {
  module: string;
  label: string;
  entityId?: string | null;
  username?: string | null;
  dirty?: boolean;
}

function readSavedAt(storageKey: string): number | null {
  return readDraftMeta(storageKey)?.updatedAt ?? null;
}

export function useFormDraft<T>(
  storageKey: string,
  options: UseFormDraftOptions
): FormDraftState<T> {
  const { module, label, entityId = null, username = null, dirty = true } = options;

  const [draft, setDraft] = useState<T | null>(() => readDraftValue<T>(storageKey));
  const [savedAt, setSavedAt] = useState<number | null>(() => readSavedAt(storageKey));
  const [online, setOnline] = useState<boolean>(
    () => typeof navigator === "undefined" || navigator.onLine
  );

  const timerRef = useRef<number | null>(null);
  const lastValueRef = useRef<T | null>(null);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const optionsRef = useRef({ module, label, entityId, username });
  optionsRef.current = { module, label, entityId, username };

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
    }
    function handleOffline() {
      setOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Recarga el borrador cuando cambia la clave (p. ej. edición de otro registro).
  useEffect(() => {
    setDraft(readDraftValue<T>(storageKey));
    setSavedAt(readSavedAt(storageKey));
  }, [storageKey]);

  const write = useCallback(
    (value: T, now: number) => {
      const opts = optionsRef.current;
      const meta: DraftMeta = {
        key: storageKey,
        module: opts.module,
        label: opts.label,
        entityId: opts.entityId,
        username: opts.username,
        updatedAt: now,
      };
      writeDraftValue(storageKey, value, meta);
    },
    [storageKey]
  );

  const flush = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    if (lastValueRef.current === null) return;
    const value = lastValueRef.current;
    lastValueRef.current = null;
    if (!dirtyRef.current) return;
    const now = Date.now();
    write(value, now);
    setSavedAt(now);
    emitDraftsChanged();
  }, [write]);

  useEffect(() => {
    function handlePageHide() {
      flush();
    }
    function handleVisibility() {
      if (document.visibilityState === "hidden") flush();
    }
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [flush]);

  const save = useCallback(
    (value: T) => {
      setDraft(value);
      lastValueRef.current = value;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        flush();
      }, 300);
    },
    [flush]
  );

  const reset = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    lastValueRef.current = null;
    clearDraftKey(storageKey);
    setDraft(null);
    setSavedAt(null);
    emitDraftsChanged();
  }, [storageKey]);

  const clear = reset;

  useEffect(() => {
    return () => {
      flush();
    };
  }, [flush]);

  return { draft, savedAt, online, save, clear, reset };
}
