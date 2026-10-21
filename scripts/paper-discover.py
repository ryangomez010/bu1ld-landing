#!/usr/bin/env python3
"""Bounded arXiv discovery. Fetching never asserts reading or editorial approval.

Use: python3 scripts/paper-discover.py --limit 120 --fetch-limit 100
Network access is limited to HTTPS arxiv.org/export.arxiv.org and redirects to
those same public hosts. Responses are capped; downloaded code is never executed.
The local source cache is excluded from version control and all public builds.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
from html.parser import HTMLParser
import ipaddress
import json
from pathlib import Path
import re
import socket
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "research/paper-reviews"
ALLOWED = {"arxiv.org", "export.arxiv.org"}
ATOM = {"a": "http://www.w3.org/2005/Atom", "x": "http://arxiv.org/schemas/atom"}
USER_AGENT = "BU1LD-Research-Library/1.0 (editorial candidate discovery; no automatic publication)"


def now():
    return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")
    temp.replace(path)


def normalize_id(value):
    value = re.sub(r"^https?://(?:export\.)?arxiv\.org/(?:abs|pdf|html)/", "", value.strip())
    value = re.sub(r"\.pdf$", "", value)
    value = re.sub(r"v\d+$", "", value)
    if not re.fullmatch(r"\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?/\d{7}", value):
        raise ValueError("Invalid arXiv identity")
    return value


def normalize_doi(value):
    value = re.sub(r"^https?://(?:dx\.)?doi\.org/|^doi:\s*", "", value.strip(), flags=re.I).lower()
    if value and not re.fullmatch(r"10\.\d{4,9}/\S+", value):
        raise ValueError("Invalid DOI")
    return value or None


def safe_url(url):
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != "https" or parsed.hostname not in ALLOWED or parsed.username or parsed.password or parsed.port not in (None, 443):
        raise ValueError("Only official HTTPS arXiv endpoints are permitted")
    for item in socket.getaddrinfo(parsed.hostname, 443, type=socket.SOCK_STREAM):
        address = ipaddress.ip_address(item[4][0])
        if not address.is_global:
            raise ValueError("Source resolved to a non-public address")
    return url


class Redirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        safe_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class Client:
    def __init__(self, delay=3.1, retries=3):
        self.delay, self.retries, self.last = delay, retries, 0.0
        self.opener = urllib.request.build_opener(Redirects())

    def fetch(self, url):
        safe_url(url)
        for attempt in range(self.retries):
            time.sleep(max(0, self.delay - (time.monotonic() - self.last)))
            self.last = time.monotonic()
            try:
                req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
                with self.opener.open(req, timeout=35) as response:
                    safe_url(response.geturl())
                    content = response.read(12_000_001)
                    if len(content) > 12_000_000:
                        raise ValueError("Response exceeds 12 MB editorial source limit")
                    return content, response.geturl(), response.headers.get("Content-Type", "")
            except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
                retryable = not isinstance(exc, urllib.error.HTTPError) or exc.code in (429, 500, 502, 503, 504)
                if not retryable or attempt + 1 == self.retries:
                    raise
                delay = min(30, 3 * 2 ** attempt)
                if isinstance(exc, urllib.error.HTTPError):
                    retry_after = exc.headers.get("Retry-After", "")
                    if retry_after.isdigit():
                        delay = min(60, max(delay, int(retry_after)))
                time.sleep(delay)


class TextParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts, self.licenses, self.links = [], [], []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ("script", "style", "nav"):
            self.skip += 1
        if self.skip:
            return
        if tag in ("p", "div", "section", "article", "h1", "h2", "h3", "h4", "table", "tr", "li", "figure", "figcaption"):
            self.parts.append("\n")
        if attrs.get("id"):
            self.parts.append(" [#" + attrs["id"] + "] ")
        if tag == "a" and attrs.get("href"):
            href = attrs["href"]
            self.links.append(href)
            if "creativecommons.org/licenses/" in href or "arxiv.org/licenses/" in href:
                self.licenses.append(href)
        if tag in ("img", "math") and attrs.get("alttext", attrs.get("alt")):
            self.parts.append(attrs.get("alttext", attrs.get("alt")))

    def handle_endtag(self, tag):
        if tag in ("script", "style", "nav") and self.skip:
            self.skip -= 1
        if tag in ("p", "section", "h1", "h2", "h3", "h4", "tr", "li", "figcaption"):
            self.parts.append("\n")

    def handle_data(self, data):
        if not self.skip:
            self.parts.append(data)

    def text(self):
        lines = [re.sub(r"\s+", " ", line).strip() for line in "".join(self.parts).splitlines()]
        return "\n".join(line for line in lines if line)


def parse_feed(data):
    feed = ET.fromstring(data)
    records = []
    for entry in feed.findall("a:entry", ATOM):
        def txt(key):
            return " ".join((entry.findtext(key, "", ATOM)).split())
        url = txt("a:id").replace("http://", "https://")
        if "api/errors" in url:
            raise ValueError(txt("a:summary"))
        identity = normalize_id(url)
        version = re.search(r"v(\d+)$", url)
        records.append({
            "id": "arxiv:" + identity, "arxivId": identity,
            "doi": normalize_doi(txt("x:doi")), "title": txt("a:title"),
            "authors": [" ".join(a.findtext("a:name", "", ATOM).split()) for a in entry.findall("a:author", ATOM)],
            "firstReleaseAt": txt("a:published"), "revisionAt": txt("a:updated"),
            "version": "v" + (version.group(1) if version else "1"),
            "primaryUrl": "https://arxiv.org/abs/" + identity,
            "sourceUrl": url, "categories": [c.attrib["term"] for c in entry.findall("a:category", ATOM)],
            "venue": {"kind": "preprint", "verification": "not-independently-verified", "authorComment": txt("x:comment"), "journalReference": txt("x:journal_ref") or None},
            "metadataRetrievedAt": now(), "state": "metadata-verified", "fullText": None,
            "license": {"url": None, "reuseNotes": "Unverified; no figures or full paper text may be republished."},
            "officialCodeUrl": None,
            "history": [{"state": "metadata-verified", "at": now(), "evidence": "Official arXiv Atom entry"}],
        })
    return records


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=120)
    parser.add_argument("--fetch-limit", type=int, default=0)
    parser.add_argument("--window", type=int, choices=(30, 60, 90), default=30)
    parser.add_argument("--as-of", default=dt.datetime.now(dt.timezone.utc).date().isoformat())
    parser.add_argument("--resume", action="store_true")
    args = parser.parse_args()
    if not 1 <= args.limit <= 300 or not 0 <= args.fetch_limit <= 300:
        parser.error("Limits must be bounded to 300")
    day = dt.date.fromisoformat(args.as_of)
    end = min(dt.datetime.combine(day + dt.timedelta(days=1), dt.time(), dt.timezone.utc), dt.datetime.now(dt.timezone.utc))
    begin = end - dt.timedelta(days=args.window)
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "manifest.json"
    manifest = json.loads(path.read_text()) if path.exists() else {"schemaVersion": 1, "papers": [], "failures": [], "runs": []}
    client = Client()
    run = {"startedAt": now(), "asOf": args.as_of, "windowDays": args.window, "cutoffStart": begin.isoformat(), "cutoffEnd": end.isoformat(), "status": "running", "queries": [], "discovered": 0, "fetched": 0}
    manifest["runs"].append(run)
    manifest["selection"] = {"asOf": args.as_of, "windowDays": args.window, "scope": "Official arXiv cs.LG, cs.AI, cs.CL, cs.CV, cs.RO, stat.ML; primary category and cross-list results", "criteria": "New underlying ML work first released in the discovery window, with accessible full text. Metadata-only and unread fetched papers do not count as reviews.", "exclusions": "Older first releases, duplicate arXiv/DOI identities, unavailable full text, non-ML records, and unapproved editorial drafts are excluded from the qualified public count.", "expanded": args.window > 30}
    write_json(path, manifest)
    if not args.resume:
        categories = "(cat:cs.LG OR cat:cs.AI OR cat:cs.CL OR cat:cs.CV OR cat:cs.RO OR cat:stat.ML)"
        query = f"{categories} AND submittedDate:[{begin:%Y%m%d%H%M} TO {end:%Y%m%d%H%M}]"
        url = "https://export.arxiv.org/api/query?" + urllib.parse.urlencode({"search_query": query, "start": 0, "max_results": args.limit, "sortBy": "submittedDate", "sortOrder": "descending"})
        run["queries"].append(url)
        try:
            data, final_url, content_type = client.fetch(url)
            records = parse_feed(data)
            existing = {r["id"]: r for r in manifest["papers"]}
            dois = {r["doi"]: r["id"] for r in manifest["papers"] if r.get("doi")}
            for record in records:
                released = dt.datetime.fromisoformat(record["firstReleaseAt"].replace("Z", "+00:00"))
                if released < begin or released > end:
                    continue
                if record["doi"] and record["doi"] in dois and dois[record["doi"]] != record["id"]:
                    manifest["failures"].append({"at": now(), "id": record["id"], "reason": "duplicate-doi", "canonicalId": dois[record["doi"]]})
                    continue
                previous = existing.get(record["id"])
                if previous:
                    if previous["version"] != record["version"]:
                        previous["updateFlag"] = {"detectedAt": now(), "version": record["version"], "revisionAt": record["revisionAt"]}
                else:
                    existing[record["id"]] = record
                    if record["doi"]:
                        dois[record["doi"]] = record["id"]
            manifest["papers"] = sorted(existing.values(), key=lambda x: x["firstReleaseAt"], reverse=True)
            run["discovered"] = len(records)
            manifest["lastSuccessfulDiscoveryAt"] = now()
            write_json(path, manifest)
            print(f"Discovered {len(records)} entries; {len(existing)} unique eligible candidates", flush=True)
        except Exception as exc:
            manifest["failures"].append({"at": now(), "url": url, "stage": "discovery", "reason": str(exc)})
            run["status"] = "failed"
            write_json(path, manifest)
            raise
    cache = OUT / "source-cache"
    cache.mkdir(exist_ok=True)
    attempted = 0
    for record in manifest["papers"]:
        if attempted >= args.fetch_limit:
            break
        if record.get("fullText", {}).get("fetchStatus") == "fetched" if record.get("fullText") else False:
            continue
        attempted += 1
        versioned = record["arxivId"] + record["version"]
        url = "https://arxiv.org/html/" + versioned
        try:
            data, final_url, content_type = client.fetch(url)
            if "html" not in content_type:
                raise ValueError("Expected HTML source")
            source = TextParser()
            source.feed(data.decode("utf-8", errors="replace"))
            text = source.text()
            if len(text.split()) < 1500:
                raise ValueError("HTML extraction too short for full-text access evidence")
            cache_file = cache / (versioned.replace("/", "-") + ".txt")
            cache_file.write_text(text)
            record["fullText"] = {"fetchStatus": "fetched", "url": final_url, "retrievedAt": now(), "sha256": hashlib.sha256(data).hexdigest(), "textSha256": hashlib.sha256(text.encode()).hexdigest(), "localPath": str(cache_file.relative_to(ROOT)), "words": len(text.split()), "readAt": None, "figuresInspected": False, "appendicesInspected": False, "completeness": "Requires reader inspection; successful extraction is not full-text-read."}
            record["sourceLinkedCodeCandidates"] = sorted({x for x in source.links if x.startswith("https://github.com/")})
            # License is read from the abstract page, never inferred from hosting.
            abstract, _, _ = client.fetch(record["primaryUrl"] + record["version"])
            metadata = TextParser()
            metadata.feed(abstract.decode("utf-8", errors="replace"))
            if metadata.licenses:
                record["license"] = {"url": metadata.licenses[0], "reuseNotes": "Source license recorded; reviews are original analysis. No source figures or full text are republished."}
            run["fetched"] += 1
        except Exception as exc:
            record["fullText"] = {"fetchStatus": "failed", "url": url, "attemptedAt": now(), "error": str(exc)}
            manifest["failures"].append({"at": now(), "id": record["id"], "url": url, "stage": "full-text-fetch", "reason": str(exc)})
        write_json(path, manifest)
        print(f"{attempted}: {record['arxivId']} {record['fullText']['fetchStatus']}", flush=True)
    run["status"] = "completed"
    run["finishedAt"] = now()
    if run["fetched"]:
        manifest["lastSuccessfulFullTextFetchAt"] = now()
    write_json(path, manifest)


if __name__ == "__main__":
    main()
