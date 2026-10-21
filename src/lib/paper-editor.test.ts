import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  paperQualityIssues,
  paperWordCount,
  parsePaperSourceEvidence,
  safePaperSource,
} from "./paper-editor";
import type { Paper } from "./types";

const validPaper = {
  title: "A substantive research review",
  authors: "Researcher One",
  source_url: "https://arxiv.org/abs/2601.00001",
  summary: "An original and adequately detailed editorial summary of the paper.",
  review_body: Array.from({ length: 8 }, (_, i) => `## Section ${i}\n${"word ".repeat(90)}`).join(
    "\n",
  ),
} as Paper;
function evidence() {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    human_attestation: "on",
    full_text_read: "on",
    appendices_inspected: "on",
    figures_inspected: "on",
    full_text_url: "https://arxiv.org/pdf/2601.00001v1",
    source_sha256: "a".repeat(64),
    source_version: "v1",
    license: "CC BY 4.0",
    notes: "Read the complete source, tables and appendices; checked every quantitative claim.",
    ai_disclosure: "AI-assisted initial draft, reviewed by a human editor.",
    citations: JSON.stringify(
      Array.from({ length: 3 }, (_, i) => ({
        url: "https://arxiv.org/html/2601.00001v1",
        locator: `Table ${i}`,
        claim: "Supports the stated quantitative result.",
      })),
    ),
  }))
    data.set(key, value);
  return data;
}
describe("paper editorial prerequisites", () => {
  test("full review structure is required and URL credentials never pass", () => {
    expect(paperQualityIssues(validPaper)).toEqual([]);
    expect(paperWordCount("")).toBe(0);
    for (const url of [
      "javascript:alert(1)",
      "http://example.com",
      "https://user:pass@example.com",
      "https://example.com/a b",
    ])
      expect(safePaperSource(url)).toBe(false);
    for (const review_body of ["An abstract", "word ".repeat(1300), "word ".repeat(800)])
      expect(paperQualityIssues({ ...validPaper, review_body }).length).toBeGreaterThan(0);
    expect(
      paperQualityIssues({ ...validPaper, authors: null, source_url: null, arxiv_url: null }),
    ).toContain("Identify the paper authors.");
  });
  test("every reading attestation is independent and unchecked by default", () => {
    const valid = parsePaperSourceEvidence(evidence());
    expect(valid.full_text_read).toBe(true);
    for (const key of [
      "human_attestation",
      "full_text_read",
      "appendices_inspected",
      "figures_inspected",
    ]) {
      const form = evidence();
      form.delete(key);
      expect(() => parsePaperSourceEvidence(form)).toThrow();
    }
    const form = evidence();
    form.set("checked_by", "forged-actor");
    form.set("checked_at", "2000-01-01");
    expect(parsePaperSourceEvidence(form)).not.toHaveProperty("checked_by");
    expect(parsePaperSourceEvidence(form)).not.toHaveProperty("checked_at");
  });
  test("source evidence rejects missing or unusable claim locators", () => {
    for (const citations of [
      "bad",
      "{}",
      "[]",
      JSON.stringify([{ url: "https://example.com", locator: "", claim: "wrong" }]),
    ]) {
      const form = evidence();
      form.set("citations", citations);
      expect(() => parsePaperSourceEvidence(form)).toThrow();
    }
    const form = evidence();
    form.set("source_sha256", "not-a-hash");
    expect(() => parsePaperSourceEvidence(form)).toThrow();
  });
});
test("editorial writes use revision-bound RPC and generic paper toggles fail closed", () => {
  const result = Bun.spawnSync(
    [
      process.execPath,
      "--eval",
      `
    import { mock } from "bun:test";
    const token="00000000-0000-4000-8000-000000000001"; const calls=[]; let response={data:{paper_id:"p",revision_hash:"a".repeat(64),state:"published",decision_token:"00000000-0000-4000-8000-000000000002"},error:null};
    const client={rpc(name,args){calls.push({name,args});return{abortSignal(){return Promise.resolve(response)}}},from(){throw new Error("Direct write attempted")}};
    mock.module("./src/lib/supabase",()=>({getSupabase:()=>client,checkSupabaseConfigured:()=>true}));
    mock.module("./src/lib/audit-log",()=>({logAdminAction:()=>{throw new Error("Unexpected audit")}}));
    const {transitionPaperEditorial}=await import("./src/lib/paper-editor");
    const {setContentPublished,bulkSetContentPublished,updatePaperAdmin}=await import("./src/lib/content");
    await transitionPaperEditorial("p","publish","a".repeat(64),token);
    const generic=await setContentPublished("papers","p",true);
    const bulk=await bulkSetContentPublished("papers",["p"],true);
    const patch=await updatePaperAdmin("p",{published:true});
    const failures=[];
    for(const next of [{data:null,error:null},{data:{paper_id:"p",revision_hash:"b".repeat(64)},error:null},{data:null,error:{code:"P0001",message:"This revision changed. Reload before recording a decision."}},{data:null,error:{code:"42501",message:"private detail"}}]){response=next;try{await transitionPaperEditorial("p","approve","a".repeat(64),token);failures.push("unexpected success")}catch(e){failures.push(e.message)}}
    console.log(JSON.stringify({calls,generic,bulk,patch,failures}));
  `,
    ],
    { cwd: process.cwd(), timeout: 15000 },
  );
  expect(result.exitCode).toBe(0);
  const output = JSON.parse(result.stdout.toString());
  expect(output.calls[0]).toEqual({
    name: "transition_paper_editorial",
    args: {
      p_paper_id: "p",
      p_action: "publish",
      p_revision_hash: "a".repeat(64),
      p_decision_token: "00000000-0000-4000-8000-000000000001",
      p_evidence: {},
    },
  });
  expect(output.generic.error).toBeTruthy();
  expect(output.bulk.count).toBe(0);
  expect(output.patch.error).toBeTruthy();
  expect(output.failures).toHaveLength(4);
  for (const failure of output.failures) {
    expect(failure).not.toBe("unexpected success");
    expect(failure).not.toContain("private detail");
  }
});
test("unapplied migration is included exactly and all release gates require it", () => {
  const sql = readFileSync("supabase/phase36.sql", "utf8");
  expect(readFileSync("supabase/FINAL_SETUP.sql", "utf8")).toContain(
    `-- BEGIN supabase/phase36.sql\n${sql}\n-- END supabase/phase36.sql`,
  );
  expect(readFileSync("scripts/apply-schema.mjs", "utf8")).toContain('"supabase/phase36.sql"');
  expect(readFileSync("scripts/release-readiness.mjs", "utf8")).toContain('"phase36.sql"');
  expect(readFileSync("supabase/VERIFY_SETUP.sql", "utf8")).toContain(
    "('transition_paper_editorial')",
  );
});
