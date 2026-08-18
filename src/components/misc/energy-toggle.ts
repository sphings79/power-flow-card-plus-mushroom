import { html, nothing } from "lit";
import { PowerFlowCardPlus } from "@/power-flow-card-plus";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import localize from "@/localize/localize";

/**
 * Watt / kWh switch in the card header.
 *
 * Only rendered when at least one energy entity is configured — without one there
 * is nothing to switch to, and an inert control would just be confusing.
 */
export const energyToggleElement = (main: PowerFlowCardPlus, config: PowerFlowCardPlusConfig, hasEnergy: boolean) => {
  if (!hasEnergy || config.energy_toggle === false) return nothing;

  const periodLabel = localize(`editor.energy_period_${config.energy_period ?? "today"}`);

  return html`<div class="pfcp-energy-toggle" role="group" aria-label="${localize("editor.energy_toggle")}">
    <button
      type="button"
      class="pfcp-energy-option ${!main.energyMode ? "active" : ""}"
      aria-pressed=${!main.energyMode}
      @click=${() => main.setEnergyMode(false)}
    >
      W
    </button>
    <button
      type="button"
      class="pfcp-energy-option ${main.energyMode ? "active" : ""}"
      aria-pressed=${main.energyMode}
      @click=${() => main.setEnergyMode(true)}
    >
      kWh
    </button>
    ${main.energyMode && periodLabel ? html`<span class="pfcp-energy-period">${periodLabel}</span>` : nothing}
  </div>`;
};
