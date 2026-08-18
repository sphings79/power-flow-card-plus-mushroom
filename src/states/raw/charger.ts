import { HomeAssistant } from "custom-card-helpers";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { isEntityInverted } from "@/states/utils/is-entity-inverted";
import { getEntityStateWatts } from "@/states/utils/get-entity-state-watts";
import { onlyPositive } from "@/states/utils/negative-positive";
import { getSecondaryState } from "./base";

/**
 * Power delivered by external charging sources (V2L, generator, …) into the battery.
 *
 * The flow is one-way by design, so anything negative is clamped to zero: a source
 * that reports negative values is either idle or being charged itself, neither of
 * which this node represents. Sources that report discharge as negative can be
 * flipped with `invert_state`.
 */
export const getChargerState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig): number | null => {
  const entity = config.entities.charger?.entity;

  if (entity === undefined) return null;

  const watts = getEntityStateWatts(hass, entity);

  return onlyPositive(isEntityInverted(config, "charger") ? -watts : watts);
};

export const getChargerSecondaryState = (hass: HomeAssistant, config: PowerFlowCardPlusConfig) => getSecondaryState(hass, config, "charger");
