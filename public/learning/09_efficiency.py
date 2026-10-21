#!/usr/bin/env python3
"""BU1LD learning exercise: Quantization error, cache bytes, and speculative cost
Original synthetic teaching fixture. No real project measurements or external data.
Tested interpreter: CPython 3.14.7; dependencies: Python standard library only.
Run: python3 09_efficiency.py --smoke   (default: same checks plus bounded extensions where present)
Seed: 20261016. Floating-point tolerance: explicitly asserted, at most 1e-7.
Expected: 0.26 reconstructs as0.3, error=.04; cache=25600bytes; ideal speedup=2.5, break-even=1.6tokens.
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
    scale=0.1; original=0.26
    quantized=max(-127,min(127,round(original/scale)))
    reconstructed=quantized*scale; error=abs(reconstructed-original)
    assert quantized==3 and math.isclose(error,0.04,abs_tol=1e-12)
    cache_bytes=2*2*1*100*4*8*2
    assert cache_bytes==25600
    block_cost=4+12; target_cost=10
    speedup=4*target_cost/block_cost; break_even=block_cost/target_cost
    assert speedup==2.5 and break_even==1.6
    return {"quantized":quantized,"reconstructed":round(reconstructed,8),"absolute_error":round(error,8),"cache_bytes":cache_bytes,"ideal_speedup":speedup,"break_even_tokens":break_even}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--smoke", action="store_true", help="Run the smallest deterministic fixture")
    options = parser.parse_args()
    result = run(options.smoke)
    print(json.dumps({"status":"passed","mode":"smoke" if options.smoke else "exercise","seed":20261016,"python":sys.version.split()[0],"results":result},sort_keys=True))
