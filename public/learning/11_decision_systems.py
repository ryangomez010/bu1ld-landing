#!/usr/bin/env python3
"""BU1LD learning exercise: Compute a return, action value, and bounded control rollout
Original synthetic teaching fixture. No real project measurements or external data.
Tested interpreter: CPython 3.14.7; dependencies: Python standard library only.
Run: python3 11_decision_systems.py --smoke   (default: same checks plus bounded extensions where present)
Seed: 20261016. Floating-point tolerance: explicitly asserted, at most 1e-7.
Expected: return=2.75; wait=.5*4=2; clipped-control positions=[3,2,1,.5]; IPS=1.
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
    rewards=[1,2,3]; gamma=0.5
    total=sum((gamma**t)*r for t,r in enumerate(rewards))
    assert total==2.75
    stop=2; wait=gamma*4
    assert stop==wait
    x=4.0; trajectory=[]
    for _ in range(4):
        u=max(-1,min(1,-0.5*x)); x+=u; trajectory.append(x)
    assert trajectory==[3,2,1,0.5]
    logs=[("A",1),("B",0),("A",1),("B",0)]
    estimate=sum((2 if action=="A" else 0)*reward for action,reward in logs)/len(logs)
    assert estimate==1
    return {"discounted_return":total,"stop_value":stop,"wait_value":wait,"bounded_trajectory":trajectory,"one_step_ips":estimate}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--smoke", action="store_true", help="Run the smallest deterministic fixture")
    options = parser.parse_args()
    result = run(options.smoke)
    print(json.dumps({"status":"passed","mode":"smoke" if options.smoke else "exercise","seed":20261016,"python":sys.version.split()[0],"results":result},sort_keys=True))
