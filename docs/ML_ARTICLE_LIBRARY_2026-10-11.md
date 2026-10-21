# ML article library — 2026-10-11

Added 100 distinct short ML articles to the member Guides library, preserving all six existing reference essays. The new collection contains 22,233 body words (210–235 per article), with a concept, worked example, common trap, practical exercise, and primary further-reading reference for every article. Examples are illustrative; proposed exercises are not claims of executed experiments.

## Member experience

- `/guides` now supports keyword search, topic and level selection, existing reading-progress filters, result counts, clear filters, and 24-item progressive loading.
- A foundations entry point helps a new learner start; each article has previous/next navigation within its topic.
- Every new article has a stable `/guides/ml-…` URL, article-specific page title, table of contents, and further-reading links. Existing save-to-collection, share, report, and member access controls remain connected.
- A metadata catalog feeds portal search, recommendations, and cards; article bodies load on demand in ten topic chunks.
- The reader is keyed by account and article, ignores late responses after navigation, and provides a retry state for loading failures. Scrolling back up no longer lowers loaded reading progress.

## Validation

- `rtk proxy bun run guides:check`: passed; exactly 100 articles, ten tracks, no duplicate slug/title/paragraph, four substantive sections, at least 200 body words, HTTPS references, and synchronized metadata.
- `rtk proxy bun test src/lib/*.test.ts`: 189 passed, zero failed, 2,751 assertions. The new tests load all 100 article bodies and all six legacy essays and exercise combined search/topic/level/progress filters.
- Focused ESLint on the changed guide, reader, catalog, types, research-path, and generator files: passed.
- TypeScript check limited to the article model, catalog, loader, filter, and shared types: passed.
- Full-project TypeScript under a 512 MB heap cap failed with heap exhaustion before completing. This is not a clean full-project typecheck.
- 81 unique reference URLs returned HTTP 200; all referenced fragment anchors were found. Page titles were inspected and incorrect paper IDs/labels plus a stale textbook URL were corrected. See `ML_ARTICLE_REFERENCE_CHECK_2026-10-11.json` for URL/title results and source-file hashes. Link verification is not independent expert review of every article.
- No full Vite build, browser QA, authenticated live persistence check, deployment, commit, or push in this pass. Host free/speculative memory was below 512 MiB with substantial swapping; heavier validation remains outstanding.

## Editing the collection

Article bodies live in `src/content/guides/articles/*.json`. After editing body text or metadata, run `rtk proxy bun run guides:generate`, then `rtk proxy bun run guides:check`. The generated metadata catalog contains no article paragraphs. `getAllGuides()` returns summaries; `getGuide(slug)` asynchronously loads the requested body.

## Article inventory

### ML foundations — 10 articles

| Article                                                | Level    | Member route                          |
| ------------------------------------------------------ | -------- | ------------------------------------- |
| Turn a Product Question into an ML Task                | Beginner | `/guides/ml-problem-framing`          |
| Supervised, Unsupervised, and Self-Supervised Learning | Beginner | `/guides/ml-supervised-unsupervised`  |
| Read Vectors and Matrices as Data Operations           | Beginner | `/guides/ml-vectors-matrices`         |
| Dot Products, Cosine Similarity, and Scale             | Beginner | `/guides/ml-dot-products`             |
| Conditional Probability and the Base-Rate Trap         | Beginner | `/guides/ml-probability-conditioning` |
| Expectation and Variance Explain Noisy Metrics         | Beginner | `/guides/ml-expectation-variance`     |
| Choose a Loss by the Error You Care About              | Beginner | `/guides/ml-loss-functions`           |
| Gradient Descent One Step at a Time                    | Beginner | `/guides/ml-gradient-descent`         |
| Bias and Variance as a Diagnostic Lens                 | Beginner | `/guides/ml-bias-variance`            |
| Build a Baseline That Can Actually Win                 | Beginner | `/guides/ml-baselines`                |

### Data preparation — 10 articles

