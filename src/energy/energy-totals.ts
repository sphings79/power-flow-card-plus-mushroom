import { HomeAssistant } from "custom-card-helpers";

export type EnergyPeriod = "today" | "yesterday" | "week" | "month" | "year" | "last_7_days" | "last_30_days" | "last_365_days";

export const ENERGY_PERIODS: EnergyPeriod[] = [
  "today",
  "yesterday",
  "week",
  "month",
  "year",
  "last_7_days",
  "last_30_days",
  "last_365_days",
];

const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Start and end of the requested period in local time.
 *
 * The week starts on Monday, matching Home Assistant's own energy dashboard and
 * the locale of everywhere this card is likely to be used.
 */
export const periodRange = (period: EnergyPeriod, now: Date): { start: Date; end: Date } => {
  const today = startOfDay(now);

  switch (period) {
    case "yesterday": {
      const start = new Date(today);
      start.setDate(start.getDate() - 1);
      return { start, end: today };
    }
    case "week": {
      const start = new Date(today);
      // getDay(): 0 = Sunday. Shift so Monday becomes the first day.
      const weekday = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - weekday);
      return { start, end: now };
    }
    case "month":
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    case "year":
      return { start: new Date(now.getFullYear(), 0, 1), end: now };
    // Rolling windows: whole days back from today's midnight, ending now. The
    // current day is included, so "last 7 days" covers today plus the six before.
    case "last_7_days":
    case "last_30_days":
    case "last_365_days": {
      const days = period === "last_7_days" ? 7 : period === "last_30_days" ? 30 : 365;
      const start = new Date(today);
      start.setDate(start.getDate() - (days - 1));
      return { start, end: now };
    }
    case "today":
    default:
      return { start: today, end: now };
  }
};

interface StatisticPoint {
  start?: number | string;
  change?: number | null;
  sum?: number | null;
  state?: number | null;
}

/**
 * Total energy per statistic over the period.
 *
 * Prefers the `change` value Home Assistant reports per bucket. Older cores do not
 * return it, so we fall back to the difference between the first and last
 * cumulative `sum` — which is the same quantity, just computed by hand.
 */
export const fetchEnergyTotals = async (
  hass: HomeAssistant,
  statisticIds: string[],
  period: EnergyPeriod,
  now: Date = new Date()
): Promise<Record<string, number>> => {
  const ids = Array.from(new Set(statisticIds.filter((id) => typeof id === "string" && id.length > 0)));
  if (!ids.length) return {};

  const { start, end } = periodRange(period, now);

  const response = (await (hass as any).callWS({
    type: "recorder/statistics_during_period",
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    statistic_ids: ids,
    period: "hour",
    types: ["change", "sum"],
  })) as Record<string, StatisticPoint[]> | undefined;

  const totals: Record<string, number> = {};
  if (!response) return totals;

  for (const id of ids) {
    const points = response[id];
    if (!Array.isArray(points) || points.length === 0) continue;

    const changes = points.map((p) => p.change).filter((c): c is number => typeof c === "number");
    if (changes.length) {
      totals[id] = changes.reduce((sum, c) => sum + c, 0);
      continue;
    }

    const sums = points.map((p) => p.sum).filter((s): s is number => typeof s === "number");
    if (sums.length >= 2) totals[id] = sums[sums.length - 1] - sums[0];
  }

  return totals;
};
