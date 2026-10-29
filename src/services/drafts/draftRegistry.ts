export interface DraftMeta {
  key: string;
  module: string;
  label: string;
  entityId?: string | null;
  username?: string | null;
  updatedAt: number;
}

const DATA_PREFIX = "sub33.draft.";
const META_PREFIX = "sub33.draftmeta.";

export const DRAFTS_CHANGED_EVENT = "sub33:drafts-changed";
export const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function emitDraftsChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DRAFTS_CHANGED_EVENT));
  }
}

export function readDraftMeta(key: string): DraftMeta | null {
  if (!hasStorage()) return null;
  try {
    const raw = localStorage.getItem(META_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as DraftMeta;
  } catch {
    return null;
  }
}

export function readDraftValue<T>(key: string): T | null {
  if (!hasStorage()) return null;
  try {
    const raw = localStorage.getItem(DATA_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeDraftValue<T>(key: string, value: T, meta: DraftMeta): void {
  if (!hasStorage()) return;
  try {
    localStorage.setItem(DATA_PREFIX + key, JSON.stringify(value));
    localStorage.setItem(META_PREFIX + key, JSON.stringify(meta));
  } catch {
    /* noop */
  }
}

export function clearDraftKey(key: string): void {
  if (!hasStorage()) return;
  try {
    localStorage.removeItem(DATA_PREFIX + key);
    localStorage.removeItem(META_PREFIX + key);
  } catch {
    /* noop */
  }
}

function isExpired(meta: DraftMeta, now: number): boolean {
  return !meta.updatedAt || now - meta.updatedAt > DRAFT_TTL_MS;
}

export function listDraftsForUser(username?: string | null): DraftMeta[] {
  if (!hasStorage()) return [];
  const now = Date.now();
  const result: DraftMeta[] = [];
  const expired: string[] = [];

  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const storageKey = localStorage.key(i);
      if (!storageKey || !storageKey.startsWith(META_PREFIX)) continue;
      const meta = readDraftMeta(storageKey.slice(META_PREFIX.length));
      if (!meta) continue;
      if (isExpired(meta, now)) {
        expired.push(meta.key);
        continue;
      }
      if (username && meta.username && meta.username !== username) continue;
      result.push(meta);
    }
  } catch {
    return result;
  }

  expired.forEach((key) => clearDraftKey(key));
  if (expired.length > 0) emitDraftsChanged();

  return result.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function subscribeDrafts(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (
      event.key === null ||
      event.key.startsWith(DATA_PREFIX) ||
      event.key.startsWith(META_PREFIX)
    ) {
      listener();
    }
  };

  window.addEventListener(DRAFTS_CHANGED_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(DRAFTS_CHANGED_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}
