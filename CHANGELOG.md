# Changelog

All notable changes to power-flow-card-plus-mushroom, a fork of
[flixlix/power-flow-card-plus](https://github.com/flixlix/power-flow-card-plus).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
For releases before 1.0.0, see the
[upstream changelog](https://github.com/flixlix/flixlix-cards/blob/main/packages/flixlix-cards/power-flow-card-plus/CHANGELOG.md).

## [1.7.3] - 2026-09-19

No functional change to the card.

### Added

- `LICENSE` file (MIT), after the upstream author declared MIT for all of the cards.
- Licence header in the built bundle. HACS downloads only the `.js` file, without a `LICENSE` beside it, so the notice now travels with it.

### Changed

- `license` in `package.json` from `ISC` (an `npm init` leftover) to `MIT`.
- `@license` comments survive minification instead of being stripped wholesale. This also preserves the notices of bundled dependencies such as lit (BSD-3-Clause), which require it; the bundle grows from 342 KB to 349 KB.

### Fixed

- `repository`, `bugs` and `homepage` in `package.json` pointed at `power-flow-card-plus` instead of `power-flow-card-plus-mushroom`, so the links went nowhere.

## [1.7.2] - 2026-08-18

### Fixed

- Horizontal rule and 24 px of reserved space above the top breakdown zone, with nothing above it to separate from. Same specificity trap as the column grid and the side zones before it: `.pfcp-zone-top` carries exactly one class, the general `.pfcp-breakdown` rule does too, and since the zone rule comes first the general one wins.

### Added

- Test covering all four zones for the combined selector. A plain `.pfcp-zone-top {` now fails the suite instead of silently shipping a rule.

## [1.7.1] - 2026-08-18

### Changed

- The Watt/kWh toggle no longer costs a row. It is positioned absolutely in the free top-left corner of the diagram; diagram box and circle positions are unchanged, 110 px remain to the solar circle. That corner is only free while `individual_position` is not `grid`.

### Fixed

- Superfluous separator line above side zones. A side zone sits beside the diagram, not below it, so it separated nothing. Same specificity trap as the column grid: the side-zone rule stood before the general breakdown rule and lost to it at equal specificity.

## [1.7.0] - 2026-08-18

### Added

- `color_battery_by_discharge` with `battery_discharge_max`, and `discharge_color_max` per battery: green at low discharge, red at full load, each battery measured against its own maximum. Charging counts as no discharge and stays green.
- The two battery colourings are independent: `color_battery_by_soc` colours icon and bar by state of charge, `color_battery_by_discharge` colours the power value. One row can carry both — a green bar at 95 % full next to a red value at 7.6 kW discharge.

### Changed

- PV: the numeric value is coloured too, not just the bar.
- PV at 0 W is grey instead of red. A system producing nothing at night is not a fault; red stays reserved for a system that could produce but barely does. Value, bar and icon go grey together.

## [1.6.2] - 2026-08-18

### Changed

- State of charge in the battery list is now the largest number in the row: `1.05rem` semibold with the accent colour, instead of `0.75rem` at 75 % opacity — smaller and paler than every other value in the row, though it is a battery's most important figure. With `color_battery_by_soc: true` the accent follows the charge level (95 % green, 62 % yellow, 33 % orange, 8 % red); without the option it falls back to the normal text colour.

## [1.6.1] - 2026-08-18

### Fixed

- The first statistics fetch went nowhere. It ran in `connectedCallback`, where `hass` is usually not assigned yet, so the query aborted immediately and the next attempt only came with the five-minute timer. The initial fetch now hangs off `updated()`, as soon as `hass` arrives.
- All values disappeared shortly after midnight. For a period without a statistics entry the query returned nothing instead of zero, and "today" has no completed hour at 00:05. An empty response is a valid answer: the value is **0 kWh**, not unknown.
- The debounce is reset after an error so the next refresh tries again.

### Added

- Four tests covering the empty period, summation, the fallback to cumulative sums, and idling with no entities configured.

## [1.6.0] - 2026-08-18

### Added

- `color_solar_by_output` with `color_max` per source: red at nothing, orange between, green at peak output. Every system is measured against its own `color_max`, so an 800 Wp balcony module at full load looks as green as a 10 kWp roof array.
- Free positioning of the lists through `solar_position`, `battery_position`, `charger_position` (`top` | `bottom` | `left` | `right`) and `individual_position` (additionally `grid` for the corner circles). A general zone layout replaces the former fixed sidebar; solar defaults to `top`, matching the solar node.

### Fixed

- `energy_entity` on PV and charger sources had no effect. The editor had offered the field since 1.5.0, but nothing read it, so the per-source kWh stayed empty.
- Names were truncated as soon as two groups stood side by side; the fixed two-column grid is now auto-fit.
- Side zones were too narrow for their content — the rule lost to the general breakdown rule at equal specificity.

## [1.5.0] - 2026-08-18

### Added

- An **Energy** section on every node page of the UI editor. Since 1.4.0 the kWh mode could be switched on under *Advanced*, period included, but there was no field at all for the kWh entities — those were YAML only, which made the mode practically unusable from the interface. Fields per page:
  - Grid: consumed / returned energy
  - Battery: charged / discharged energy
  - Solar, home, charger: energy entity
  - Each individual device: energy entity
  - Entries in the battery, PV and charger lists: one or two fields depending on type
- **Read state as-is** per field, for sensors that already cover the period. Otherwise the card derives the period value from the statistics of the cumulative meter.

## [1.4.2] - 2026-08-18

### Changed

- Rows in the individual-device list show the configured `name`, else the entity's friendly name, else its id, instead of always the entity — a speaking name is configured in nearly every case. The entity picker in the row gives way to a clickable label that opens the same detail editor as the pencil icon, where the entity stays editable; the id is in the row's tooltip.

## [1.4.1] - 2026-08-18

### Added

- `kwh_threshold` (default 1000, `0` disables it) and `mwh_decimals`: energy values switch to MWh above the threshold so long numbers do not break the layout. 1000 is the natural unit boundary; at `kwh_threshold: 100`, 300 kWh becomes 0.30 MWh. Both options are in the UI editor under **Advanced**.

## [1.4.0] - 2026-08-18

### Added

- Energy mode with a W/kWh toggle in the header. In kWh mode every node shows the energy of the selected period, with the period named beside it.
- Batteries and individual devices show their kWh permanently, regardless of the toggle; batteries in both directions, arrow down for charged, arrow up for discharged.
- Energy entities per node: `energy_consumed_entity` / `energy_returned_entity` for the grid, `energy_charged_entity` / `energy_discharged_entity` for the battery, `energy_entity` everywhere else. The card queries Home Assistant's statistics API and takes the difference over the period, so a single cumulative meter covers every period. `energy_from_state: true` reads the state as-is for sensors that already cover the period.
- `energy_period` — calendar-based: today, yesterday, this week (from Monday), this month, this year, each up to now. Rolling: the last 7, 30 and 365 days, today included. The date arithmetic is covered by eight tests, including Sunday as end of week rather than start.
- All options are in the UI editor under **Advanced**.

## [1.3.1] - 2026-08-18

### Fixed

- Newly added editor fields appeared without a name, or with the raw translation key (`editor.individual_position` and so on). Two causes: the translations were missing — the editor translates through `editor.<name>`, and `localize` returns the key itself when it finds nothing, so they were added for all 18 languages, including `appearance`, unlabelled since the Mushroom option. And the fallback to the schema's `label` never fired, because the expression was chained with `||` and the returned key is truthy. Labels now fall back to `schema.label` explicitly, which keeps future fields readable too.

## [1.3.0] - 2026-08-18

### Added

- `color_battery_by_soc`: green when full, orange around half, red when empty — the same colour ramp as `color_individual_by_usage`, read the other way round (95 % green, 62 % yellow, 33 % orange, 8 % red). Available as a switch in the UI editor under **Advanced**.

### Fixed

- A `color` set explicitly on a device or battery now wins over both colourings. Previously the usage colour overrode a deliberately configured colour.

## [1.2.1] - 2026-08-18

### Added

- `color_individual_by_usage` with `individual_color_max` (default: `max_expected_power`): green at low draw, orange in the middle, red at the top of the scale, so it is visible at a glance which device is pulling.

### Changed

- The breakdown below the diagram places two entries per row — four batteries form a 2×2 block instead of one long column. The sidebar stays single-column; it is too narrow for two.

### Fixed

- Flow lines still ran through the circles. The circle background added in 1.2.0 was not enough on its own: the line overlay renders *after* the rows and therefore sat on top. The circles now have an explicit stacking order and the lines end at the circle edge.

## [1.2.0] - 2026-08-18

### Added

- `individual_position: right` renders individual devices as a list beside the diagram instead of circles in the four corner slots, styled like the battery breakdown — considerably more usable with many devices. On narrow cards the list moves below the diagram.
- `sort_individual_devices` accepts `value` (default), `name` and `name_desc`; the previous boolean still works and corresponds to `value`.
- `charger.show_breakdown` to force the charger breakdown.
- Both new options are available as select fields in the UI editor.

### Changed

- With only one charger source the breakdown below the diagram is omitted — it only repeated the node's value there.

### Fixed

- Flow lines showed through the circles. The CSS declaration meant to prevent that was commented out with `//`, which CSS does not know, so the line was silently discarded. With `appearance: mushroom` the tint now sits on an opaque base so the effect is preserved.

## [1.1.2] - 2026-08-18

### Fixed

- Flow lines ended 16 px short of the circles and sat 16 px above their centre, caused by the `padding` of the line container: at the sides it shortens the lines, at the bottom it lifts them. Measured after the fix: 0 px gap left and right, horizontal lines exactly on circle centre, charger line from circle edge to battery centre. A deliberate deviation from upstream 0.3.7, which has the same gaps — the comparison beforehand measured an identical −16/+16 px in fork and original.

## [1.1.1] - 2026-08-18

Both fixes were verified by rendering the card in a test environment and measuring actual element positions, not only in code.

### Fixed

- Every flow line was pushed down by the height of the breakdown list whenever that list was visible — that is, whenever multiple batteries or PV sources are in use (measured: 101 px offset at 105 px list height). The lines are anchored absolutely to the bottom of their containing block, and that was `.card-content`, which holds the list as well. The diagram now has its own positioning context. Measured against the original card 0.3.7, the offset between circles and lines is identical in both.
- The V2L/generator line introduced in 1.1.0 was invisible. It lay in the shared line overlay, which only exposes a narrow band above the battery row, and was clipped away entirely. It has its own container now and meets circle centre and battery centre exactly.

## [1.1.0] - 2026-08-18

### Added

- `charger` node, for sources that charge the battery directly — V2L, generator, shore power. It sits below the grid node and feeds the battery over its own one-way flow line. Multiple `sources` are summed into the node and listed individually in the breakdown below the diagram, exactly like batteries and PV sources. Its power is deliberately kept out of the grid/solar/home distribution: the battery entity already reports the resulting charge current, so counting it again would double it.
- UI editor support for `solar.sources`, `battery.batteries` and `charger.sources`, with add, remove and reorder on the respective sub-page. They were YAML only before; the visual editor did not know them.
- `charger` added to the editor's config validation, and translations for all 18 languages.

### Fixed

- Data loss: editing a page in the UI editor discarded lists set via YAML, because `ha-form` only reports back the fields it rendered itself. They are preserved now.

## [1.0.1] - 2026-08-18

### Fixed

- HACS reported `Repository structure is not compliant`. The bundle now lives at `dist/power-flow-card-plus-mushroom.js`, the layout HACS expects for frontend plugins. 1.0.0 was not installable because of this — use this version instead.
- The console output on load still referred to the upstream repository. Source and shipped bundle now come from a real build.
