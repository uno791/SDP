import {
  clearCachedHighlights,
  getCachedHighlights,
  notifyFavouritesUpdated,
  setCachedHighlights,
  subscribeToFavouritesUpdates,
} from "../favouritesCache";

const STORAGE_KEY = "footbook:favourite-highlights";

describe("favouritesCache utilities", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(Date, "now").mockReturnValue(1_699_999_000_000);
  });

  afterEach(() => {
    [7, 11, 25, 99].forEach((id) => clearCachedHighlights(id));
    jest.restoreAllMocks();
  });

  it("persists highlights to the in-memory cache and localStorage", () => {
    setCachedHighlights(7, {
      highlights: [{ key: "k", teamName: "Wolves", label: "Streak", text: "Won 3 straight" }],
      teamNames: ["Wolves"],
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(stored["7"].highlights).toEqual([
      { key: "k", teamName: "Wolves", label: "Streak", text: "Won 3 straight" },
    ]);
    expect(stored["7"].updatedAt).toBe(1_699_999_000_000);
    expect(stored["7"].teamNames).toEqual(["Wolves"]);

    const cached = getCachedHighlights(7);
    expect(cached).toEqual({
      highlights: [{ key: "k", teamName: "Wolves", label: "Streak", text: "Won 3 straight" }],
      teamNames: ["Wolves"],
      updatedAt: 1_699_999_000_000,
    });
  });

  it("clears cached highlights from both memory and storage", () => {
    setCachedHighlights(11, {
      highlights: [],
      teamNames: ["Home"],
    });

    expect(getCachedHighlights(11)).toBeDefined();

    clearCachedHighlights(11);
    expect(getCachedHighlights(11)).toBeUndefined();
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify({}));
  });

  it("dispatches update events and clears cache when notifying updates", () => {
    const listener = jest.fn();
    setCachedHighlights(25, {
      highlights: [],
      teamNames: [],
    });

    const unsubscribe = subscribeToFavouritesUpdates(listener);

    notifyFavouritesUpdated(25, "profile-update");

    expect(getCachedHighlights(25)).toBeUndefined();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        at: 1_699_999_000_000,
        reason: "profile-update",
        userId: 25,
      })
    );

    unsubscribe();

    notifyFavouritesUpdated(25, "second");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("provides a fallback detail when an event without custom detail is dispatched", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToFavouritesUpdates(listener);

    const event = new CustomEvent("footbook:favourites-updated");
    window.dispatchEvent(event);

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        at: 1_699_999_000_000,
      })
    );

    unsubscribe();
  });

  it("ignores malformed storage payloads when hydrating", () => {
    localStorage.setItem(STORAGE_KEY, "{");
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(getCachedHighlights(99)).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
