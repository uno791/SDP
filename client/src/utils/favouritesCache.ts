export type FavouriteHighlight = {
  key: string;
  teamName: string;
  label: string;
  text: string;
};

type CacheEntry = {
  highlights: FavouriteHighlight[];
  teamNames: string[];
  updatedAt: number;
};

type StoredCache = Record<string, CacheEntry>;

type UpdateDetail = {
  userId?: number | null;
  reason?: string;
  at: number;
};

const HIGHLIGHT_CACHE = new Map<number, CacheEntry>();
const UPDATE_EVENT = "footbook:favourites-updated";
const STORAGE_KEY = "footbook:favourite-highlights";

function readStorage(): StoredCache {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    return parsed as StoredCache;
  } catch (error) {
    console.warn("[favouritesCache] Failed to read storage", error);
    return {};
  }
}

function writeStorage(map: StoredCache) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (error) {
    console.warn("[favouritesCache] Failed to persist storage", error);
  }
}

function hydrateCache(userId: number) {
  if (HIGHLIGHT_CACHE.has(userId)) return;
  const stored = readStorage();
  const entry = stored?.[String(userId)];
  if (!entry) return;
  HIGHLIGHT_CACHE.set(userId, entry);
}

export function getCachedHighlights(userId: number): CacheEntry | undefined {
  hydrateCache(userId);
  return HIGHLIGHT_CACHE.get(userId);
}

export function setCachedHighlights(
  userId: number,
  entry: Omit<CacheEntry, "updatedAt">
): void {
  const value = { ...entry, updatedAt: Date.now() };
  HIGHLIGHT_CACHE.set(userId, value);
  if (typeof window !== "undefined") {
    const map = readStorage();
    map[String(userId)] = value;
    writeStorage(map);
  }
}

export function clearCachedHighlights(userId: number): void {
  HIGHLIGHT_CACHE.delete(userId);
  if (typeof window !== "undefined") {
    const map = readStorage();
    if (map[String(userId)]) {
      delete map[String(userId)];
      writeStorage(map);
    }
  }
}

export function notifyFavouritesUpdated(
  userId?: number | null,
  reason?: string
): void {
  if (typeof userId === "number") {
    clearCachedHighlights(userId);
  }

  if (typeof window === "undefined") return;

  const detail: UpdateDetail = {
    userId: typeof userId === "number" ? userId : undefined,
    reason,
    at: Date.now(),
  };

  window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail }));
}

export function subscribeToFavouritesUpdates(
  listener: (detail: UpdateDetail) => void
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = (event: Event) => {
    const custom = event as CustomEvent<UpdateDetail>;
    listener(custom.detail ?? { at: Date.now() });
  };

  window.addEventListener(UPDATE_EVENT, handler as EventListener);

  return () => {
    window.removeEventListener(UPDATE_EVENT, handler as EventListener);
  };
}
