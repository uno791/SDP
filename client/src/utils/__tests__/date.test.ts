import { addDays, formatDayLabel } from "../date";

describe("date utils", () => {
  test("addDays does not mutate input date", () => {
    const base = new Date("2024-05-01T00:00:00Z");
    const result = addDays(base, 2);

    expect(result).not.toBe(base);
    expect(result.getUTCDate()).toBe(3);
    expect(base.getUTCDate()).toBe(1);
  });

  test("formatDayLabel renders friendly label", () => {
    const label = formatDayLabel(new Date("2024-12-24T00:00:00Z"));

    expect(label).toMatch(/24/);
    expect(label).toMatch(/December/i);
  });
});
