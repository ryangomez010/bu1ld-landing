#!/usr/bin/env python3
"""BU1LD learning exercise: Detect a collapsed target and compare recursive dynamics
Original synthetic teaching fixture. No real project measurements or external data.
Tested interpreter: CPython 3.14.7; dependencies: Python standard library only.
Run: python3 06_representations.py --smoke   (default: same checks plus bounded extensions where present)
Seed: 20261016. Floating-point tolerance: explicitly asserted, at most 1e-7.
Expected: original variance=8/3; collapsed variance=0; 0.88 rollout error is lower than 1.01 at horizon10.
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

def variance(values):
    mean=sum(values)/len(values)
    return sum((x-mean)**2 for x in values)/len(values)

def run(smoke):
    original=variance([1,3,5]); collapsed=variance([3,3,3])
    assert math.isclose(original,8/3,abs_tol=1e-12) and collapsed==0
    truth=0.9**10
    stable=abs(0.88**10-truth); unstable=abs(1.01**10-truth)
    assert stable<unstable
    # Nonzero variance is not sufficient: independent noise has no designed task signal.
    noise=[RNG.random() for _ in range(8 if smoke else 128)]
    assert variance(noise)>0
    return {"original_variance":round(original,8),"collapsed_variance":collapsed,"stable_error_h10":round(stable,8),"unstable_error_h10":round(unstable,8)}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--smoke", action="store_true", help="Run the smallest deterministic fixture")
    options = parser.parse_args()
    result = run(options.smoke)
    print(json.dumps({"status":"passed","mode":"smoke" if options.smoke else "exercise","seed":20261016,"python":sys.version.split()[0],"results":result},sort_keys=True))