| Article                                                 | Level        | Member route                       |
| ------------------------------------------------------- | ------------ | ---------------------------------- |
| Give Training, Validation, and Test Data Different Jobs | Beginner     | `/guides/ml-train-validation-test` |
| Find Leakage Before It Becomes a Great Result           | Beginner     | `/guides/ml-data-leakage`          |
| Missing Values Are a Modeling Decision                  | Beginner     | `/guides/ml-missing-values`        |
| Encode Categories Without Inventing an Order            | Beginner     | `/guides/ml-categorical-encoding`  |
| Scale Features for the Model, Not by Habit              | Beginner     | `/guides/ml-feature-scaling`       |
| Class Imbalance Is About Costs and Coverage             | Intermediate | `/guides/ml-class-imbalance`       |
| Deduplicate at the Level of the Real Example            | Intermediate | `/guides/ml-deduplication`         |
| Audit Labels Before Blaming the Model                   | Intermediate | `/guides/ml-label-quality`         |
| Recognize Which Distribution Changed                    | Intermediate | `/guides/ml-distribution-shift`    |
| Build Features That Respect Time                        | Intermediate | `/guides/ml-time-aware-features`   |

### Supervised models — 10 articles

| Article                                                        | Level        | Member route                         |
| -------------------------------------------------------------- | ------------ | ------------------------------------ |
| Linear Regression Is a Strong Diagnostic Tool                  | Beginner     | `/guides/ml-linear-regression`       |
| Ridge Regression Trades Flexibility for Stability              | Intermediate | `/guides/ml-ridge-regression`        |
| Lasso Selection Is Not a Scientific Discovery Claim            | Intermediate | `/guides/ml-lasso-feature-selection` |
| Logistic Regression Predicts Probabilities from Log-Odds       | Beginner     | `/guides/ml-logistic-regression`     |
| Nearest Neighbors Turns Representation into a Model            | Beginner     | `/guides/ml-nearest-neighbors`       |
| Decision Trees Build Predictions from Repeated Questions       | Beginner     | `/guides/ml-decision-trees`          |
| Random Forests Reduce Dependence Between Trees                 | Intermediate | `/guides/ml-random-forests`          |
| Gradient Boosting Adds Models to Correct Remaining Error       | Intermediate | `/guides/ml-gradient-boosting`       |
| Support Vector Machines Focus on the Decision Boundary         | Intermediate | `/guides/ml-support-vector-machines` |
| Naive Bayes Can Work with an Imperfect Independence Assumption | Beginner     | `/guides/ml-naive-bayes`             |

### Evaluation & reliability — 10 articles

| Article                                                       | Level        | Member route                             |
| ------------------------------------------------------------- | ------------ | ---------------------------------------- |
| Read a Confusion Matrix Before the Headline Score             | Beginner     | `/guides/ml-confusion-matrix`            |
| Precision and Recall Move with the Threshold                  | Beginner     | `/guides/ml-precision-recall-thresholds` |
| ROC and Precision–Recall Curves Answer Different Questions    | Intermediate | `/guides/ml-roc-pr-curves`               |
| MAE, RMSE, and R-Squared Tell Different Stories               | Beginner     | `/guides/ml-regression-metrics`          |
| Calibration Asks Whether Probabilities Mean What They Say     | Intermediate | `/guides/ml-calibration`                 |
| Cross-Validation Evaluates a Training Procedure               | Intermediate | `/guides/ml-cross-validation`            |
| Nested Validation Separates Tuning from Assessment            | Advanced     | `/guides/ml-nested-validation`           |
| Bootstrap Intervals Need the Right Resampling Unit            | Intermediate | `/guides/ml-bootstrap-intervals`         |
| Ablations Test a Mechanism, Not Just a Configuration          | Intermediate | `/guides/ml-ablation-studies`            |
| Permutation Importance Measures Reliance Under a Perturbation | Intermediate | `/guides/ml-permutation-importance`      |

### Representations & generation — 10 articles

