#!/usr/bin/env python3
"""Bounded public URL reachability only; never authenticates, submits, or executes content."""
import concurrent.futures
import datetime
import ipaddress
import json
from pathlib import Path
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "docs/WEBSITE_LINKS_2026-10-16.json"


def public_url(url):
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme not in ("http", "https") or parsed.username or parsed.password:
        raise ValueError("Only public HTTP(S) without credentials is allowed")
    if not parsed.hostname or "worldcastr" in parsed.hostname.lower() or "worldcastr" in parsed.path.lower():
        raise ValueError("Destination outside this task scope")
    if parsed.port not in (None, 80, 443):
        raise ValueError("Nonstandard port is excluded")
    addresses = socket.getaddrinfo(parsed.hostname, parsed.port or 443, type=socket.SOCK_STREAM)
    if not addresses or any(not ipaddress.ip_address(item[4][0]).is_global for item in addresses):
        raise ValueError("Private or non-global network address excluded")
    return url


class PublicRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        public_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def probe(url):
    start = time.monotonic()
    try:
        public_url(url)
        opener = urllib.request.build_opener(PublicRedirect())
        for method in ("HEAD", "GET"):
            request = urllib.request.Request(url, method=method, headers={"User-Agent": "BU1LD-LinkCheck/1.0", "Range": "bytes=0-0"})
            try:
                with opener.open(request, timeout=8) as response:
                    result = {"classification": "REACHABLE", "httpStatus": response.status, "finalUrl": response.url, "method": method}
                break
            except urllib.error.HTTPError as error:
                if method == "HEAD" and error.code in (400, 403, 405, 501):
                    error.close()
                    continue
                classification = "NOT_FOUND" if error.code in (404, 410) else "ACCESS_RESTRICTED" if error.code in (401, 403) else "RATE_LIMITED" if error.code == 429 else "UPSTREAM_ERROR" if error.code >= 500 else "HTTP_ERROR"
                result = {"classification": classification, "httpStatus": error.code, "method": method, "finalUrl": error.url}
                error.close()
                break
        return {**result, "elapsedSeconds": round(time.monotonic() - start, 2)}
    except ValueError as error:
        return {"classification": "EXCLUDED", "reason": str(error)}
    except (urllib.error.URLError, TimeoutError, OSError) as error:
        return {"classification": "NETWORK_UNVERIFIED", "reason": str(error)[:250], "elapsedSeconds": round(time.monotonic() - start, 2)}


def main():
    report = json.loads(REPORT.read_text())
    external = [item for item in report["results"] if item["status"].startswith("EXTERNAL_")]
    targets = [item for item in external if item.get("probe", {}).get("classification") == "NETWORK_UNVERIFIED"] if "--retry-unverified" in sys.argv else [item for item in external if not item.get("probe")]
    # Two I/O workers; no response body is read or cached.
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        futures = {pool.submit(probe, item["url"]): item for item in targets}
        for index, future in enumerate(concurrent.futures.as_completed(futures), 1):
            item = futures[future]
            if item.get("probe"):
                item.setdefault("probeHistory", []).append(item["probe"])
            item["probe"] = {"checkedAt": datetime.datetime.now(datetime.UTC).isoformat(), **future.result()}
            item["status"] = "EXTERNAL_CHECKED"
            if index % 10 == 0:
                REPORT.write_text(json.dumps(report, indent=2) + "\n")
                print(f"Checked {index}/{len(targets)} external destinations", flush=True)
    counts = {}
    for item in external:
        if item.get("probe"):
            item["status"] = "EXTERNAL_CHECKED"
        key = item.get("probe", {}).get("classification", "NOT_PROBED")
        counts[key] = counts.get(key, 0) + 1
    report["externalProbe"] = {"checkedAt": datetime.datetime.now(datetime.UTC).isoformat(), "counts": counts, "scope": "Unauthenticated bounded HEAD, GET fallback headers only; reachability does not verify content, ownership, submission, or publication permission."}
    report["counts"] = {}
    for item in report["results"]:
        report["counts"][item["status"]] = report["counts"].get(item["status"], 0) + 1
    REPORT.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report["externalProbe"], indent=2))


if __name__ == "__main__":
    main()
