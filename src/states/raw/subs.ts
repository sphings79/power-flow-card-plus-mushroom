import { HomeAssistant } from "custom-card-helpers";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { getEntityStateWatts } from "@/states/utils/get-entity-state-watts";
import { getEntityState } from "@/states/utils/get-entity-state";
import { getFirstEntityName } from "@/states/utils/mutli-entity";
import { doesEntityExist } from "@/states/utils/existence-entity";

export interface SubEntity {
  entity: string;
  name: string;
  icon?: string;
  color?: string;
  /** Power in watts (signed as reported by the entity). */
  state: number;
  /** State of charge in percent, batteries only. */
  soc?: number | null;
  socUnit?: string;
  socDecimals?: number;
  /** Pre-formatted value string. When set, it is shown verbatim instead of formatting `state`. */
  display?: string;
}

const friendlyName = (hass: HomeAssistant, entity: string, fallback?: string): string => {
  const id = getFirstEntityName(entity);
  return fallback ?? hass.states[id]?.attributes?.friendly_name ?? id ?? entity;
};

const attrIcon = (hass: HomeAssistant, entity: string, fallback?: string): string | undefined => {
  if (fallback) return fallback;
  const id = getFirstEntityName(entity);
  return hass.states[id]?.attributes?.icon;
};

/** Build the list of docked PV sources for the breakdown below the diagram. */
export const getSolarSubs = (hass: HomeAssistant, config: PowerFlowCardPlusConfig): SubEntity[] => {
  const sources = config.entities.solar?.sources;
  if (!sources?.length) return [];

  return sources
    .filter((source) => source?.entity && doesEntityExist(hass, source.entity))
    .map((source) => {
      const raw = getEntityStateWatts(hass, source.entity);
      const state = source.invert_state ? -raw : raw;
      return {
        entity: source.entity,
        name: friendlyName(hass, source.entity, source.name),
        icon: attrIcon(hass, source.entity, source.icon) ?? "mdi:solar-power",
        color: source.color,
        state,
      };
    });
};

/** Build the list of docked charging sources (V2L, generator, …) for the breakdown. */
export const getChargerSubs = (hass: HomeAssistant, config: PowerFlowCardPlusConfig): SubEntity[] => {
  const sources = config.entities.charger?.sources;
  if (!sources?.length) return [];

  return sources
    .filter((source) => source?.entity && doesEntityExist(hass, source.entity))
    .map((source) => {
      const raw = getEntityStateWatts(hass, source.entity);
      const state = source.invert_state ? -raw : raw;
      return {
        entity: source.entity,
        name: friendlyName(hass, source.entity, source.name),
        icon: attrIcon(hass, source.entity, source.icon) ?? "mdi:ev-station",
        color: source.color,
        state,
      };
    });
};

/** Build the list of docked batteries for the breakdown below the diagram. */
export const getBatterySubs = (hass: HomeAssistant, config: PowerFlowCardPlusConfig): SubEntity[] => {
  const batteries = config.entities.battery?.batteries;
  if (!batteries?.length) return [];

  return batteries
    .filter((battery) => battery?.entity && doesEntityExist(hass, battery.entity))
    .map((battery) => {
      const raw = getEntityStateWatts(hass, battery.entity);
      const state = battery.invert_state ? -raw : raw;
      const soc = battery.state_of_charge ? getEntityState(hass, battery.state_of_charge) : null;
      return {
        entity: battery.entity,
        name: friendlyName(hass, battery.entity, battery.name),
        icon: attrIcon(hass, battery.entity, battery.icon) ?? "mdi:battery-high",
        color: battery.color,
        state,
        soc,
        socUnit: battery.state_of_charge_unit ?? "%",
        socDecimals: battery.state_of_charge_decimals ?? 0,
      };
    });
};
