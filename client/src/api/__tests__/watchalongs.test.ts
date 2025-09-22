import type { WatchalongResponse } from "../watchalongs";

describe("fetchWatchalongContent", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    globalThis.fetch = originalFetch as any;
  });

  it("requests watchalong data with default parameters", async () => {
    const mockData: WatchalongResponse = {
      items: [],
      query: "arsenal",
      mode: "watchalong",
    };

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockData),
    } as unknown as Response);

    globalThis.fetch = fetchMock as any;

    const { fetchWatchalongContent } = await import("../watchalongs");
    const result = await fetchWatchalongContent("arsenal");

    expect(result).toEqual(mockData);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const call = fetchMock.mock.calls[0] ?? [];
    const requestedUrl = new URL((call[0] as string) ?? "");

    expect(requestedUrl.pathname).toBe("/watchalongs");
    expect(requestedUrl.searchParams.get("q")).toBe("arsenal");
    expect(requestedUrl.searchParams.get("mode")).toBe("watchalong");
    expect(requestedUrl.searchParams.get("limit")).toBe("8");
  });

  it("honors explicit mode and limit overrides", async () => {
    jest.doMock("@/config", () => ({
      baseURL: "https://api.example.com",
      API_BASE: "https://fallback.example.com",
    }));

    const mockData: WatchalongResponse = {
      items: [],
      query: "city",
      mode: "clips",
    };

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockData),
    } as unknown as Response);

    globalThis.fetch = fetchMock as any;

    const { fetchWatchalongContent } = await import("../watchalongs");
    await fetchWatchalongContent("city", { mode: "clips", limit: 3 });

    const call = fetchMock.mock.calls[0] ?? [];
    const requestedUrl = new URL((call[0] as string) ?? "");

    expect(requestedUrl.origin).toBe("https://api.example.com");
    expect(requestedUrl.searchParams.get("mode")).toBe("clips");
    expect(requestedUrl.searchParams.get("limit")).toBe("3");
  });

  it("throws with the server-provided message when the request fails", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      text: jest.fn().mockResolvedValue("Server down"),
    } as unknown as Response);

    globalThis.fetch = fetchMock as any;

    const { fetchWatchalongContent } = await import("../watchalongs");

    await expect(fetchWatchalongContent("arsenal")).rejects.toThrow("Server down");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to a default error message when the response is empty", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      text: jest.fn().mockResolvedValue(""),
    } as unknown as Response);

    globalThis.fetch = fetchMock as any;

    const { fetchWatchalongContent } = await import("../watchalongs");

    await expect(fetchWatchalongContent("arsenal")).rejects.toThrow(
      "Failed to load watchalong content."
    );
  });

  it("throws early when no API base URL is configured", async () => {
    jest.doMock("@/config", () => ({
      baseURL: "",
      API_BASE: "",
    }));

    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock as any;

    const { fetchWatchalongContent } = await import("../watchalongs");

    await expect(fetchWatchalongContent("arsenal")).rejects.toThrow(
      "API base URL is not configured."
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
