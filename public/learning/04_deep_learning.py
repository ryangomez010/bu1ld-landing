#!/usr/bin/env python3
"""BU1LD learning exercise: Backpropagate through a scalar affine model
Original synthetic teaching fixture. No real project measurements or external data.
Tested interpreter: CPython 3.14.7; dependencies: Python standard library only.
Run: python3 04_deep_learning.py --smoke   (default: same checks plus bounded extensions where present)
Seed: 20261016. Floating-point tolerance: explicitly asserted, at most 1e-7.
Expected: prediction=7, loss=4, d_weight=12, d_bias=4; gradient agrees within 1e-7.
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

def objective(w,b,x=3,y=5):
    return (w*x+b-y)**2

def run(smoke):
    w,b,x,y=2.0,1.0,3.0,5.0
    prediction=w*x+b; residual=prediction-y
    dw=2*residual*x; db=2*residual
    h=1e-5
    numeric=(objective(w+h,b)-objective(w-h,b))/(2*h)
    assert math.isclose(dw,numeric,abs_tol=1e-7)
    assert dw==12 and db==4
    updated=objective(w-0.01*dw,b-0.01*db)
    assert updated<objective(w,b)
    return {"prediction":prediction,"loss":objective(w,b),"d_weight":dw,"d_bias":db,"updated_loss":round(updated,8)}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--smoke", action="store_true", help="Run the smallest deterministic fixture")
    options = parser.parse_args()
    result = run(options.smoke)
    print(json.dumps({"status":"passed","mode":"smoke" if options.smoke else "exercise","seed":20261016,"python":sys.version.split()[0],"results":result},sort_keys=True))
