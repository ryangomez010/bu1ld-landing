#!/usr/bin/env python3
"""Save an intentionally source-checked AI editorial draft; never approve/publish.

Input: JSON containing arxivId, summary, topics, sections (eight named sections),
citations (id/url/locator/supports), completenessNotes, sourceCheckMethod,
appendicesInspected and figuresInspected. The two inspection flags must be true
only after actual reading/inspection. Merely downloading is not sufficient.
"""
import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SECTIONS = ('question', 'contribution', 'method', 'experiments', 'results', 'analysis', 'reproducibility', 'reading')


def save(content):
    manifest = json.loads((ROOT / 'research/paper-reviews/manifest.json').read_text())
    record = next(p for p in manifest['papers'] if p['arxivId'] == content['arxivId'])
    source = record.get('fullText')
    if not source or source.get('fetchStatus') != 'fetched':
        raise ValueError('No verified full-text fetch')
    text = (ROOT / source['localPath']).read_text()
    if hashlib.sha256(text.encode()).hexdigest() != source['textSha256']:
        raise ValueError('Source cache changed since retrieval')
    if any(not content['sections'].get(section, '').strip() for section in SECTIONS):
        raise ValueError('All eight review sections are required')
    words = len(' '.join(content['sections'].values()).split())
    if words < 700:
        raise ValueError(f'Only {words} words; substantive 700-word floor unmet')
    if content.get('appendicesInspected') is not True or content.get('figuresInspected') is not True:
        raise ValueError('Full reading and figure/appendix inspection must be explicitly asserted by the actual reviewer')
    if not content.get('completenessNotes') or not content.get('sourceCheckMethod'):
        raise ValueError('Actual inspection and source-check method are required')
    for citation in content['citations']:
        if 'arxiv.org/html/' in citation['url'] and '#' in citation['url']:
            anchor = citation['url'].split('#', 1)[1]
            if '[#' + anchor + ']' not in text:
                raise ValueError('Source anchor not found: ' + anchor)
        if not citation['locator'] or not citation['supports']:
            raise ValueError('Citations need a locator and supported claim')
    now = dt.datetime.now(dt.timezone.utc).isoformat().replace('+00:00', 'Z')
    slug = re.sub(r'[^a-z0-9]+', '-', record['title'].lower()).strip('-')
    history = [record['history'][0]] + [{'state': state, 'at': now, 'evidence': content['sourceCheckMethod'] if state == 'source-checked' else {'full-text-read': content['completenessNotes'], 'drafted': f'{words} original review words; AI-assisted', 'editorial-pending': 'Human editorial approval and publication authority not recorded'}[state]} for state in ('full-text-read', 'drafted', 'source-checked', 'editorial-pending')]
    review = {
        'id': record['id'], 'slug': slug, 'title': record['title'], 'authors': record['authors'],
        'arxivId': record['arxivId'], 'doi': record['doi'], 'primaryUrl': record['primaryUrl'],
        'firstReleaseAt': record['firstReleaseAt'], 'revisionAt': record['revisionAt'], 'version': record['version'],
        'retrievedAt': source['retrievedAt'], 'reviewedAt': now, 'updatedAt': now,
        'topics': content['topics'], 'summary': content['summary'], 'state': 'editorial-pending', 'visibility': 'private',
        'venue': {'label': 'arXiv preprint; no proceedings status independently verified', 'verification': 'preprint'},
        'license': record['license'],
        'fullText': {**{key: source[key] for key in ('url', 'sha256')}, 'readAt': now, 'appendicesInspected': True, 'figuresInspected': True, 'completenessNotes': content['completenessNotes']},
        'sections': content['sections'], 'citations': content['citations'],
        'relatedLessons': content.get('relatedLessons', []), 'relatedProjects': content.get('relatedProjects', []),
        'provenance': {'aiAssisted': True, 'disclosure': 'AI-assisted draft and source check. Human editorial approval pending. BU1LD has not independently reproduced these experiments.', 'independentlyReproduced': False, 'sourceCheckedAt': now, 'sourceCheckMethod': content['sourceCheckMethod']},
        'approval': None, 'publishedAt': None, 'history': history,
    }
    target = ROOT / 'research/paper-reviews/reviews' / (record['arxivId'].replace('/', '-') + '.json')
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        raise ValueError('Existing review preserved; edit explicitly rather than overwrite')
    target.write_text(json.dumps(review, indent=2, ensure_ascii=False) + '\n')
    print(f'{record["arxivId"]}: saved {words} words, editorial-pending')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python3 scripts/paper-review-save.py CONTENT.json')
    save(json.loads(Path(sys.argv[1]).read_text()))
