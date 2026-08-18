import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * The stylesheet lives in a css`` template literal. A stray backtick inside a
 * comment silently terminates it, and the rest of the file is then parsed as
 * JavaScript — which either fails the build or, worse, ships a card whose
 * stylesheet stops halfway. Both happened during development, so guard it.
 */
describe("style.ts template literal", () => {
  const source = readFileSync(join(__dirname, "../src/style.ts"), "utf-8");
  const open = source.indexOf("css`") + "css`".length;
  const close = source.indexOf("`", open);
  const body = source.slice(open, close);

  it("runs to the end of the stylesheet rather than stopping at a stray backtick", () => {
    // The last rule in the file must be inside the literal.
    expect(body).toContain(".pfcp-sub-energy");
    expect(body.length).toBeGreaterThan(20000);
  });

  it("contains no backticks in its comments", () => {
    const comments = body.match(/\/\*[\s\S]*?\*\//g) ?? [];
    const offending = comments.filter((c) => c.includes("`"));
    expect(offending).toEqual([]);
  });

  it("closes every brace it opens", () => {
    const opens = (body.match(/{/g) ?? []).length;
    const closes = (body.match(/}/g) ?? []).length;
    expect(opens).toBe(closes);
  });
});

/**
 * Every zone variant overrides properties the shared `.pfcp-breakdown` rule sets.
 * Both have one class of specificity, so a single-class zone selector defined
 * before it silently loses — which shipped a stray divider above a zone three
 * times during development.
 */
describe("zone rules outrank the shared breakdown rule", () => {
  const source = readFileSync(join(__dirname, "../src/style.ts"), "utf-8");

  it.each(["top", "bottom", "left", "right"])("the %s zone block uses the combined selector", (zone) => {
    const block = new RegExp(`^\\s*\\.pfcp-zone-${zone}\\s*[,{]`, "m");
    expect(source).not.toMatch(block);
  });
});
