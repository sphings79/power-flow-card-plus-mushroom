import { describe, expect, it } from "@jest/globals";

import { periodRange } from "../src/energy/energy-totals";

// Wednesday, 18 June 2025, 14:30 local time.
const NOW = new Date(2025, 5, 18, 14, 30, 0);
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

describe("periodRange", () => {
  it("today runs from midnight to now", () => {
    const { start, end } = periodRange("today", NOW);
    expect(iso(start)).toBe("2025-06-18");
    expect(start.getHours()).toBe(0);
    expect(end).toEqual(NOW);
  });

  it("yesterday is the full previous day", () => {
    const { start, end } = periodRange("yesterday", NOW);
    expect(iso(start)).toBe("2025-06-17");
    expect(iso(end)).toBe("2025-06-18");
    expect(end.getHours()).toBe(0);
  });

  it("week starts on Monday", () => {
    const { start } = periodRange("week", NOW);
    expect(iso(start)).toBe("2025-06-16");
    expect(start.getDay()).toBe(1);
  });

  it("month starts on the first", () => {
    expect(iso(periodRange("month", NOW).start)).toBe("2025-06-01");
  });

  it("year starts on 1 January of the current year", () => {
    expect(iso(periodRange("year", NOW).start)).toBe("2025-01-01");
  });

  it("rolling windows include today and count whole days back", () => {
    expect(iso(periodRange("last_7_days", NOW).start)).toBe("2025-06-12");
    expect(iso(periodRange("last_30_days", NOW).start)).toBe("2025-05-20");
    expect(iso(periodRange("last_365_days", NOW).start)).toBe("2024-06-19");
  });

  it("rolling windows start at midnight, not at the current time", () => {
    const { start } = periodRange("last_7_days", NOW);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
  });

  it("week handles Sunday as the last day of the week, not the first", () => {
    const sunday = new Date(2025, 5, 22, 9, 0, 0);
    expect(iso(periodRange("week", sunday).start)).toBe("2025-06-16");
  });
});

import { displayEnergy } from "../src/utils/display-value";

const hass: any = { locale: { language: "en", number_format: "comma_decimal" } };
const cfg = (extra: any = {}) => ({ entities: {}, ...extra } as any);

describe("displayEnergy", () => {
  it("stays in kWh below the threshold", () => {
    expect(displayEnergy(hass, cfg(), 999)).toContain("kWh");
  });

  it("switches to MWh at the threshold", () => {
    const out = displayEnergy(hass, cfg(), 1000);
    expect(out).toContain("MWh");
    expect(out).toContain("1");
  });

  it("honours a lowered threshold", () => {
    expect(displayEnergy(hass, cfg({ kwh_threshold: 100 }), 300)).toContain("MWh");
    expect(displayEnergy(hass, cfg({ kwh_threshold: 100 }), 99)).toContain("kWh");
  });

  it("never switches when the threshold is zero", () => {
    expect(displayEnergy(hass, cfg({ kwh_threshold: 0 }), 50000)).toContain("kWh");
  });

  it("applies the switch to negative values too", () => {
    expect(displayEnergy(hass, cfg(), -1500)).toContain("MWh");
  });
});
