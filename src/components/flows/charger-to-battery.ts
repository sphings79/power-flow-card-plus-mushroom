import { classMap } from "lit/directives/class-map.js";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { showLine } from "@/utils/show-line";
import { html, svg, nothing } from "lit";
import { styleLine } from "@/utils/style-line";
import { type Flows } from "./index";
import { checkHasRightIndividual } from "@/utils/compute-individual-position";
import { checkShouldShowDots } from "@/utils/check-should-show-dots";

const chargerToBatteryDot = (config: PowerFlowCardPlusConfig, charger: Flows["charger"], newDur: Flows["newDur"]) => {
  if (!checkShouldShowDots(config) || !charger?.state?.toBattery) return nothing;

  return svg`<circle r="1" class="charger-to-battery" vector-effect="non-scaling-stroke">
      <animateMotion dur="${newDur.chargerToBattery}s" repeatCount="indefinite" calcMode="paced">
        <mpath xlink:href="#charger-battery" />
      </animateMotion>
    </circle>`;
};

type FlowChargerToBatteryFlows = Pick<Flows, "battery" | "charger" | "individual" | "newDur">;

/**
 * One-way line from the external charging source into the battery.
 *
 * Both nodes live in the bottom row, so the path runs flat along the battery's
 * connection height (y=100 in the shared 100x100 viewBox — the same anchor the
 * battery-grid path starts from) and to the left, where the charger sits below
 * the grid.
 */
export const flowChargerToBattery = (config: PowerFlowCardPlusConfig, { battery, charger, individual, newDur }: FlowChargerToBatteryFlows) => {
  const shouldShow = !!charger?.has && !!battery?.has && showLine(config, charger.state.toBattery || 0);
  if (!shouldShow) return nothing;

  return html`<div
    class="lines high ${classMap({
      "multi-individual": checkHasRightIndividual(individual),
    })}"
  >
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" id="charger-battery-flow" class="flat-line">
      <path
        id="charger-battery"
        class="charger ${styleLine(charger.state.toBattery || 0, config)}"
        d="M0,100 H45"
        vector-effect="non-scaling-stroke"
      ></path>
      ${chargerToBatteryDot(config, charger, newDur)}
    </svg>
  </div>`;
};
