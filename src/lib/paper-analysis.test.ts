import { describe, expect, test } from "bun:test";

import { PAPER_ANALYSIS_MIN_CHARS, analyzePaperText, sha256Text } from "@/lib/paper-analysis";

const PAPER_TEXT = `
Abstract: We study the problem of evaluating retrieval-augmented language models when
documents contain contradictory evidence. This paper introduces a controlled benchmark
and a calibration method that reduces unsupported answers while preserving useful
coverage for expert users.

Introduction: The challenge is that retrieval systems can surface plausible but
irrelevant passages, and standard accuracy metrics often hide whether a model relied
on grounded evidence. We address this gap by separating answer correctness from
evidence faithfulness and by requiring the model to expose uncertainty when sources
conflict.

Method: Our method trains a lightweight verifier with a contrastive loss over answer,
claim, and passage triples. The architecture leaves the generator unchanged and adds a
post-generation scoring stage. Training uses hard negatives, temperature scaling, and
an abstention objective.

Experiments: We evaluate on Natural Questions, HotpotQA, and a newly curated
ContradictQA dataset. Baselines include dense retrieval, reranking, and a prompted
self-checking system. Metrics include exact match, evidence F1, calibration error, and
abstention precision. Ablation experiments remove hard negatives and temperature
scaling.

Results: The proposed verifier improves evidence F1, reduces calibration error, and
outperforms the self-checking baseline on contradiction-heavy examples. We find that
hard negatives matter most when retrieved documents disagree.

Limitations: The benchmark is English-only, the implementation does not test
multimodal documents, and hyperparameter sensitivity is only reported in the appendix.
Future work should evaluate whether the approach transfers to low-resource domains.

Reproducibility: The authors release code, seeds, and dataset construction scripts.
Appendix C lists learning rates, batch sizes, and hardware details.
`.repeat(2);

describe("paper analysis", () => {
  test("rejects short pasted text", async () => {
    await expect(
      analyzePaperText({
        title: "Short paper",
        text: "x".repeat(PAPER_ANALYSIS_MIN_CHARS - 1),
      }),
    ).rejects.toThrow("Paste at least");
  });

  test("extracts structured research review buckets", async () => {
    const analysis = await analyzePaperText({
      title: "Grounded Retrieval Evaluation",
      sourceUrl: "https://arxiv.org/abs/2601.00001",
      text: PAPER_TEXT,
    });

    expect(analysis.title).toBe("Grounded Retrieval Evaluation");
    expect(analysis.sourceUrl).toBe("https://arxiv.org/abs/2601.00001");
    expect(analysis.inputHash).toHaveLength(64);
    expect(analysis.result.problem.join(" ")).toContain("problem");
    expect(analysis.result.datasets.join(" ")).toContain("Natural Questions");
    expect(analysis.result.experiments.join(" ")).toContain("Ablation");
    expect(analysis.result.limitations.join(" ")).toContain("English-only");
    expect(analysis.result.reproducibility.join(" ")).toContain("code");
    expect(analysis.result.safety_note).toContain("verify");
  });

  test("hashes are stable for duplicate input", async () => {
    await expect(sha256Text("the bu1ld")).resolves.toBe(await sha256Text("the bu1ld"));
  });
});
