import { API_BASE, baseURL } from "../config";

export type WatchalongMode = "watchalong" | "clips";

export type WatchalongItem = {
  id: string;
  title: string;
  channelTitle: string;
  url: string;
  thumbnail: string;
  description?: string;
  publishedAt?: string;
  isLive?: boolean;
  liveViewers?: number | null;
  scheduledStartTime?: string;
  actualStartTime?: string;
  viewCount?: number | null;
  duration?: string;
};

export type WatchalongResponse = {
  items: WatchalongItem[];
  query: string;
  mode: WatchalongMode;
  isFallback?: boolean;
  message?: string;
};

const API_ROOT = baseURL || API_BASE || "";

function takeMessage(resp: Response, fallback: string) {
  return resp.text().then((text) => text || fallback);
}

export async function fetchWatchalongContent(
  query: string,
  options: { mode?: WatchalongMode; limit?: number } = {}
): Promise<WatchalongResponse> {
  const mode = options.mode ?? "watchalong";
  const limit = options.limit ?? 8;

  if (!API_ROOT) {
    throw new Error("API base URL is not configured.");
  }

  const url = new URL("/watchalongs", API_ROOT);
  url.searchParams.set("q", query);
  url.searchParams.set("mode", mode);
  url.searchParams.set("limit", String(limit));

  const resp = await fetch(url.toString());
  if (!resp.ok) {
    const message = await takeMessage(resp, "Failed to load watchalong content.");
    throw new Error(message);
  }

  const data = (await resp.json()) as WatchalongResponse;
  return data;
}

