import { BaseConfigEntity, ComboEntity, GridPowerOutage, IndividualDeviceType, SecondaryInfoType, type LovelaceCardConfig } from "./type.js";

export type DisplayZeroLinesMode = "show" | "grey_out" | "transparency" | "hide" | "custom";

interface mainConfigOptions {
  dashboard_link?: string;
  dashboard_link_label?: string;
  second_dashboard_link?: string;
  second_dashboard_link_label?: string;
  kw_decimals: number;
  min_flow_rate: number;
  max_flow_rate: number;
  w_decimals: number;
  watt_threshold: number;
  clickable_entities: boolean;
  max_expected_power: number;
  min_expected_power: number;
  use_new_flow_rate_model?: boolean;
  full_size?: boolean;
  style_ha_card?: any;
  style_card_content?: any;
  disable_dots?: boolean;
  no_labels?: boolean;
  display_zero_lines?: {
    mode?: DisplayZeroLinesMode;
    transparency?: number;
    grey_color?: string | number[];
  };
  /**
   * Visual style of the card.
   * - `classic` (default): outlined circles, the original look.
   * - `mushroom`: filled shapes, Mushroom typography, softer flow lines
   *   and a chip-styled breakdown list, to blend in with Mushroom cards.
   */
  appearance?: "classic" | "mushroom";
  sort_individual_devices?: boolean;
  allow_layout_break?: boolean;
  /**
   * Maximum number of individual devices rendered in the four corner slots of the flow diagram.
   * Any additional individual devices are rendered in the "extra devices" list below the diagram.
   * Defaults to 4.
   */
  max_individual_in_grid?: number;
}

export interface PowerFlowCardPlusConfig extends LovelaceCardConfig, mainConfigOptions {
  entities: ConfigEntities;
}

export type IndividualField = IndividualDeviceType[];

/**
 * A single physical battery that is aggregated into the main battery node and
 * additionally rendered as a docked item below the flow diagram.
 */
export interface BatteryUnit {
  entity: string;
  name?: string;
  icon?: string;
  color?: string;
  state_of_charge?: string;
  state_of_charge_unit?: string;
  state_of_charge_unit_white_space?: boolean;
  state_of_charge_decimals?: number;
  invert_state?: boolean;
}

interface Battery extends BaseConfigEntity {
  state_of_charge?: string;
  state_of_charge_unit?: string;
  state_of_charge_unit_white_space?: boolean;
  state_of_charge_decimals?: number;
  show_state_of_charge?: boolean;
  color_state_of_charge_value?: "no_color" | "color_dynamically" | "production" | "consumption";
  color_circle: "color_dynamically" | "production" | "consumption";
  color_value?: boolean;
  color?: ComboEntity;
  /**
   * List of individual batteries. Their power is summed into the main battery node
   * (when `entity` is omitted). Each battery is also shown as a docked item below the
   * diagram. When `state_of_charge` is omitted on the main battery, the aggregate
   * state of charge is the average of the batteries' individual states of charge.
   */
  batteries?: BatteryUnit[];
}

interface Grid extends BaseConfigEntity {
  power_outage: GridPowerOutage;
  secondary_info?: SecondaryInfoType;
  color_circle: "color_dynamically" | "production" | "consumption";
  color_value?: boolean;
  color?: ComboEntity;
}

/**
 * A single PV source that is aggregated into the main solar node and additionally
 * rendered as a docked item below the flow diagram.
 */
export interface SolarSource {
  entity: string;
  name?: string;
  icon?: string;
  color?: string;
  invert_state?: boolean;
}

interface Solar extends Omit<BaseConfigEntity, "entity"> {
  entity?: string;
  color?: any;
  color_icon?: boolean;
  color_value?: boolean;
  color_label?: boolean;
  secondary_info?: SecondaryInfoType & {
    sum_total?: boolean;
  };
  display_zero?: boolean;
  display_zero_state?: boolean;
  /**
   * List of individual PV sources. Their power is summed into the main solar node
   * (when `entity` is omitted). Each source is also shown as a docked item below the diagram.
   */
  sources?: SolarSource[];
}

/**
 * A single external charging source (V2L, generator, shore power, …) that is
 * aggregated into the charger node and additionally rendered as a docked item
 * below the flow diagram.
 */
export interface ChargerSource {
  entity: string;
  name?: string;
  icon?: string;
  color?: string;
  invert_state?: boolean;
}

/**
 * An external source that charges the battery directly, bypassing grid and solar
 * (for example V2L from a car, or a generator).
 *
 * It is rendered as its own node underneath the grid, with a single one-way flow
 * line into the battery. Its power deliberately does not take part in the
 * grid/solar/home distribution maths — the battery entity already reports the
 * resulting charge, so counting it again would double up the numbers.
 */
interface Charger extends Omit<BaseConfigEntity, "entity"> {
  entity?: string;
  color?: string;
  color_icon?: boolean;
  color_value?: boolean;
  color_label?: boolean;
  display_zero?: boolean;
  display_zero_state?: boolean;
  display_zero_tolerance?: number;
  secondary_info?: SecondaryInfoType;
  /**
   * List of individual charging sources. Their power is summed into the charger
   * node (when `entity` is omitted). Each source is also shown as a docked item
   * below the diagram.
   */
  sources?: ChargerSource[];
}

interface Home extends BaseConfigEntity {
  entity: string;
  override_state?: boolean;
  color_icon?: boolean | "solar" | "grid" | "battery";
  color_value?: boolean | "solar" | "grid" | "battery";
  subtract_individual?: boolean;
  secondary_info?: SecondaryInfoType;
  circle_animation?: boolean;
  hide?: boolean;
}

interface FossilFuelPercentage extends BaseConfigEntity {
  entity: string;
  color?: string;
  state_type?: "percentage" | "power";
  color_icon?: boolean;
  display_zero?: boolean;
  display_zero_state?: boolean;
  display_zero_tolerance?: number;
  color_value?: boolean;
  color_label?: boolean;
  unit_white_space?: boolean;
  calculate_flow_rate?: boolean | number;
  secondary_info: SecondaryInfoType;
}

export type ConfigEntities = {
  battery?: Battery;
  grid?: Grid;
  solar?: Solar;
  home?: Home;
  fossil_fuel_percentage?: FossilFuelPercentage;
  individual?: IndividualField;
  charger?: Charger;
};

export type ConfigEntity = Battery | Grid | Solar | Home | FossilFuelPercentage | IndividualDeviceType | Charger;
