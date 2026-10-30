import { useEffect } from "react";

const LAST_ACTIVITY_KEY = "sub33.lastActivityAt";

const DEFAULT_TIMEOUT_MINUTES = 5;
const CHECK_INTERVAL_MS = 20 * 1000;

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
] as const;

function timeoutMinutes(): number {
  const raw = import.meta.env?.VITE_IDLE_TIMEOUT_MINUTES;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TIMEOUT_MINUTES;
}

export function recordActivity(): void {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  } catch {
    /* noop */
  }
}

function clearActivity(): void {
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    /* noop */
  }
}

export function useIdleLogout(onIdle: () => void, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    recordActivity();

    const onActivity = () => recordActivity();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }

    const interval = window.setInterval(() => {
      let last: number | null = null;
      try {
        const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
        last = raw ? Number(raw) : null;
      } catch {
        /* noop */
      }

      if (last && Date.now() - last > timeoutMinutes() * 60 * 1000) {
        onIdle();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      window.clearInterval(interval);
      clearActivity();
    };
  }, [onIdle, enabled]);
}
