# power-flow-card-plus-mushroom

Fork von [flixlix/power-flow-card-plus](https://github.com/flixlix/power-flow-card-plus).
Die Einträge unterhalb von 1.0.0 stammen aus dem Original.

---

## v1.5.0 — Energie-Entitäten im UI-Editor

_2026-08-18_

**Eine Lücke, die den Energiemodus über die Oberfläche praktisch unbrauchbar machte.**

Seit v1.4.0 ließ sich der kWh-Modus zwar unter *Advanced* ein- und ausschalten, Zeitraum inklusive — aber es gab **kein einziges Feld, um die kWh-Entitäten zu hinterlegen**. Die gingen ausschließlich per YAML.

Jetzt hat jede Knotenseite einen aufklappbaren Abschnitt **Energie**:

| Seite | Felder |
|---|---|
| Netz | Bezogene / Eingespeiste Energie |
| Batterie | Geladene / Entladene Energie |
| Solar, Zuhause, Ladequelle | Energie-Entität |
| Jedes Individual-Gerät | Energie-Entität |
| Einträge in den Batterie-, PV- und Ladequellen-Listen | je nach Art ein oder zwei Felder |

Dazu jeweils **Zustand unverändert lesen** für Sensoren, die den Zeitraum schon abbilden — sonst leitet die Karte den Zeitraumwert aus den Statistiken des Gesamtzählers ab.

## v1.4.2 — Namen statt Entitäten im Individual-Editor

_2026-08-18_

In der Liste der Individual-Geräte stand bisher in jeder Zeile die Entität, obwohl fast immer ein sprechender Name konfiguriert ist. Jetzt gilt:

1. der vergebene `name`
2. sonst der Anzeigename der Entität
3. sonst deren Id

Der Entitäts-Picker in der Zeile weicht dafür einer anklickbaren Beschriftung, die denselben Detail-Editor öffnet wie das Stift-Symbol. Dort bleibt die Entität änderbar — es geht also nichts verloren, und die Id steht zusätzlich im Tooltip der Zeile.

## v1.4.1 — MWh für große Energiewerte

_2026-08-18_

Energiewerte wechseln ab einer einstellbaren Schwelle nach MWh, damit lange Zahlen das Layout nicht sprengen.

```yaml
kwh_threshold: 1000   # kWh, ab der MWh übernimmt; 0 schaltet es ab
mwh_decimals: 2
```

Standard ist 1000, die natürliche Einheitengrenze. Wer es früher braucht, setzt die Schwelle niedriger — bei `kwh_threshold: 100` werden aus 300 kWh dann 0,30 MWh.

Beide Optionen sind im UI-Editor unter **Advanced** verfügbar.

## v1.4.0 — Energiemodus mit Umschalter Watt/kWh

_2026-08-18_

## Umschalter in der Kopfzeile

Ein Schalter oben links wechselt zwischen **W** und **kWh**. Im kWh-Modus zeigen alle Knoten die Energie des gewählten Zeitraums; daneben steht, welcher Zeitraum das ist.

## Energie dauerhaft in den Listen

Batterien und Individual-Geräte zeigen ihre kWh **immer**, unabhängig vom Umschalter. Bei den Batterien beide Richtungen: Pfeil nach unten für geladen, Pfeil nach oben für entladen.

## Datenquelle

Kombiniert, wie gewünscht: Die Karte fragt Home Assistants Statistik-API und bildet die Differenz über den Zeitraum — ein einziger **Gesamtzähler** genügt damit für alle Zeiträume. Für Sensoren, die den Zeitraum schon abbilden, gibt es `energy_from_state: true`; dann wird der Zustand unverändert gelesen.

```yaml
energy_period: today
entities:
  grid:
    energy_consumed_entity: sensor.netz_bezug_gesamt
    energy_returned_entity: sensor.netz_einspeisung_gesamt
  battery:
    energy_charged_entity: sensor.batterien_gesamtladung
    energy_discharged_entity: sensor.batterien_gesamtentladung
  individual:
    - entity: sensor.waschmaschine_leistung
      energy_entity: sensor.waschmaschine_energie
```

## Zeiträume

**Kalenderbasiert:** heute, gestern, diese Woche (ab Montag), dieser Monat, dieses Jahr — jeweils bis jetzt.
**Rollierend:** letzte 7, 30 und 365 Tage, heute eingeschlossen.

Die Datumsrechnung ist durch acht Tests abgedeckt, inklusive Sonntag als Wochenende statt Wochenanfang.

Alle Optionen sind im UI-Editor unter **Advanced** verfügbar.

## v1.3.1 — Beschriftungen der Editor-Felder

_2026-08-18_

Die neu hinzugekommenen Felder im UI-Editor erschienen ohne Namen bzw. mit dem rohen Übersetzungsschlüssel (`editor.individual_position` und so weiter).

**Zwei Ursachen:**

1. Die Übersetzungen fehlten. Der Editor übersetzt über `editor.<name>`, und `localize` gibt den Schlüssel selbst zurück, wenn es nichts findet. Nachgetragen für alle 18 Sprachen — inklusive `appearance`, das schon seit der Mushroom-Option unbeschriftet war.

2. Der Rückfall auf das `label` aus dem Schema griff nie, weil der Ausdruck mit `||` verkettet war und der zurückgegebene Schlüssel truthy ist. Die Beschriftung fällt jetzt ausdrücklich auf `schema.label` zurück, wenn keine Übersetzung existiert — damit bleiben auch künftige Felder lesbar.

## v1.3.0 — Batterien nach Ladestand einfärben

_2026-08-18_

## Batterien nach Ladestand

```yaml
color_battery_by_soc: true
```

Grün bei voll, orange um die Hälfte, rot bei leer — dieselbe Farbrampe wie `color_individual_by_usage`, nur andersherum gelesen. Im Test: 95 % grün, 62 % gelb, 33 % orange, 8 % rot.

## Explizite Farben haben Vorrang

Eine am Gerät oder an der Batterie gesetzte `color` gewinnt jetzt gegen beide Einfärbungen. Vorher überschrieb die Verbrauchsfarbe eine ausdrücklich konfigurierte Farbe.

Die Option ist im UI-Editor unter **Advanced** als Schalter verfügbar.

## v1.2.1 — Verbrauchsfarben, 2×2-Aufschlüsselung, Linien hinter den Kreisen

_2026-08-18_

## Individual-Geräte nach Verbrauch einfärben

```yaml
color_individual_by_usage: true
individual_color_max: 3000   # Watt für volles Rot; Standard: max_expected_power
```

Grün bei wenig, orange in der Mitte, rot am oberen Ende der Skala. Damit ist auf einen Blick erkennbar, welches Gerät gerade zieht.

## Aufschlüsselung zweispaltig

Die Liste unter dem Diagramm ordnet ihre Einträge jetzt zwei pro Zeile an — vier Batterien ergeben einen 2×2-Block statt einer langen Spalte. Die Seitenleiste bleibt einspaltig, dafür ist sie zu schmal.

## Linien laufen nicht mehr durch die Kreise

Der in v1.2.0 ergänzte Kreis-Hintergrund allein reichte nicht: Das Linien-Overlay wird **nach** den Reihen gerendert und lag damit obenauf. Die Kreise haben jetzt eine explizite Stapelreihenfolge, die Linien enden am Kreisrand.

## v1.2.0 — Individual-Geräte als Liste, Linien hinter Kreisen

_2026-08-18_

## Individual-Geräte als Liste

`individual_position: right` rendert die Individual-Geräte statt als Kreise in den vier Eckplätzen als Liste **rechts neben dem Diagramm**, im Stil der Batterie-Aufschlüsselung. Bei vielen Geräten deutlich brauchbarer. Auf schmalen Karten rutscht die Liste unter das Diagramm.

```yaml
individual_position: right
sort_individual_devices: name_desc   # value (Standard) | name | name_desc
```

`sort_individual_devices` versteht weiterhin den bisherigen booleschen Wert (entspricht `value`).

## Linien scheinen nicht mehr durch die Kreise

Die Flusslinien liefen sichtbar durch die Kreise hindurch. Die CSS-Deklaration, die das verhindern sollte, war mit `//` auskommentiert — das kennt CSS nicht, die Zeile wurde stillschweigend verworfen. Bei `appearance: mushroom` liegt die Tönung jetzt über einer deckenden Basis, damit der Effekt erhalten bleibt.

## Ladequellen-Aufschlüsselung

Bei nur einer Quelle entfällt die Liste unter dem Diagramm — sie wiederholte dort nur den Wert des Knotens. Über `charger.show_breakdown: true` erzwingbar.

Beide neuen Optionen sind im UI-Editor als Auswahlfelder verfügbar.

## v1.1.2 — Flusslinien treffen die Kreise

_2026-08-18_

Die Flusslinien endeten 16 px vor den Kreisen und lagen 16 px über deren Mitte. Ursache war das `padding` des Linien-Containers — seitlich verkürzt es die Linien, unten hebt es sie an.

Nachgemessen nach der Korrektur: Lücke links und rechts jeweils **0 px**, horizontale Linien exakt auf **Kreismitte**, Ladequellen-Linie von der Kreiskante bis zur Batteriemitte.

Bewusste Abweichung vom Original v0.3.7, das dieselben Lücken hat — die Vergleichsmessung davor ergab für Fork und Original identisch −16/+16 px.

## v1.1.1 — Flusslinien-Versatz behoben

_2026-08-18_

## Behoben: verschobene Flusslinien

Sobald die Aufschlüsselungsliste sichtbar war — also **immer, wenn man mehrere Batterien oder PV-Quellen nutzt** — wurden sämtliche Flusslinien um die Höhe dieser Liste nach unten geschoben. Gemessen: 101 px Versatz bei 105 px Listenhöhe.

Ursache: Die Linien sind absolut am unteren Rand ihres Bezugselements verankert, und das war `.card-content` — in dem auch die Liste liegt. Das Diagramm hat jetzt einen eigenen Positionierungskontext.

Nachgemessen gegen die Originalkarte v0.3.7: Der Versatz zwischen Kreisen und Linien ist in beiden identisch. Der Fork weicht optisch nicht mehr vom Original ab.

## Behoben: unsichtbare Linie zur Ladequelle

Die in v1.1.0 eingeführte V2L-/Generator-Linie lag im gemeinsamen Linien-Overlay, das nur ein schmales Band oberhalb der Batterie-Reihe sichtbar lässt — sie wurde vollständig weggeschnitten. Sie hat jetzt einen eigenen Container und trifft Kreismitte und Batteriemitte exakt.

## Hinweis

Beide Korrekturen wurden durch Rendern der Karte in einer Testumgebung und Vermessen der tatsächlichen Element-Positionen verifiziert, nicht nur im Code.

## v1.1.0 — Externe Ladequelle & UI-Editor für Mehrfach-Listen

_2026-08-18_

## Neu: Ladequellen-Knoten (`charger`)

Für Quellen, die die Batterie direkt laden — V2L, Generator, Landstrom. Der Knoten sitzt **unterhalb des Grids** und speist die Batterie über eine eigene, einseitige Flusslinie.

```yaml
entities:
  charger:
    name: V2L / Generator
    sources:
      - entity: sensor.v2l_power
        name: V2L
      - entity: sensor.generator_power
        name: Generator
```

Mehrere `sources` werden zum Knoten summiert und einzeln in der Aufschlüsselung unter dem Diagramm gezeigt — genau wie bei Batterien und PV-Quellen.

Die Leistung bleibt bewusst aus der Grid/Solar/Home-Verteilungsrechnung heraus: die Batterie-Entität meldet den resultierenden Ladestrom bereits, eine Einrechnung würde ihn doppelt zählen.

## Neu: UI-Editor für die Mehrfach-Listen

`solar.sources`, `battery.batteries` und `charger.sources` waren bisher **nur per YAML** konfigurierbar — der visuelle Editor kannte sie nicht. Jetzt gibt es auf der jeweiligen Unterseite eine Liste mit Hinzufügen, Entfernen und Umsortieren.

**Behobener Datenverlust:** Beim Bearbeiten einer Seite im UI-Editor wurden per YAML gesetzte Listen bislang verworfen, weil `ha-form` nur die selbst gerenderten Felder zurückmeldet. Sie werden jetzt erhalten.

## Sonstiges

- `charger` in die Konfigurationsvalidierung des Editors aufgenommen
- Übersetzungen für alle 18 Sprachen ergänzt

## v1.0.1 — HACS-Struktur korrigiert

_2026-08-18_

Behebt die HACS-Meldung `Repository structure is not compliant`.

Das Bundle liegt jetzt unter `dist/power-flow-card-plus-mushroom.js`, dem Layout, das HACS bei Frontend-Plugins erwartet. v1.0.0 war deshalb nicht installierbar — bitte diese Version verwenden.

Ausserdem: die Konsolenausgabe beim Laden der Karte verwies noch auf das Upstream-Repository. Quellcode und ausgeliefertes Bundle stammen jetzt aus einem echten Build.

## Installation

HACS → Dreipunktmenü → **Custom repositories** → `https://github.com/sphings79/power-flow-card-plus-mushroom`, Kategorie **Dashboard**.

```yaml
type: custom:power-flow-card-plus-mushroom
```

---

# Upstream (flixlix/power-flow-card-plus)

## 0.3.2

### Patch Changes

- 71a99e5: fix release workflow

## 0.3.2

### Patch Changes

- 8b74b8e: retest monorepo initial setup

## 0.3.2

### Patch Changes

- 919c4ef: monorepo test setup

## 0.3.2

### Patch Changes

- f627e36: monorepo setup

## 0.3.2

### Patch Changes

- 76ca44c: refactor ui editor default toggle boolean options and mode for selector select
- 76ca44c: fix home clickable logic
- 76ca44c: add no_labels option
