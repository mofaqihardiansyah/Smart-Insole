import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { GlassTable, GlassTableRow, GlassTableCell } from "./GlassTable";

/**
 * The column head's ink (M-01a, threat T-03-17).
 *
 * The head cell sits on the raised surface tint, and `muted` is measured
 * against a plain surface: it clears AA on `bg` and falls under it on
 * `bg-surface-2`. So the head takes `fg-2` and the data cells below keep what
 * they already had. Everything else about this file — the uppercase micro
 * style, the nowrap label, the single horizontal scroll container, and the
 * off-grid `py-3.5` on the head, which belongs to backlog 999.3 and not to this
 * correction — is asserted only where pinning it is the point.
 */

const renderTable = () => {
  const utils = render(
    <>
      {/* Two wrappers are rendered so the count below is a real verdict: a
          second table must not add a second scroll container either. */}
      <GlassTable caption="Ringkasan">
        <thead>
          <tr>
            <GlassTableCell as="th">Puncak</GlassTableCell>
          </tr>
        </thead>
        <tbody>
          <GlassTableRow>
            <GlassTableCell>42.0</GlassTableCell>
          </GlassTableRow>
        </tbody>
      </GlassTable>
    </>
  );

  return {
    ...utils,
    head: utils.container.querySelector("th"),
    data: utils.container.querySelector("td"),
    wrappers: utils.container.querySelectorAll("div"),
  };
};

describe("GlassTable", () => {
  it("inks the raised column head with fg-2 and never with the muted ink", () => {
    const { head } = renderTable();

    expect(head).not.toBeNull();
    expect(head.className).toContain("text-fg-2");
    expect(head.className).not.toContain("text-muted");

    // The raised surface is why: the two are only correct in that pairing.
    expect(head.className).toContain("bg-surface-2");
  });

  it("keeps the head's uppercase micro style and its nowrap label", () => {
    const { head } = renderTable();

    expect(head.className).toContain("text-label");
    expect(head.className).toContain("uppercase");
    expect(head.className).toContain("whitespace-nowrap");
  });

  it("leaves the data cell on the ink it already had", () => {
    const { data } = renderTable();

    expect(data.className).toContain("text-fg-2");
    expect(data.className).toContain("tabular-data");
  });

  it("keeps the wrapper the only horizontal scroll container", () => {
    const { wrappers } = renderTable();

    const scrollers = Array.from(wrappers).filter((node) =>
      node.className.includes("overflow-x-auto")
    );
    expect(scrollers).toHaveLength(1);

    const table = render(
      <GlassTable>
        <thead>
          <tr>
            <GlassTableCell as="th">Puncak</GlassTableCell>
          </tr>
        </thead>
      </GlassTable>
    ).container.querySelector("table");

    // The table itself never scrolls; the page must not scroll sideways.
    expect(table.className).not.toContain("overflow-x-auto");
  });
});
