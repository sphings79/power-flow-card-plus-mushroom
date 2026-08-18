/**
 * Colour ramp for individual devices, driven by how much they currently draw.
 *
 * Low usage stays green, mid usage turns orange, high usage goes red — the
 * familiar heat-map reading, so a glance at the list shows which device is the
 * expensive one right now.
 */
const RAMP: [number, [number, number, number]][] = [
  [0, [76, 175, 80]], // green
  [0.5, [255, 152, 0]], // orange
  [1, [244, 67, 54]], // red
];

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * @param value  Current power in watts.
 * @param max    Power at which the ramp reaches full red. Values above are clamped.
 */
export const usageColor = (value: number, max: number): string => {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return "";

  const t = clamp01(Math.abs(value) / max);

  let lower = RAMP[0];
  let upper = RAMP[RAMP.length - 1];
  for (let i = 0; i < RAMP.length - 1; i++) {
    if (t >= RAMP[i][0] && t <= RAMP[i + 1][0]) {
      lower = RAMP[i];
      upper = RAMP[i + 1];
      break;
    }
  }

  const span = upper[0] - lower[0];
  const local = span === 0 ? 0 : (t - lower[0]) / span;
  const mix = (a: number, b: number) => Math.round(a + (b - a) * local);

  return `rgb(${mix(lower[1][0], upper[1][0])}, ${mix(lower[1][1], upper[1][1])}, ${mix(lower[1][2], upper[1][2])})`;
};

/**
 * Colour for a battery's state of charge — the same ramp read the other way
 * round: full is green, half is orange, empty is red.
 *
 * @param soc State of charge in percent (0-100).
 */
export const socColor = (soc: number): string => {
  if (!Number.isFinite(soc)) return "";
  const clamped = soc < 0 ? 0 : soc > 100 ? 100 : soc;
  return usageColor(100 - clamped, 100);
};

/**
 * Colour for a producing source — the ramp read the other way round: nothing
 * generated is red, full output is green.
 *
 * @param value Current output in watts.
 * @param max   Output counting as full production, typically the array's peak power.
 */
export const IDLE_COLOR = "var(--disabled-text-color, #6f6f6f)";

export const productionColor = (value: number, max: number): string => {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return "";

  // Producing nothing is not an alarm — at night every array sits at zero. Red is
  // reserved for "could produce but barely does", so idle goes grey instead.
  if (value <= 0) return IDLE_COLOR;

  const clamped = Math.min(value, max);
  return usageColor(max - clamped, max);
};
