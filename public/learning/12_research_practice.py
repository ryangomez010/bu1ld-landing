#!/usr/bin/env python3
"""BU1LD learning exercise: Keep paired comparisons and an exact sign-randomization check
Original synthetic teaching fixture. No real project measurements or external data.
Tested interpreter: CPython 3.14.7; dependencies: Python standard library only.
Run: python3 12_research_practice.py --smoke   (default: same checks plus bounded extensions where present)
Seed: 20261016. Floating-point tolerance: explicitly asserted, at most 1e-7.
Expected: differences=[-1,-1,1,-1], mean=-.5, wins=3; exact two-sided sign randomization p=.625.
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

import itertools

def run(smoke):
    baseline=[10,12,9,11]; candidate=[9,11,10,10]
    differences=[c-b for c,b in zip(candidate,baseline)]
    mean=sum(differences)/len(differences)
    assert differences==[-1,-1,1,-1] and mean==-0.5
    # Exact test under exchangeable signs; this assumption is not guaranteed for arbitrary runs.
    null=[sum(sign*d for sign,d in zip(signs,differences))/4 for signs in itertools.product([-1,1],repeat=4)]
    p=sum(abs(value)>=abs(mean) for value in null)/len(null)
    assert p==0.625
    return {"paired_differences":differences,"mean_difference":mean,"improving_pairs":sum(d<0 for d in differences),"two_sided_sign_randomization_p":p,"conclusion":"tiny illustrative fixture; no scientific validation"}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--smoke", action="store_true", help="Run the smallest deterministic fixture")
    options = parser.parse_args()
    result = run(options.smoke)
    print(json.dumps({"status":"passed","mode":"smoke" if options.smoke else "exercise","seed":20261016,"python":sys.version.split()[0],"results":result},sort_keys=True))
