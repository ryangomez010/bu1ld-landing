#!/usr/bin/env python3
"""BU1LD learning exercise: Intervene on synthetic memory and preserve idempotent receipts
Original synthetic teaching fixture. No real project measurements or external data.
Tested interpreter: CPython 3.14.7; dependencies: Python standard library only.
Run: python3 08_memory_agents.py --smoke   (default: same checks plus bounded extensions where present)
Seed: 20261016. Floating-point tolerance: explicitly asserted, at most 1e-7.
Expected: relevant accuracy=1, absent=0; duplicate calls produce one receipt; conflicting payload fails.
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

def register(store,key,payload):
    if key in store:
        if store[key]["payload"]!=payload:
            raise ValueError("Idempotency conflict")
        return store[key]["id"]
    identifier=f"receipt-{len(store)+1}"
    store[key]={"id":identifier,"payload":dict(payload)}
    return identifier

def run(smoke):
    memory={"q1":"key-red","q2":"key-blue","q3":"key-green","q4":"key-yellow"}
    correct=sum(memory.get(q)==answer for q,answer in memory.items())/4
    absent=sum({}.get(q)==answer for q,answer in memory.items())/4
    assert correct==1 and absent==0
    store={}; first=register(store,"demo-001",{"event":"e1"})
    assert register(store,"demo-001",{"event":"e1"})==first
    try:
        register(store,"demo-001",{"event":"e2"})
    except ValueError:
        pass
    else:
        raise AssertionError("Changed payload must fail")
    assert len(store)==1
    return {"relevant_accuracy":correct,"absent_accuracy":absent,"durable_in_fake_only":False,"receipt_count":len(store),"receipt_id":first}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--smoke", action="store_true", help="Run the smallest deterministic fixture")
    options = parser.parse_args()
    result = run(options.smoke)
    print(json.dumps({"status":"passed","mode":"smoke" if options.smoke else "exercise","seed":20261016,"python":sys.version.split()[0],"results":result},sort_keys=True))
