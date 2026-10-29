export const DRAFT_OPEN_EVENT = "sub33:open-draft";

interface PendingOpen {
  module: string;
  key: string;
}

let pending: PendingOpen | null = null;

export function requestOpenDraft(module: string, key: string): void {
  pending = { module, key };
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DRAFT_OPEN_EVENT, { detail: { module, key } }));
  }
}

export function consumeDraftOpenRequest(module: string): string | null {
  if (pending && pending.module === module) {
    const key = pending.key;
    pending = null;
    return key;
  }
  return null;
}

export function subscribeOpenDraft(
  listener: (module: string, key: string) => void
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<{ module: string; key: string }>).detail;
    if (!detail) return;
    listener(detail.module, detail.key);
  };

  window.addEventListener(DRAFT_OPEN_EVENT, handler);
  return () => window.removeEventListener(DRAFT_OPEN_EVENT, handler);
}
