#!/usr/bin/env python3
"""Fetch a bounded public arXiv PDF for manual figure inspection. Never marks it read."""
import argparse, hashlib, importlib.util, json, time, urllib.request
from pathlib import Path
spec = importlib.util.spec_from_file_location("discovery", Path(__file__).with_name("paper-discover.py"))
discovery = importlib.util.module_from_spec(spec)
spec.loader.exec_module(discovery)
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("id")
parser.add_argument("--version", default="v1")
args = parser.parse_args()
identity = discovery.normalize_id(args.id)
if not __import__("re").fullmatch(r"v[1-9][0-9]*", args.version):
    parser.error("A version such as v1 is required")
url = discovery.safe_url("https://arxiv.org/pdf/" + identity + args.version)
root = discovery.OUT / "source-cache"
root.mkdir(exist_ok=True)
path = root / (identity.replace("/", "-") + args.version + ".pdf")
receipt = path.with_suffix(".pdf.json")
if path.exists() and receipt.exists():
    print(json.dumps({"path": str(path), "status": "cached"}))
    raise SystemExit(0)
temp = path.with_suffix(".pdf.tmp")
started = time.monotonic()
size = 0
sha = hashlib.sha256()
try:
    opener = urllib.request.build_opener(discovery.Redirects())
    with opener.open(urllib.request.Request(url, headers={"User-Agent": discovery.USER_AGENT}), timeout=30) as source, temp.open("wb") as target:
        discovery.safe_url(source.geturl())
        if "pdf" not in source.headers.get("Content-Type", "").lower():
            raise ValueError("Expected PDF response")
        while True:
            block = source.read(65536)
            if not block:
                break
            size += len(block)
            if size > 64_000_000 or time.monotonic() - started > 180:
                raise ValueError("PDF exceeds 64 MB or 180 second source bound")
            if size == len(block) and not block.startswith(b"%PDF-"):
                raise ValueError("Invalid PDF signature")
            sha.update(block)
            target.write(block)
    temp.replace(path)
    result = {"status": "fetched", "url": url, "retrievedAt": discovery.now(), "bytes": size, "sha256": sha.hexdigest(), "path": str(path.relative_to(discovery.ROOT)), "readAt": None, "figuresInspected": False}
    discovery.write_json(receipt, result)
    print(json.dumps(result))
except Exception as exc:
    discovery.write_json(receipt, {"status": "failed", "url": url, "attemptedAt": discovery.now(), "bytesReceived": size, "reason": str(exc)})
    raise
