import { describe, expect, test } from "bun:test";

import { canVerifyInstitutionalClaim } from "./institutional-claims";

describe("institutional claim verification gate", () => {
  test("blocks verify without evidence URL", () => {
    expect(
      canVerifyInstitutionalClaim({
        evidence_label: "GitHub README",
        evidence_url: "",
      }),
    ).toMatch(/evidence URL/i);
  });

  test("blocks verify with unsafe URL", () => {
    expect(
      canVerifyInstitutionalClaim({
        evidence_label: "Note",
        evidence_url: "javascript:alert(1)",
      }),
    ).toMatch(/evidence URL/i);
  });

  test("allows verify with https evidence", () => {
    expect(
      canVerifyInstitutionalClaim({
        evidence_label: "arXiv abstract",
        evidence_url: "https://arxiv.org/abs/1706.03762",
      }),
    ).toBeNull();
  });
});
