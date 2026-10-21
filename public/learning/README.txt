BU1LD CPU learning exercises — 16 October 2026

Download any .py file and run it independently:
  python3 01_engineering.py --smoke
Use Python 3.14.7 for the tested environment. There are no pip dependencies,
model weights, downloads, secrets, or paid services. All twelve files use only
the standard library. No environment installation was performed by this task.
The non-smoke mode repeats the core checks and, where relevant, a bounded
longer fixture. It never starts a training campaign.

Each file includes source provenance, seed, exact expected values/tolerances,
a runnable check, and an extension prompt. Read the function, predict its output,
run --smoke, change one fixture, and explain why an assertion changes. Do not
silently remove a failing assertion. The 12_research_practice.py p-value assumes
exchangeable signs in a teaching fixture; it is not a general significance test
for dependent experiments.

Original synthetic data were authored for this library. No astronomical,
weather, materials, financial, clinical, or user data are included. NumPy syntax
in the shape lesson is explanatory; the runnable reference arithmetic uses the
standard library and does not claim a NumPy performance benchmark.

A smoke pass demonstrates execution of these tiny checks. It is not independent
reproduction of a paper, validation of a BU1LD model, certification, or evidence
of physical-world performance. Each script prints a JSON receipt. See
manifest.json for the twelve fixtures and verification.json for actual runs.
Runtime and process-memory observations are environment-specific.
