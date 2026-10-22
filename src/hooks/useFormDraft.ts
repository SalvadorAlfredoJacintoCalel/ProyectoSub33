import { useCallback, useEffect, useRef, useState } from "react";

const PREFIX = "sub33.draft.";

export interface FormDraftState<T> {
  draft: T | null;
  savedAt: number | null;
  online: boolean;
  save: (value: T) => void;
  clear: () => void;
}

function readDraft<T>(storageKey: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function useFormDraft<T>(storageKey: string): FormDraftState<T> {
  const [draft, setDraft] = useState<T | null>(() => readDraft<T>(storageKey));
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [online, setOnline] = useState<boolean>(
    () => typeof navigator === "undefined" || navigator.onLine
  );
  const timerRef = useRef<number | null>(null);
  const lastValueRef = useRef<T | null>(null);

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

  const writeNow = useCallback(
    (value: T) => {
      try {
        localStorage.setItem(PREFIX + storageKey, JSON.stringify(value));
      } catch {
        /* noop */
      }
    },
    [storageKey]
  );

  const flush = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    if (lastValueRef.current !== null) {
      writeNow(lastValueRef.current);
      lastValueRef.current = null;
    }
  }, [writeNow]);

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
      lastValueRef.current = value;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        writeNow(value);
        lastValueRef.current = null;
        setSavedAt(Date.now());
      }, 300);
    },
    [writeNow]
  );

  const clear = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    lastValueRef.current = null;
    try {
      localStorage.removeItem(PREFIX + storageKey);
    } catch {
      /* noop */
    }
    setDraft(null);
    setSavedAt(null);
  }, [storageKey]);

  useEffect(() => {
    return () => {
      flush();
    };
  }, [flush]);

  return { draft, savedAt, online, save, clear };
}
