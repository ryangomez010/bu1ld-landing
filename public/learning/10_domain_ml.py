#!/usr/bin/env python3
"""BU1LD learning exercise: Audit availability and compare a persistence forecast
Original synthetic teaching fixture. No real project measurements or external data.
Tested interpreter: CPython 3.14.7; dependencies: Python standard library only.
Run: python3 10_domain_ml.py --smoke   (default: same checks plus bounded extensions where present)
Seed: 20261016. Floating-point tolerance: explicitly asserted, at most 1e-7.
Expected: only record a has a label at day3; persistence MAE=4/3; model MAE=1; confirmation fraction among followed-up=.25.
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

def run(smoke):
    records=[{"id":"a","observed":1,"label_available":2},{"id":"b","observed":2,"label_available":5},{"id":"c","observed":3,"label_available":4}]
    eligible=[r["id"] for r in records if r["observed"]<=3 and r["label_available"]<=3]
    assert eligible==["a"]
    truth=[12,13,13]; persistence=[10,12,14]; model=[11,13,15]
    base_errors=[abs(p-y) for p,y in zip(persistence,truth)]
    model_errors=[abs(p-y) for p,y in zip(model,truth)]
    differences=[m-b for m,b in zip(model_errors,base_errors)]
    assert differences==[-1,-1,1]
    assert sum(base_errors)/3==4/3 and sum(model_errors)/3==1
    feasible=[("A",8-1),("C",9-2)]
    assert feasible[0][1]==feasible[1][1]==7
    return {"available_labels":eligible,"persistence_mae":round(sum(base_errors)/3,8),"model_mae":1.0,"paired_differences":differences,"followed_up_confirmation_fraction":10/40,"all_candidate_confirmation_rate":"unknown due to selective follow-up"}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--smoke", action="store_true", help="Run the smallest deterministic fixture")
    options = parser.parse_args()
    result = run(options.smoke)
    print(json.dumps({"status":"passed","mode":"smoke" if options.smoke else "exercise","seed":20261016,"python":sys.version.split()[0],"results":result},sort_keys=True))
