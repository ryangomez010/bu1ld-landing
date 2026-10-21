# Article completion — 2026-10-16

The 120-article ML library now has an article-specific answer check for every exercise. This pass read all 120 article bodies and added the 90 missing answer sections, totaling 6,875 new answer words. The 30 articles that already contained answers were preserved exactly. The six reference essays were outside this pass; the total library count remains 126 entries.

## Completed scope

- Added worked solutions or assessment rubrics to nine articles in each of the ten topic files. Open-ended experiments have criteria for interpreting real results, not invented outcomes.
- Replaced 12 vague exercises with explicit numerical inputs or a specified comparison: vectors/matrices, similarity, base rates, losses, gradient descent, missing values, scaling, thresholds, calibration, momentum, receptive fields, and KV-cache memory.
- Corrected the threshold explanation: at fixed scores and a consistent tie rule, lowering a threshold cannot reduce recall; precision can rise or fall.
- Made pure covariate-shift and label-shift assumptions explicit, distinguishing P(y|x) from P(x|y).
- Added answer-level qualifications for finite-sample conformal quantiles, undefined absent-class overlap, BatchNorm without running statistics, microbatch weighting by scored units, residual blocks with post-addition activations, and cache memory versus whole-runtime memory.
- Preserved article slugs, order, titles, descriptions, tracks, tags, levels, reference lists, worked-example fields, and pitfall fields. No catalog generator, schema, route, or saved-progress identity was changed by this pass.

## Verification

A standard-library Python check passed the following bounded checks:

- All ten JSON files parse and each still contains 12 articles: 120 unique article positions in total.
- All 120 articles contain a nonempty answer section; the 90 new answers each contain at least 60 words.
- A before/after comparison confirmed identity, ordering, metadata, references, examples, and pitfalls were preserved, and all 30 previously complete articles are identical.
- Thirty arithmetic assertions passed, covering batched predictions/MSE, prevalence tables, squared/absolute losses, median imputation, scaling, Brier scores, ROC precision, nested-fit counts, minibatch updates, momentum coordinates, AdamW decay, receptive fields, attention-entry counts, KV-cache memory, LoRA parameters, segmentation overlap, and the conformal order statistic.
- `rtk git diff --check -- src/content/guides/articles` passed.

The arithmetic checks validate illustrative calculations; no model was trained and no empirical performance result was created. Full application tests, generated-catalog synchronization, typechecking, build, and rendered browser checks belong to the integration pass. This content-only work did not run any build, dev server, compiler, install, training job, or deployment because the host was below the 512 MiB free-plus-speculative memory admission floor.

Primary-source spot checks supported the new numerical and implementation qualifications: [split-conformal quantile construction](https://arxiv.org/pdf/2107.07511), [AdamW update](https://docs.pytorch.org/docs/2.14/generated/torch.optim.AdamW.html), [BatchNorm evaluation behavior](https://docs.pytorch.org/docs/2.14/generated/torch.nn.BatchNorm1d.html), and [KV-cache tensor layout](https://huggingface.co/docs/transformers/en/cache_explanation). Existing reference lists were retained. This was not a fresh all-link audit or an independent technical peer review.

## Changed slugs

- **data (9):** `ml-data-leakage`, `ml-missing-values`, `ml-categorical-encoding`, `ml-feature-scaling`, `ml-class-imbalance`, `ml-deduplication`, `ml-label-quality`, `ml-distribution-shift`, `ml-time-aware-features`.
- **evaluation (9):** `ml-precision-recall-thresholds`, `ml-roc-pr-curves`, `ml-regression-metrics`, `ml-calibration`, `ml-cross-validation`, `ml-nested-validation`, `ml-bootstrap-intervals`, `ml-ablation-studies`, `ml-permutation-importance`.
- **foundations (9):** `ml-supervised-unsupervised`, `ml-vectors-matrices`, `ml-dot-products`, `ml-probability-conditioning`, `ml-expectation-variance`, `ml-loss-functions`, `ml-gradient-descent`, `ml-bias-variance`, `ml-baselines`.
- **language (9):** `ml-static-contextual-embeddings`, `ml-language-model-objectives`, `ml-attention-masks`, `ml-position-encoding`, `ml-kv-cache`, `ml-retrieval-augmented-generation`, `ml-chunking-reranking`, `ml-lora`, `ml-grounded-answer-evaluation`.
- **neural (9):** `ml-activation-functions`, `ml-weight-initialization`, `ml-minibatch-training`, `ml-momentum`, `ml-adamw`, `ml-normalization-layers`, `ml-dropout`, `ml-residual-connections`, `ml-training-debugging`.
- **representations (9):** `ml-kmeans`, `ml-dbscan`, `ml-gaussian-mixtures`, `ml-autoencoders`, `ml-variational-autoencoders`, `ml-generative-adversarial-networks`, `ml-diffusion-models`, `ml-contrastive-learning`, `ml-embedding-visualization`.
- **research (9):** `ml-fair-compute-comparisons`, `ml-reproduction-replication`, `ml-negative-results`, `ml-multiple-comparisons`, `ml-causal-confounding`, `ml-conformal-prediction`, `ml-physics-informed-networks`, `ml-neural-operators`, `ml-model-cards`.
- **supervised (9):** `ml-ridge-regression`, `ml-lasso-feature-selection`, `ml-logistic-regression`, `ml-nearest-neighbors`, `ml-decision-trees`, `ml-random-forests`, `ml-gradient-boosting`, `ml-support-vector-machines`, `ml-naive-bayes`.
- **systems (9):** `ml-experiment-provenance`, `ml-checkpoint-resume`, `ml-mixed-precision`, `ml-gradient-accumulation`, `ml-inference-latency`, `ml-quantization`, `ml-drift-monitoring`, `ml-shadow-canary-evaluation`, `ml-model-serving-contract`.
- **vision (9):** `ml-receptive-fields`, `ml-image-augmentation`, `ml-vision-transfer-learning`, `ml-object-detection`, `ml-semantic-segmentation`, `ml-vision-transformer-patches`, `ml-clip`, `ml-shortcut-learning`, `ml-vision-error-analysis`.

## Remaining limitations

These are introductory articles with worked checks and research/engineering rubrics, not runnable end-to-end laboratories. The new material does not establish deployment readiness, external validity, or independent reproduction. No publication or deployment occurred in this pass.
