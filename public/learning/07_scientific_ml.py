#!/usr/bin/env python3
"""BU1LD learning exercise: Diffuse an impulse with fixed boundaries
Original synthetic teaching fixture. No real project measurements or external data.
Tested interpreter: CPython 3.14.7; dependencies: Python standard library only.
Run: python3 07_scientific_ml.py --smoke   (default: same checks plus bounded extensions where present)
Seed: 20261016. Floating-point tolerance: explicitly asserted, at most 1e-7.
Expected: step1=[0,.25,.5,.25,0], step2=[0,.25,.375,.25,0]; r=.75 yields a negative centre.
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

def step(field,r):
    result=[0.0]*len(field)
    for i in range(1,len(field)-1):
        result[i]=field[i]+r*(field[i-1]-2*field[i]+field[i+1])
    return result

def run(smoke):
    initial=[0,0,1,0,0]
    first=step(initial,0.25); second=step(first,0.25)
    assert first==[0,0.25,0.5,0.25,0]
    assert second==[0,0.25,0.375,0.25,0]
    assert initial==[0,0,1,0,0]
    unstable=step(initial,0.75)
    assert unstable[2]<0
    field=initial
    for _ in range(2 if smoke else 20):
        field=step(field,0.25)
        assert all(x>=0 for x in field)
    return {"step1":first,"step2":second,"unstable_step":unstable}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--smoke", action="store_true", help="Run the smallest deterministic fixture")
    options = parser.parse_args()
    result = run(options.smoke)
    print(json.dumps({"status":"passed","mode":"smoke" if options.smoke else "exercise","seed":20261016,"python":sys.version.split()[0],"results":result},sort_keys=True))
