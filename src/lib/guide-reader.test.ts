import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GuideSectionView } from "../components/member/GuideSectionView";
import { guideHeadingId } from "./guide-heading";

describe("article reader", () => {
  test("answers are available in closed keyboard-native disclosure with escaped content", () => {
    const html = renderToStaticMarkup(
      createElement(GuideSectionView, {
        section: { type: "answer", text: "x < 2; <script>unsafe</script>" },
        index: 4,
      }),
    );
    expect(html).toContain("<details");
    expect(html).toContain("<summary");
    expect(html).toContain("Check your answer");
    expect(html).not.toContain(" open");
    expect(html).not.toContain("<script>");
    expect(html).toContain("x &lt; 2");
  });
  test("repeated headings retain distinct stable navigation targets", () => {
    expect(guideHeadingId("An example", 2)).not.toBe(guideHeadingId("An example", 4));
    const html = renderToStaticMarkup(
      createElement(GuideSectionView, { section: { type: "h2", text: "An example" }, index: 4 }),
    );
    expect(html).toContain(`id="${guideHeadingId("An example", 4)}"`);
  });
});
