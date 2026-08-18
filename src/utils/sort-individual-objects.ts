import { IndividualObject } from "@/states/raw/individual/get-individual-object";

/**
 * How individual devices are ordered.
 * - `value` (the historical behaviour of `sort_individual_devices: true`): highest power first
 * - `name` / `name_desc`: alphabetically by display name, ascending or descending
 */
export type IndividualSortMode = "value" | "name" | "name_desc";

const label = (obj: IndividualObject): string => String(obj.name ?? obj.entity ?? "");

export const sortIndividualObjects = (individualObjs: IndividualObject[], mode: IndividualSortMode = "value"): IndividualObject[] => {
  const byName = mode === "name" || mode === "name_desc";

  return individualObjs
    .map((obj, index) => ({ obj, index }))
    .sort((a, b) => {
      if (byName) {
        const diff = label(a.obj).localeCompare(label(b.obj), undefined, { sensitivity: "base", numeric: true });
        if (diff !== 0) return mode === "name_desc" ? -diff : diff;
        return a.index - b.index;
      }

      const stateDiff = (b.obj.state || 0) - (a.obj.state || 0);
      if (stateDiff !== 0) return stateDiff;

      const entityDiff = a.obj.entity.localeCompare(b.obj.entity);
      if (entityDiff !== 0) return entityDiff;

      return a.index - b.index;
    })
    .map(({ obj }) => obj);
};
