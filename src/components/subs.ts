import { html, nothing } from "lit";
import { PowerFlowCardPlus } from "@/power-flow-card-plus";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { displayEnergy, displayValue } from "@/utils/display-value";
import { SubEntity } from "@/states/raw/subs";

export interface SubsGroup {
  title?: string;
  /** Used for the accent color / styling hook. */
  kind: "solar" | "battery" | "individual" | "charger";
  items: SubEntity[];
  /** Show the state of charge next to the value (batteries). */
  showSoc?: boolean;
}

/**
 * Renders a compact, docked breakdown list below the flow diagram. Used for the
 * individual PV sources, the individual batteries, and the overflow individual
 * devices (beyond the four corner slots). Purely a list — it does not participate
 * in the hard-coded SVG flow geometry, so it never shifts the aggregate nodes.
 */
export const subsElement = (main: PowerFlowCardPlus, config: PowerFlowCardPlusConfig, group: SubsGroup) => {
  if (!group.items.length) return nothing;
  const disableEntityClick = config.clickable_entities === false;

  return html`<div class="pfcp-subs pfcp-subs-${group.kind}">
    ${group.title ? html`<div class="pfcp-subs-title">${group.title}</div>` : nothing}
    <div class="pfcp-subs-items">
      ${group.items.map(
        (item: SubEntity) => html`<div
          class="pfcp-sub ${disableEntityClick ? "pointer-events-none" : ""}"
          style=${item.color ? `--pfcp-sub-color: ${item.color};` : ""}
          role="button"
          tabindex="0"
          @click=${(e: MouseEvent) => main.onEntityClick(e, item as any, item.entity)}
          @dblclick=${(e: MouseEvent) => main.onEntityDoubleClick(e, item as any, item.entity)}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Enter") main.openDetails(e as any, item as any, item.entity, "tap");
          }}
        >
          ${item.icon ? html`<ha-icon class="pfcp-sub-icon" .icon=${item.icon}></ha-icon>` : nothing}
          <span class="pfcp-sub-name">${item.name}</span>
          <span class="pfcp-sub-values">
            ${item.energyCharged !== null && item.energyCharged !== undefined
              ? html`<span class="pfcp-sub-energy" title="geladen">
                  <ha-icon class="pfcp-sub-energy-icon" icon="mdi:arrow-down"></ha-icon>${displayEnergy(main.hass, config, item.energyCharged)}
                </span>`
              : nothing}
            ${item.energyDischarged !== null && item.energyDischarged !== undefined
              ? html`<span class="pfcp-sub-energy" title="entladen">
                  <ha-icon class="pfcp-sub-energy-icon" icon="mdi:arrow-up"></ha-icon>${displayEnergy(main.hass, config, item.energyDischarged)}
                </span>`
              : nothing}
            ${item.energy !== null && item.energy !== undefined
              ? html`<span class="pfcp-sub-energy">${displayEnergy(main.hass, config, item.energy)}</span>`
              : nothing}
            ${group.showSoc && item.soc !== null && item.soc !== undefined
              ? html`<span class="pfcp-sub-soc"
                  >${displayValue(main.hass, config, item.soc, {
                    unit: item.socUnit ?? "%",
                    decimals: item.socDecimals ?? 0,
                    accept_negative: true,
                    watt_threshold: config.watt_threshold,
                  })}</span
                >`
              : nothing}
            <span class="pfcp-sub-power"
              >${item.display ??
              displayValue(main.hass, config, item.state, {
                accept_negative: true,
                watt_threshold: config.watt_threshold,
              })}</span
            >
          </span>
        </div>`
      )}
    </div>
  </div>`;
};