| Article                                                    | Level        | Member route                                 |
| ---------------------------------------------------------- | ------------ | -------------------------------------------- |
| PCA Finds High-Variance Directions, Not the Best Labels    | Intermediate | `/guides/ml-principal-components`            |
| K-Means Depends on What Distance Makes Meaningful          | Beginner     | `/guides/ml-kmeans`                          |
| Density Clustering Can Leave Some Points Unassigned        | Intermediate | `/guides/ml-dbscan`                          |
| Gaussian Mixtures Provide Soft Cluster Membership          | Intermediate | `/guides/ml-gaussian-mixtures`               |
| Autoencoders Learn What Reconstruction Rewards             | Intermediate | `/guides/ml-autoencoders`                    |
| VAEs Balance Reconstruction with a Structured Latent Space | Advanced     | `/guides/ml-variational-autoencoders`        |
| GANs Learn Through a Moving Opponent                       | Intermediate | `/guides/ml-generative-adversarial-networks` |
| Diffusion Models Learn to Reverse Structured Corruption    | Intermediate | `/guides/ml-diffusion-models`                |
| Contrastive Learning Depends on What Counts as the Same    | Intermediate | `/guides/ml-contrastive-learning`            |
| A Two-Dimensional Embedding Plot Is a Hypothesis Generator | Intermediate | `/guides/ml-embedding-visualization`         |

### Neural networks — 10 articles

| Article                                                    | Level        | Member route                       |
| ---------------------------------------------------------- | ------------ | ---------------------------------- |
| Backpropagation through a Computational Graph              | Intermediate | `/guides/ml-backpropagation`       |
| Why Neural Networks Need Nonlinear Activations             | Beginner     | `/guides/ml-activation-functions`  |
| Initialize Weights to Keep Signals Usable                  | Intermediate | `/guides/ml-weight-initialization` |
| What a Minibatch Changes about Learning                    | Beginner     | `/guides/ml-minibatch-training`    |
| Momentum as a Running Direction of Travel                  | Intermediate | `/guides/ml-momentum`              |
| Adam, Weight Decay, and the Meaning of Regularization      | Intermediate | `/guides/ml-adamw`                 |
| Batch Normalization and Layer Normalization                | Intermediate | `/guides/ml-normalization-layers`  |
| Dropout and the Difference between Training and Evaluation | Beginner     | `/guides/ml-dropout`               |
| Residual Connections Make Identity an Easy Starting Point  | Intermediate | `/guides/ml-residual-connections`  |
| Debug a Training Loop by Overfitting a Tiny Batch          | Beginner     | `/guides/ml-training-debugging`    |

### Computer vision — 10 articles

| Article                                                           | Level        | Member route                            |
| ----------------------------------------------------------------- | ------------ | --------------------------------------- |
| Convolutions Share a Detector across an Image                     | Beginner     | `/guides/ml-convolutions`               |
| Stride, Padding, and Receptive Fields                             | Intermediate | `/guides/ml-receptive-fields`           |
| Augment Images without Changing Their Meaning                     | Beginner     | `/guides/ml-image-augmentation`         |
| Fine-Tune a Vision Model in Stages                                | Intermediate | `/guides/ml-vision-transfer-learning`   |
| Object Detection Adds Localization and Matching                   | Intermediate | `/guides/ml-object-detection`           |
| Segmentation Predicts a Label for Each Pixel                      | Intermediate | `/guides/ml-semantic-segmentation`      |
| A Vision Transformer Reads Image Patches as Tokens                | Intermediate | `/guides/ml-vision-transformer-patches` |
| Contrastive Vision-Language Models Depend on the Candidate Labels | Intermediate | `/guides/ml-clip`                       |
| Detect When a Vision Model Learns the Background                  | Intermediate | `/guides/ml-shortcut-learning`          |
| Review Vision Errors by Slice, Not Only by Score                  | Beginner     | `/guides/ml-vision-error-analysis`      |

### Language models — 10 articles

