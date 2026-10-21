# ML article expansion and editorial revision — 2026-10-15

Implemented locally in BU1LD-Web. The library now contains **120 ML articles plus six reference essays** across ten ML learning paths with twelve articles each. Added 20 articles, improved ten existing ML articles, and rewrote all six original essays. Ninety original ML article objects remain unchanged.

## New articles

- **ML foundations**: Entropy and Cross-Entropy Measure Different Uncertainties; Likelihood Is Not the Probability That a Model Is True.
- **Data preparation**: Group Splits Test Generalization to New Entities; A Missing Outcome Is Not Yet a Negative Label.
- **Supervised models**: Quantile Regression Predicts More Than the Average; Monotonic Constraints Encode a Specific Modeling Assumption.
- **Evaluation & reliability**: Choose a Decision Threshold from Explicit Error Costs; Learning Curves Help Decide What to Try Next.
- **Representations & generation**: Whitening Changes the Geometry of a Representation; Approximate Retrieval Needs an Exact-Search Baseline.
- **Neural networks**: Gradient Clipping Limits a Step Signal, Not Every Update; Freezing Weights and Evaluation Mode Solve Different Problems.
- **Computer vision**: Intersection over Union Measures Overlap, Not Object Identity; Pretrained Image Models Need Their Original Input Contract.
- **Language models**: Perplexity Depends on Tokens and Available Context; Attention Masks and Loss Masks Are Different Controls.
- **ML systems**: Batching Trades Queueing Delay for Throughput; Test Training and Serving Features on the Same Raw Input.
- **Research practice**: Paired Runs Expose the Variation Behind an Average Gain; Separate a Detectable Difference from a Useful Improvement.

## Existing material improved

The first article in each ML path now has a more concrete worked example and a checkable exercise with an answer. These cover task framing, split design, linear regression, confusion matrices, PCA, backpropagation, convolution, tokenization, data contracts, and falsifiable hypotheses.

The original LLM, mathematics, attention, JEPA, PINN, and paper-to-prototype essays now include explicit assumptions, calculations or experimental-design exercises, answer explanations, and primary sources. Removed unsupported certainty about JEPA representations, PINN advantages, and institutional schedules. Essay reading times are now calculated from body length.

The formatter supports an optional “Check your answer” section. All 20 new articles and ten revised ML articles use it. Metadata word counts include answer text. The lightweight catalog still excludes article bodies, which continue to load by topic. The library contains 28,746 ML body words and 2,164 essay body words.

## Compatibility and evidence

- All 100 previous ML slugs and their relative order are preserved; all six essay slugs are unchanged. Added articles extend the end of each path. Existing saved progress is retained and is not reset by text revisions.
- The catalog generator now permits expansion while retaining minimum coverage, uniqueness, source-link, and content checks. Search, learning paths, and catalog integration are tested at 126 total entries.
- Full local test suite: **210 passed, 0 failed, 3,595 assertions across 43 files**.
- Focused library suite: eight passed, 2,297 assertions; every article body loads and matches its metadata, answer text, and sources.
- Scoped strict TypeScript check passed for content, catalog helpers, loader, and generator with a 128 MiB heap. This is not a full-application compiler pass.
- Changed-file lint, catalog synchronization, 29-route static smoke, and diff checks passed. Eighteen independent arithmetic checks passed.
- Primary references were consulted through the web tool. The Deep Learning MLP page could not be freshly retrieved; this is not a claim of a dead link or a complete reference-availability audit. Earlier reference receipts are preserved as historical evidence.

## Remaining verification

Full application typecheck, build, and browser/role QA remain open. Free plus speculative memory remained below the existing 512 MiB admission floor, so no heavy build or new browser/server workload was started. Deployment still requires the existing source-identity and configuration gates. No commit, push, deployment, schema change, or production progress write occurred.

See [the verification receipt](ML_ARTICLE_EXPANSION_VERIFICATION_2026-10-15.json) for scope, file hashes, preserved slugs, calculations, and the focused compiler configuration.
