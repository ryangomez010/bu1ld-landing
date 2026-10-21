#!/usr/bin/env python3
"""BU1LD learning exercise: Build a causal mask and stable softmax
Original synthetic teaching fixture. No real project measurements or external data.
Tested interpreter: CPython 3.14.7; dependencies: Python standard library only.
Run: python3 05_language.py --smoke   (default: same checks plus bounded extensions where present)
Seed: 20261016. Floating-point tolerance: explicitly asserted, at most 1e-7.
Expected: mask=[[1,0,0],[1,1,0],[1,1,1]], probabilities sum to 1 and future weight is 0.
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

def softmax(logits):
    peak=max(logits)
    values=[math.exp(x-peak) for x in logits]
    return [x/sum(values) for x in values]

def run(smoke):
    mask=[[int(j<=i) for j in range(3)] for i in range(3)]
    assert mask==[[1,0,0],[1,1,0],[1,1,1]]
    weights=softmax([1000,1001,float("-inf")])
    assert math.isclose(sum(weights),1,abs_tol=1e-12)
    assert weights[2]==0
    assert math.isclose(weights[0],1/(1+math.e),abs_tol=1e-12)
    adapter_parameters=100*4+4*100
    assert adapter_parameters==800
    return {"causal_mask":mask,"weights":[round(x,8) for x in weights],"adapter_parameters":adapter_parameters}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--smoke", action="store_true", help="Run the smallest deterministic fixture")
    options = parser.parse_args()
    result = run(options.smoke)
    print(json.dumps({"status":"passed","mode":"smoke" if options.smoke else "exercise","seed":20261016,"python":sys.version.split()[0],"results":result},sort_keys=True))
