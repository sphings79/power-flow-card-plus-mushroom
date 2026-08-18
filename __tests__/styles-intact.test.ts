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
