import { HomeAssistant, fireEvent } from "custom-card-helpers";
import { CSSResultGroup, LitElement, TemplateResult, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import localize from "@/localize/localize";

/** The kinds of aggregated unit lists the card supports. */
export type UnitListKind = "battery" | "solar" | "charger";

/**
 * Shape shared by `battery.batteries`, `solar.sources` and `charger.sources`.
 * Only `entity` is required; everything else is optional per unit.
 */
export interface UnitLike {
  entity?: string;
  name?: string;
  icon?: string;
  color?: string;
  invert_state?: boolean;
  state_of_charge?: string;
  state_of_charge_unit?: string;
  state_of_charge_decimals?: number;
  energy_entity?: string;
  energy_charged_entity?: string;
  energy_discharged_entity?: string;
  energy_from_state?: boolean;
}

const DEFAULT_ICON: Record<UnitListKind, string> = {
  battery: "mdi:battery-high",
  solar: "mdi:solar-power",
  charger: "mdi:ev-station",
};

/**
 * Form schema for a single unit. Batteries get the extra state-of-charge fields;
 * the rest is identical across kinds.
 */
const unitSchema = (kind: UnitListKind) => {
  const base: any[] = [
    {
      name: "entity",
      label: localize("editor.entity"),
      selector: { entity: { domain: ["sensor", "input_number", "number"] } },
    },
    {
      name: "",
      type: "grid",
      column_min_width: "200px",
      schema: [
        { name: "name", label: localize("editor.name"), selector: { text: {} } },
        { name: "icon", label: localize("editor.icon"), selector: { icon: {} } },
        { name: "color", label: localize("editor.color"), selector: { text: {} } },
        { name: "invert_state", label: localize("editor.invert_state"), selector: { boolean: {} } },
      ],
    },
  ];

  const energy =
    kind === "battery"
      ? [
          {
            name: "energy_charged_entity",
            label: localize("editor.energy_charged_entity"),
            selector: { entity: {} },
          },
          {
            name: "energy_discharged_entity",
            label: localize("editor.energy_discharged_entity"),
            selector: { entity: {} },
          },
        ]
      : [
          {
            name: "energy_entity",
            label: localize("editor.energy_entity"),
            selector: { entity: {} },
          },
        ];

  const energyBlock = {
    title: localize("editor.energy"),
    name: "",
    type: "expandable",
    schema: [
      ...energy,
      {
        name: "energy_from_state",
        label: localize("editor.energy_from_state"),
        selector: { boolean: {} },
      },
    ],
  };

  if (kind !== "battery") return [...base, energyBlock];

  return [
    ...base,
    {
      name: "state_of_charge",
      label: localize("editor.state_of_charge"),
      selector: { entity: { domain: ["sensor", "input_number", "number"] } },
    },
    {
      name: "",
      type: "grid",
      column_min_width: "200px",
      schema: [
        { name: "state_of_charge_unit", label: localize("editor.unit"), selector: { text: {} } },
        {
          name: "state_of_charge_decimals",
          label: localize("editor.decimals"),
          selector: { number: { mode: "box", min: 0, max: 4, step: 1 } },
        },
      ],
    },
    energyBlock,
  ];
};

/**
 * Editor for a list of aggregated units (batteries, PV sources, charging sources).
 *
 * The card has supported these lists in YAML for a while, but the UI editor had no
 * fields for them, so they could only be set by hand. This component renders one
 * expandable form per unit plus add/remove controls, and emits the whole list back
 * via a `units-changed` event.
 */
@customElement("pfcp-multi-unit-list-editor")
export class UnitListEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public units: UnitLike[] = [];

  @property() public kind: UnitListKind = "battery";

  private get _units(): UnitLike[] {
    return Array.isArray(this.units) ? this.units : [];
  }

  private _label(unit: UnitLike, index: number): string {
    if (unit.name) return unit.name;
    if (unit.entity) {
      return this.hass?.states?.[unit.entity]?.attributes?.friendly_name ?? unit.entity;
    }
    return `${localize(`editor.${this.kind}`)} ${index + 1}`;
  }

  protected render(): TemplateResult {
    const units = this._units;

    return html`
      <div class="pfcp-unit-list">
        ${units.length === 0
          ? html`<div class="pfcp-unit-empty">${localize("editor.no_units")}</div>`
          : units.map(
              (unit, index) => html`
                <ha-expansion-panel outlined>
                  <div slot="header" class="pfcp-unit-header">
                    <ha-icon .icon=${unit.icon || DEFAULT_ICON[this.kind]}></ha-icon>
                    <span class="pfcp-unit-title">${this._label(unit, index)}</span>
                  </div>
                  <div class="pfcp-unit-body">
                    <ha-form
                      .hass=${this.hass}
                      .data=${unit}
                      .schema=${unitSchema(this.kind)}
                      .computeLabel=${this._computeLabel}
                      .index=${index}
                      @value-changed=${(ev: CustomEvent) => this._unitChanged(ev, index)}
                    ></ha-form>
                    <div class="pfcp-unit-actions">
                      <ha-icon-button
                        .label=${localize("editor.move_up")}
                        .disabled=${index === 0}
                        @click=${() => this._move(index, -1)}
                      >
                        <ha-icon icon="mdi:arrow-up"></ha-icon>
                      </ha-icon-button>
                      <ha-icon-button
                        .label=${localize("editor.move_down")}
                        .disabled=${index === units.length - 1}
                        @click=${() => this._move(index, 1)}
                      >
                        <ha-icon icon="mdi:arrow-down"></ha-icon>
                      </ha-icon-button>
                      <ha-icon-button class="pfcp-unit-remove" .label=${localize("editor.remove")} @click=${() => this._remove(index)}>
                        <ha-icon icon="mdi:delete"></ha-icon>
                      </ha-icon-button>
                    </div>
                  </div>
                </ha-expansion-panel>
              `
            )}
        <mwc-button outlined .label=${localize("editor.add")} @click=${this._add}>
          <ha-icon slot="icon" icon="mdi:plus"></ha-icon>
        </mwc-button>
      </div>
    `;
  }

  private _computeLabel = (schema: any) =>
    this.hass?.localize?.(`ui.panel.lovelace.editor.card.generic.${schema?.name}`) || localize(`editor.${schema?.name}`) || schema?.name;

  private _emit(units: UnitLike[]): void {
    fireEvent(this, "units-changed" as any, { units } as any);
  }

  private _unitChanged(ev: CustomEvent, index: number): void {
    ev.stopPropagation();
    const value = ev.detail?.value;
    if (!value) return;

    // Drop keys the user cleared so they do not linger as empty strings in YAML.
    const cleaned: UnitLike = {};
    Object.entries(value).forEach(([key, val]) => {
      if (val !== "" && val !== undefined && val !== null) cleaned[key] = val;
    });

    const units = [...this._units];
    units[index] = cleaned;
    this._emit(units);
  }

  private _add(): void {
    this._emit([...this._units, {}]);
  }

  private _remove(index: number): void {
    const units = [...this._units];
    units.splice(index, 1);
    this._emit(units);
  }

  private _move(index: number, delta: number): void {
    const target = index + delta;
    const units = [...this._units];
    if (target < 0 || target >= units.length) return;
    [units[index], units[target]] = [units[target], units[index]];
    this._emit(units);
  }

  static get styles(): CSSResultGroup {
    return css`
      .pfcp-unit-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
      }
      .pfcp-unit-empty {
        color: var(--secondary-text-color);
        font-size: 0.9em;
        padding: 4px 0;
      }
      .pfcp-unit-header {
        display: flex;
        align-items: center;
        gap: 8px;
        overflow: hidden;
      }
      .pfcp-unit-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .pfcp-unit-body {
        padding: 0 8px 8px;
      }
      .pfcp-unit-actions {
        display: flex;
        justify-content: flex-end;
        gap: 4px;
        padding-top: 4px;
      }
      .pfcp-unit-remove {
        color: var(--error-color, #db4437);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "pfcp-multi-unit-list-editor": UnitListEditor;
  }
}
