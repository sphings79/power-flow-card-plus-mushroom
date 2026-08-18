import { HomeAssistant, formatNumber } from "custom-card-helpers";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { isNumberValue, round } from "./utils";

/**
 *
 * @param hass The Home Assistant instance
 * @param config The Power Flow Card Plus configuration
 * @param value The value to display
 * @param options Different options to display the value
 * @returns value with unit, localized and rounded to the correct number of decimals
 */
export const displayValue = (
  hass: HomeAssistant,
  config: PowerFlowCardPlusConfig,
  value: number | string | null,
  {
    unit,
    unitWhiteSpace,
    decimals,
    accept_negative,
    watt_threshold = 1000,
  }: {
    unit?: string;
    unitWhiteSpace?: boolean;
    decimals?: number;
    accept_negative?: boolean;
    watt_threshold?: number;
  }
): string => {
  const whiteSpace = unitWhiteSpace === false ? "" : " ";

  if (value === null || value === undefined || value === "") {
    return `0${whiteSpace}${unit ?? "W"}`;
  }

  if (!isNumberValue(value)) return value.toString();

  const valueInNumber = Number(value);

  const isKW = unit === undefined && valueInNumber >= watt_threshold;

  const decimalsToRound = decimals ?? (isKW ? config.kw_decimals : config.w_decimals);

  const transformValue = (v: number) => (!accept_negative ? Math.abs(v) : v);

  const v = formatNumber(
    transformValue(isKW ? round(valueInNumber / 1000, decimalsToRound ?? 2) : round(valueInNumber, decimalsToRound ?? 0)),
    hass.locale
  );

  return `${v}${whiteSpace}${unit || (isKW ? "kW" : "W")}`;
};

/**
 * Formats a period energy total, switching to megawatt hours once the value gets
 * long enough to crowd the layout.
 *
 * Passing an explicit unit keeps `displayValue` from applying its watt-to-kilowatt
 * conversion, which would be wrong here — the value already is in kilowatt hours.
 */
export const displayEnergy = (hass: HomeAssistant, config: PowerFlowCardPlusConfig, kwh: number | null, decimals = 1): string => {
  const threshold = config.kwh_threshold ?? 1000;

  if (kwh !== null && Number.isFinite(kwh) && threshold > 0 && Math.abs(kwh) >= threshold) {
    return displayValue(hass, config, kwh / 1000, {
      unit: "MWh",
      decimals: config.mwh_decimals ?? 2,
      accept_negative: true,
    });
  }

  return displayValue(hass, config, kwh, { unit: "kWh", decimals, accept_negative: true });
};
