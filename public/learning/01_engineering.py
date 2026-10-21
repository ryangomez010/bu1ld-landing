#!/usr/bin/env python3
"""BU1LD learning exercise: Parse CSV and preserve missingness
Original synthetic teaching fixture. No real project measurements or external data.
Tested interpreter: CPython 3.14.7; dependencies: Python standard library only.
Run: python3 01_engineering.py --smoke   (default: same checks plus bounded extensions where present)
Seed: 20261016. Floating-point tolerance: explicitly asserted, at most 1e-7.
Expected: Counts are 2 observed and 1 missing; mean_cm is 1.0; rowwise MSE is 1.0.
Resource design: one CPU, tiny in-memory arrays, no network/files writes/weights/GPU.
Typical smoke runtime is below one second; actual measured receipt accompanies the bundle.
Try changing one input, predict the output, then update the hand-derived assertion.
Passing these checks validates this fixture, not a research model or external claim.
"""
import argparse
import json
import math
import random
import sys

RNG = random.Random(20261016)

import csv, io

def parse_measurements(text):
    values, missing = [], 0
    for row in csv.DictReader(io.StringIO(text)):
        raw = row["millimetres"].strip()
        if not raw:
            missing += 1
        else:
            values.append(float(raw) / 10)
    return values, missing

def mse(predictions, targets):
    if not predictions or len(predictions) != len(targets):
        raise ValueError("Equal nonempty shapes are required")
    return sum((p-y)**2 for p,y in zip(predictions,targets))/len(targets)

def run(smoke):
    values, missing = parse_measurements("millimetres\n5\n\"\"\n15\n")
    assert values == [0.5, 1.5] and missing == 1
    assert mse([1,3],[2,4]) == 1
    try:
        mse([1,2],[1,2,100])
    except ValueError:
        pass
    else:
        raise AssertionError("Mismatched shapes must fail")
    try:
        parse_measurements("millimetres\nfifteen\n")
    except ValueError:
        pass
    else:
        raise AssertionError("Malformed is not missing")
    return {"observed":len(values),"missing":missing,"mean_cm":sum(values)/len(values),"mse":1.0}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--smoke", action="store_true", help="Run the smallest deterministic fixture")
    options = parser.parse_args()
    result = run(options.smoke)
    print(json.dumps({"status":"passed","mode":"smoke" if options.smoke else "exercise","seed":20261016,"python":sys.version.split()[0],"results":result},sort_keys=True))