| Article                                                                  | Level        | Member route                                |
| ------------------------------------------------------------------------ | ------------ | ------------------------------------------- |
| Tokenization Determines What a Language Model Sees                       | Beginner     | `/guides/ml-tokenization`                   |
| Static and Contextual Word Representations                               | Beginner     | `/guides/ml-static-contextual-embeddings`   |
| Causal and Masked Language Modeling Ask Different Questions              | Intermediate | `/guides/ml-language-model-objectives`      |
| Attention Masks Define Which Tokens May Communicate                      | Intermediate | `/guides/ml-attention-masks`                |
| Position Information Gives Token Order a Representation                  | Intermediate | `/guides/ml-position-encoding`              |
| Key-Value Caching Trades Memory for Faster Decoding                      | Intermediate | `/guides/ml-kv-cache`                       |
| Retrieval-Augmented Generation Needs Evidence Selection and Verification | Intermediate | `/guides/ml-retrieval-augmented-generation` |
| Chunking and Reranking Shape a Retrieval System                          | Intermediate | `/guides/ml-chunking-reranking`             |
| LoRA Adapts Weight Updates through Low-Rank Factors                      | Intermediate | `/guides/ml-lora`                           |
| Evaluate Answers for Support, Completeness, and Abstention               | Intermediate | `/guides/ml-grounded-answer-evaluation`     |

### ML systems — 10 articles

| Article                                                                  | Level        | Member route                          |
| ------------------------------------------------------------------------ | ------------ | ------------------------------------- |
| Give a Data Pipeline an Explicit Contract                                | Intermediate | `/guides/ml-data-pipeline-contracts`  |
| Make an Experiment Reconstructable from Its Record                       | Beginner     | `/guides/ml-experiment-provenance`    |
| A Resumable Checkpoint Contains More than Weights                        | Intermediate | `/guides/ml-checkpoint-resume`        |
| Mixed Precision Requires Numerical Checks                                | Intermediate | `/guides/ml-mixed-precision`          |
| Gradient Accumulation Is Similar to a Larger Batch, with Caveats         | Intermediate | `/guides/ml-gradient-accumulation`    |
| Measure Inference Latency as a Distribution                              | Intermediate | `/guides/ml-inference-latency`        |
| Quantization Changes Numerical Representation and Deployment Tradeoffs   | Intermediate | `/guides/ml-quantization`             |
| Drift Monitoring Should Trigger Investigation, Not Automatic Conclusions | Intermediate | `/guides/ml-drift-monitoring`         |
| Shadow and Canary Releases Answer Different Deployment Questions         | Intermediate | `/guides/ml-shadow-canary-evaluation` |
| Version the Prediction Contract as Carefully as the Model                | Intermediate | `/guides/ml-model-serving-contract`   |

### Research practice — 10 articles

| Article                                                             | Level        | Member route                           |
| ------------------------------------------------------------------- | ------------ | -------------------------------------- |
| Turn a Research Idea into a Falsifiable Hypothesis                  | Intermediate | `/guides/ml-falsifiable-hypotheses`    |
| Compare Methods under a Declared Resource Budget                    | Intermediate | `/guides/ml-fair-compute-comparisons`  |
| Reproduction and Independent Replication Provide Different Evidence | Intermediate | `/guides/ml-reproduction-replication`  |
| A Negative Result Can Still Resolve a Useful Question               | Beginner     | `/guides/ml-negative-results`          |
| Repeated Searching Makes a Lucky Winner More Likely                 | Intermediate | `/guides/ml-multiple-comparisons`      |
| Prediction Does Not Identify the Effect of an Intervention          | Intermediate | `/guides/ml-causal-confounding`        |
| Conformal Prediction Builds Sets with a Defined Coverage Target     | Advanced     | `/guides/ml-conformal-prediction`      |
| Physics-Informed Networks Add Equations to the Training Objective   | Advanced     | `/guides/ml-physics-informed-networks` |
| Neural Operators Learn Mappings between Functions                   | Advanced     | `/guides/ml-neural-operators`          |
| A Model Card Should Describe Evidence and Limits                    | Beginner     | `/guides/ml-model-cards`               |
