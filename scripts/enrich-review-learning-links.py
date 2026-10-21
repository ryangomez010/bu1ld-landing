"""Apply authored prerequisite mappings without changing source checks or publication state.

Run with the actual guide slug catalog supplied as JSON on stdin. Missing draft files
are reported and may be safely filled in by rerunning after their authors save them.
"""
import csv
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

root = Path(__file__).resolve().parents[1]
valid = set(json.load(sys.stdin))
mapping = root / "research/paper-reviews/learning-links.tsv"
missing, updated, unchanged, migrated = [], [], [], []
protected = ["sections", "citations", "fullText", "provenance", "approval", "publishedAt", "state", "visibility", "reviewedAt"]
digest = lambda value: hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
rows = list(csv.DictReader(mapping.open(), delimiter="\t"))
assert len(rows) == len({row["arxivId"] for row in rows}) == 100
for row in rows:
    lessons = row["lessons"].split(",")
    assert len(lessons) == len(set(lessons)) >= 2
    assert set(lessons) <= valid, (row["arxivId"], set(lessons) - valid)
    path = root / "research/paper-reviews/reviews" / (row["arxivId"] + ".json")
    if not path.exists():
        missing.append(row["arxivId"])
        continue
    review = json.loads(path.read_text())
    assert review["state"] == "editorial-pending" and review["visibility"] == "private"
    assert review["approval"] is None and review["publishedAt"] is None
    before = digest({key: review[key] for key in protected})
    # Earlier enrichment incorrectly reused the editorial state history for metadata.
    # Migrate the complete original record into a distinct audit collection: do not
    # discard its evidence or relax the workflow's allowed transitions.
    legacy = [entry for entry in review["history"] if entry["evidence"].startswith("Added topic-specific public learning prerequisites:")]
    if review["relatedLessons"] == lessons and not legacy:
        unchanged.append(row["arxivId"])
        continue
    timestamp = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    assert datetime.fromisoformat(timestamp) >= datetime.fromisoformat(review["provenance"]["sourceCheckedAt"])
    audits = review.setdefault("metadataUpdates", [])
    for entry in legacy:
        audits.append({
            "at": timestamp,
            "fields": ["relatedLessons"],
            "evidence": "Corrected metadata bookkeeping: moved the original learning-link update out of editorial transition history. No source check, approval, publication state, or review prose changed.",
            "migratedHistoryEntry": entry,
        })
    if legacy:
        review["history"] = [entry for entry in review["history"] if entry not in legacy]
        migrated.append(row["arxivId"])
    if review["relatedLessons"] != lessons:
        audits.append({
            "at": timestamp,
            "fields": ["relatedLessons"],
            "evidence": "Added topic-specific public learning prerequisites: " + row["rationale"] + " Review prose, source checks, and editorial approval state unchanged.",
        })
    review["relatedLessons"] = lessons
    review["updatedAt"] = timestamp
    assert before == digest({key: review[key] for key in protected})
    path.write_text(json.dumps(review, ensure_ascii=False, indent=2) + "\n")
    updated.append(review["arxivId"])
print(json.dumps({"mapped": len(rows), "updated": len(updated), "unchanged": len(unchanged), "migratedAuditEntries": len(migrated), "missing": missing, "protectedFieldsUnchanged": protected}, indent=2))
