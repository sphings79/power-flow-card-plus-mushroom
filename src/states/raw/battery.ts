import { HomeAssistant } from "custom-card-helpers";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { getFieldInState, getFieldOutState } from "./base";
import { getEntityState } from "@/states/utils/get-entity-state";

export const getBatteryStateOfCharge = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => {
  const entity = config.entities.battery?.state_of_charge;

  if (entity !== undefined) return getEntityState(hass, entity);

  // Multiple batteries: when no aggregate state_of_charge is configured, use the
  // average of the individual batteries' states of charge (summing would be wrong for %).
  const batteries = config.entities.battery?.batteries;
  if (batteries?.length) {
    const socs = batteries
      .map((b) => b?.state_of_charge)
      .filter((e): e is string => typeof e === "string" && e.length > 0)
      .map((e) => getEntityState(hass, e))
      .filter((v): v is number => v !== null);
    if (socs.length) return socs.reduce((a, b) => a + b, 0) / socs.length;
  }

  return null;
};

export const getBatteryInState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => getFieldInState(hass, config, "battery");

export const getBatteryOutState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => getFieldOutState(hass, config, "battery");
