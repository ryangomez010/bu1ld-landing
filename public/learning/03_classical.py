#!/usr/bin/env python3
"""BU1LD learning exercise: Separate a fitted baseline from calibration error
Original synthetic teaching fixture. No real project measurements or external data.
Tested interpreter: CPython 3.14.7; dependencies: Python standard library only.
Run: python3 03_classical.py --smoke   (default: same checks plus bounded extensions where present)
Seed: 20261016. Floating-point tolerance: explicitly asserted, at most 1e-7.
Expected: slope=2, intercept=1, Brier score=0.04; deliberate all-positive alternative is worse.
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

def least_squares(xs,ys):
    mx=sum(xs)/len(xs); my=sum(ys)/len(ys)
    slope=sum((x-mx)*(y-my) for x,y in zip(xs,ys))/sum((x-mx)**2 for x in xs)
    return slope,my-slope*mx

def run(smoke):
    slope,intercept=least_squares([0,1,2],[1,3,5])
    assert (slope,intercept)==(2.0,1.0)
    labels=[0,1]; probabilities=[0.2,0.8]
    brier=sum((p-y)**2 for p,y in zip(probabilities,labels))/2
    assert math.isclose(brier,0.04,abs_tol=1e-12)
    bad=sum((1-y)**2 for y in labels)/2
    assert bad>brier
    return {"slope":slope,"intercept":intercept,"brier":round(brier,8),"all_positive_brier":bad}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--smoke", action="store_true", help="Run the smallest deterministic fixture")
    options = parser.parse_args()
    result = run(options.smoke)
    print(json.dumps({"status":"passed","mode":"smoke" if options.smoke else "exercise","seed":20261016,"python":sys.version.split()[0],"results":result},sort_keys=True))
