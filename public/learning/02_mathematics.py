#!/usr/bin/env python3
"""BU1LD learning exercise: Check a gradient and a base-rate calculation
Original synthetic teaching fixture. No real project measurements or external data.
Tested interpreter: CPython 3.14.7; dependencies: Python standard library only.
Run: python3 02_mathematics.py --smoke   (default: same checks plus bounded extensions where present)
Seed: 20261016. Floating-point tolerance: explicitly asserted, at most 1e-7.
Expected: gradient= -6, next_weight=0.6, next_loss=5.76; precision=90/585.
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

def loss(w):
    return (w-3)**2

def run(smoke):
    h=1e-5
    finite=(loss(h)-loss(-h))/(2*h)
    assert math.isclose(finite,-6,abs_tol=1e-8)
    next_weight=0.0-0.1*(-6)
    next_loss=loss(next_weight)
    assert math.isclose(next_loss,5.76,abs_tol=1e-12)
    true_alerts=100*0.9; false_alerts=9900*0.05
    precision=true_alerts/(true_alerts+false_alerts)
    assert math.isclose(precision,90/585,abs_tol=1e-12)
    return {"gradient":-6,"next_weight":round(next_weight,8),"next_loss":round(next_loss,8),"precision":round(precision,8)}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--smoke", action="store_true", help="Run the smallest deterministic fixture")
    options = parser.parse_args()
    result = run(options.smoke)
    print(json.dumps({"status":"passed","mode":"smoke" if options.smoke else "exercise","seed":20261016,"python":sys.version.split()[0],"results":result},sort_keys=True))
