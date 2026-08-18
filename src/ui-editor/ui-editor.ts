import { LitElement, css, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { fireEvent, HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";
import { assert } from "superstruct";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { cardConfigStruct, generalConfigSchema, advancedOptionsSchema } from "./schema/_schema-all";
import localize from "../localize/localize";
import { defaultValues } from "../utils/get-default-config";
import { LovelaceRowConfig } from "./types/entity-rows";
import "./components/individual-devices-editor";
import "./components/link-subpage";
import "./components/subpage-header";
import "./components/unit-list-editor";
import { UnitListKind } from "./components/unit-list-editor";
import { loadHaForm } from "./utils/load-ha-form";
import { gridSchema } from "./schema/grid";
import { solarSchema } from "./schema/solar";
import { batterySchema } from "./schema/battery";
import { nonFossilSchema } from "./schema/fossil-fuel-percentage";
import { homeSchema } from "./schema/home";
import { chargerSchema } from "./schema/charger";
import { ConfigPage } from "./types/config-page";

const CONFIG_PAGES: {
  page: ConfigPage;
  icon?: string;
  schema?: any;
}[] = [
  {
    page: "grid",
    icon: "mdi:transmission-tower",
    schema: gridSchema,
  },
  {
    page: "solar",
    icon: "mdi:solar-power",
    schema: solarSchema,
  },
  {
    page: "battery",
    icon: "mdi:battery-high",
    schema: batterySchema,
  },
  {
    page: "fossil_fuel_percentage",
    icon: "mdi:leaf",
    schema: nonFossilSchema,
  },
  {
    page: "home",
    icon: "mdi:home",
    schema: homeSchema,
  },
  {
    page: "charger",
    icon: "mdi:ev-station",
    schema: chargerSchema,
  },
  {
    page: "individual",
    icon: "mdi:dots-horizontal-circle-outline",
  },
  {
    page: "advanced",
    icon: "mdi:cog",
    schema: advancedOptionsSchema,
  },
];

/**
 * Which config key holds the aggregated unit list for a given sub-page, and which
 * flavour of the list editor to render for it. Pages absent here have no list.
 */
const UNIT_LISTS: Partial<Record<string, { key: "batteries" | "sources"; kind: UnitListKind }>> = {
  battery: { key: "batteries", kind: "battery" },
  solar: { key: "sources", kind: "solar" },
  charger: { key: "sources", kind: "charger" },
};

@customElement("power-flow-card-plus-mushroom-editor")
export class PowerFlowCardPlusEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config?: PowerFlowCardPlusConfig;
  @state() private _configEntities?: LovelaceRowConfig[] = [];
  @state() private _currentConfigPage: ConfigPage = null;

  public async setConfig(config: PowerFlowCardPlusConfig): Promise<void> {
    assert(config, cardConfigStruct);
    this._config = config;
  }

  connectedCallback(): void {
    super.connectedCallback();
    loadHaForm();
  }

  private _editDetailElement(pageClicked: ConfigPage): void {
    this._currentConfigPage = pageClicked;
  }

  private _goBack(): void {
    this._currentConfigPage = null;
  }

  protected render() {
    if (!this.hass || !this._config) {
      return nothing;
    }
    const data = {
      ...this._config,
      display_zero_lines: {
        mode: this._config.display_zero_lines?.mode ?? defaultValues.displayZeroLines.mode,
        transparency: this._config.display_zero_lines?.transparency ?? defaultValues.displayZeroLines.transparency,
        grey_color: this._config.display_zero_lines?.grey_color ?? defaultValues.displayZeroLines.grey_color,
      },
    };

    if (this._currentConfigPage !== null) {
      if (this._currentConfigPage === "individual") {
        return html`
          <pfcp-multi-subpage-header @go-back=${this._goBack} page=${this._currentConfigPage}> </pfcp-multi-subpage-header>
          <pfcp-multi-individual-devices-editor .hass=${this.hass} .config=${this._config} @config-changed=${this._valueChanged}></pfcp-multi-individual-devices-editor>
        `;
      }

      const currentPage = this._currentConfigPage;
      const schema =
        currentPage === "advanced"
          ? advancedOptionsSchema(localize, this._config.display_zero_lines?.mode ?? defaultValues.displayZeroLines.mode)
          : CONFIG_PAGES.find((page) => page.page === currentPage)?.schema;
      // The charger page is commonly unconfigured; give ha-form an object either way.
      const dataForForm = currentPage === "advanced" ? data : (data.entities[currentPage] ?? {});
      const unitList = currentPage ? UNIT_LISTS[currentPage] : undefined;

      return html`
        <pfcp-multi-subpage-header @go-back=${this._goBack} page=${this._currentConfigPage}> </pfcp-multi-subpage-header>
        <ha-form
          .hass=${this.hass}
          .data=${dataForForm}
          .schema=${schema}
          .computeLabel=${this._computeLabelCallback}
          @value-changed=${this._valueChanged}
        ></ha-form>
        ${unitList
          ? html`
              <div class="pfcp-unit-section">
                <div class="pfcp-unit-section-title">${localize(`editor.${unitList.kind}_units`)}</div>
                <pfcp-multi-unit-list-editor
                  .hass=${this.hass}
                  .kind=${unitList.kind}
                  .units=${(dataForForm as any)?.[unitList.key] ?? []}
                  @units-changed=${(ev: CustomEvent) => this._unitsChanged(ev, unitList.key)}
                ></pfcp-multi-unit-list-editor>
              </div>
            `
          : nothing}
      `;
    }

    const renderLinkSubpage = (page: ConfigPage, fallbackIcon: string | undefined = "mdi:dots-horizontal-circle-outline") => {
      if (page === null) return nothing;
      const getIconToUse = () => {
        if (page === "individual" || page === "advanced") return fallbackIcon;
        return this?._config?.entities[page]?.icon || fallbackIcon;
      };
      const icon = getIconToUse();
      return html`
        <pfcp-multi-link-subpage
          path=${page}
          header="${localize(`editor.${page}`)}"
          @open-sub-element-editor=${() => this._editDetailElement(page)}
          icon=${icon}
        >
        </pfcp-multi-link-subpage>
      `;
    };

    const renderLinkSubPages = () => {
      return CONFIG_PAGES.map((page) => renderLinkSubpage(page.page, page.icon));
    };

    return html`
      <div class="card-config">
        <ha-form
          .hass=${this.hass}
          .data=${data}
          .schema=${generalConfigSchema}
          .computeLabel=${this._computeLabelCallback}
          @value-changed=${this._valueChanged}
        ></ha-form>
        ${renderLinkSubPages()}
      </div>
    `;
  }

  private _valueChanged(ev: any): void {
    let config = ev.detail.value || "";

    if (!this._config || !this.hass) {
      return;
    }

    if (this._currentConfigPage !== null && this._currentConfigPage !== "advanced" && this._currentConfigPage !== "individual") {
      const page = this._currentConfigPage;
      const previous = (this._config.entities as any)?.[page] ?? {};
      const unitList = UNIT_LISTS[page];

      // `ha-form` only reports the fields it renders. The aggregated unit lists
      // (`batteries` / `sources`) have no form fields on this page, so they would be
      // dropped from the config on every edit if we did not carry them over.
      const preserved = unitList && previous[unitList.key] !== undefined ? { [unitList.key]: previous[unitList.key] } : {};

      config = {
        ...this._config,
        entities: {
          ...this._config.entities,
          [page]: { ...config, ...preserved },
        },
      };
    }

    fireEvent(this, "config-changed", { config });
  }

  /** Applies a changed unit list (batteries / PV sources / charging sources). */
  private _unitsChanged(ev: CustomEvent, key: "batteries" | "sources"): void {
    ev.stopPropagation();
    const page = this._currentConfigPage;
    if (!this._config || page === null || page === "advanced" || page === "individual") return;

    const units = (ev.detail as any)?.units ?? [];
    const previous = (this._config.entities as any)?.[page] ?? {};
    const next = { ...previous };

    // An empty list is removed entirely rather than left as `[]` in the YAML.
    if (units.length) next[key] = units;
    else delete next[key];

    fireEvent(this, "config-changed", {
      config: {
        ...this._config,
        entities: { ...this._config.entities, [page]: next },
      },
    });
  }

  private _computeLabelCallback = (schema: any) =>
    this.hass!.localize(`ui.panel.lovelace.editor.card.generic.${schema?.name}`) || localize(`editor.${schema?.name}`) || schema?.label;

  static get styles() {
    return css`
      ha-form {
        width: 100%;
      }

      ha-icon-button {
        align-self: center;
      }

      .entities-section * {
        background-color: #f00;
      }

      .card-config {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        margin-bottom: 10px;
      }

      .pfcp-unit-section {
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3));
      }

      .pfcp-unit-section-title {
        font-weight: 500;
        margin-bottom: 8px;
      }

      .config-header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }

      .config-header.sub-header {
        margin-top: 24px;
      }

      ha-icon {
        padding-bottom: 2px;
        position: relative;
        top: -4px;
        right: 1px;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "power-flow-card-plus-mushroom-editor": PowerFlowCardPlusEditor;
  }
}
