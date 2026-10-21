#!/usr/bin/env python3
"""Deterministic LOCAL draft export. No network, database, approval, or publication."""
import hashlib
from html import escape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
SECTIONS = {
    'question': 'Research question', 'contribution': 'Contribution', 'method': 'Method',
    'experiments': 'Experiments', 'results': 'Results', 'analysis': 'Analysis',
    'reproducibility': 'Reproducibility', 'reading': 'Reading guide',
}
DESTINATION = ROOT / 'research/paper-reviews/exports/platform-drafts.json'
PREVIEW_DESTINATION = DESTINATION.with_name('editorial-preview.html')

def load_reviews():
    reviews = []
    for path in sorted((ROOT / 'research/paper-reviews/reviews').glob('*.json')):
        review = json.loads(path.read_text())
        if review['state'] != 'editorial-pending' or review['visibility'] != 'private':
            raise ValueError(f'{path.name}: only pending private reviews may be exported')
        if review.get('approval') or review.get('publishedAt'):
            raise ValueError(f'{path.name}: unexpected publication evidence')
        reviews.append((path, review))
    return reviews

def export(reviews=None):
    records = []
    for path, review in load_reviews() if reviews is None else reviews:
        body = '\n\n'.join(f'## {title}\n\n{review["sections"][key]}' for key, title in SECTIONS.items())
        links = '\n'.join(f'- [{i + 1}. {c["locator"].replace("[", "(").replace("]", ")")}]({c["url"]})' for i, c in enumerate(review['citations']))
        body += '\n\n### Sources\n\n' + links
        body += '\n\nAI-assisted review. BU1LD has not independently reproduced these experiments.'
        if not 700 <= len(body.split()) <= 1200:
            raise ValueError(f'{path.name}: exported body exceeds hosted word-count gate; do not truncate silently')
        records.append({
            'sourceReviewPath': str(path.relative_to(ROOT)),
            'sourceReviewSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'paperDraft': {
                'slug': review['slug'], 'title': review['title'], 'authors': ', '.join(review['authors']),
                'year': int(review['firstReleaseAt'][:4]), 'arxiv_url': review['primaryUrl'],
                'source_url': review['primaryUrl'], 'tags': review['topics'], 'is_classic': False,
                'summary': review['summary'], 'editorial_summary': review['summary'], 'review_body': body,
                'published': False, 'review_status': 'draft', 'content_kind': 'review', 'venue': review['venue']['label'],
            },
            'sourceEvidenceReference': {
                'full_text_url': review['fullText']['url'], 'source_sha256': review['fullText']['sha256'],
                'source_version': review['version'], 'license': review['license']['url'],
                'notes': review['provenance']['sourceCheckMethod'], 'ai_disclosure': review['provenance']['disclosure'],
                'citations': [{'url': c['url'], 'locator': c['locator'], 'claim': c['supports']} for c in review['citations']],
            },
            'humanEditorialRequired': True,
            'relatedLessons': review.get('relatedLessons', []),
        })
    return {'schemaVersion': 1, 'purpose': 'Local review and private-draft mapping only; no external writes or human attestations.', 'count': len(records), 'records': records}

def text(value):
    return escape(str(value), quote=True)

def link(url, label):
    parsed = urlsplit(url)
    if parsed.scheme not in ('https', 'http') or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError('Preview source links must use HTTP(S) with a hostname and no credentials')
    if any(character.isspace() or ord(character) < 32 for character in url):
        raise ValueError('Preview source links cannot contain whitespace or control characters')
    return f'<a href="{text(url)}" rel="noreferrer noopener">{text(label)}</a>'

def paragraphs(value):
    # Source prose is text, never interpreted as Markdown or HTML.
    return '\n'.join(f'<p>{text(part)}</p>' for part in re.split(r'\n\s*\n', value.strip()) if part)

def preview(reviews):
    count = len(reviews)
    parts = ['''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex, nofollow">
<title>BU1LD — Private editorial review preview</title>
<style>
:root { color-scheme: light; font-family: Georgia, serif; color: #222c34; background: #f6f4ee; }
* { box-sizing: border-box; }
body { margin: 0 auto; max-width: 78rem; padding: 2rem 1.25rem 5rem; line-height: 1.65; }
h1, h2, h3, summary, .label { font-family: system-ui, sans-serif; line-height: 1.3; }
h1 { font-size: clamp(1.8rem, 4vw, 3rem); margin: .5rem 0 1rem; }
h2 { font-size: 1.5rem; } h3 { font-size: 1.12rem; margin-top: 2rem; }
a { color: #164f76; text-decoration-thickness: .08em; text-underline-offset: .15em; overflow-wrap: anywhere; }
a:focus-visible, summary:focus-visible { outline: 3px solid #b77b12; outline-offset: 4px; }
.label { color: #775512; font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.notice { border-left: 4px solid #b77b12; background: #fff9e8; padding: 1rem 1.25rem; }
.intro { max-width: 70ch; } .muted { color: #58636c; }
.index { columns: 2 28rem; padding-left: 1.6rem; }
.index li { break-inside: avoid; padding: .3rem 0 .3rem .25rem; }
details.review { margin: 1rem 0; border: 1px solid #c9cfcf; background: #fff; border-radius: .35rem; scroll-margin-top: 1rem; }
summary { cursor: pointer; padding: 1.15rem; font-weight: 650; }
summary:hover { background: #f0f5f6; } .number { color: #697781; font-variant-numeric: tabular-nums; }
article { max-width: 78ch; margin: 0 auto; padding: 0 1.25rem 1.5rem; }
article p { white-space: pre-wrap; overflow-wrap: anywhere; }
dl { display: grid; grid-template-columns: minmax(7rem, 1fr) minmax(0, 3fr); gap: .5rem 1rem; font-family: system-ui, sans-serif; font-size: .88rem; }
dt { font-weight: 650; } dd { margin: 0; overflow-wrap: anywhere; }
code { font-size: .85em; overflow-wrap: anywhere; }
.sources li { margin: .7rem 0; } .sources p { margin: .2rem 0; }
footer { border-top: 1px solid #c9cfcf; margin-top: 2rem; padding-top: 1rem; font-size: .9rem; }
@media (max-width: 34rem) { dl { display: block; } dd { margin: .15rem 0 .7rem; } article { padding-inline: 1rem; } }
@media print { body { max-width: none; background: white; } details { break-inside: auto; } summary { break-after: avoid; } }
</style>
</head>
<body>
<header id="top">
<p class="label">BU1LD · Private editorial workspace</p>
<h1>Paper review drafts</h1>''',
        f'<p class="intro">{count} original AI-assisted reviews, presented for human editorial review. This file is an offline preview of the private source corpus.</p>',
        '<p class="notice"><strong>All drafts are editorial-pending and private.</strong> No human approval or publication is recorded. Source checking does not establish independent reproduction, peer review, or scientific validation.</p>',
        '<p class="intro muted">Use your browser’s Find command to locate a title in the index, follow its link, then expand the review. Every review includes its complete eight-section text and source locators. Source links open only when you choose to follow them; the preview itself loads no external resources and runs no scripts.</p>',
        '</header><nav aria-label="Review title index"><h2>Title index</h2><ol class="index">',
    ]
    for index, (_, review) in enumerate(reviews, 1):
        parts.append(f'<li><a href="#review-{index:03d}">{text(review["title"])}</a></li>')
    parts.append('</ol></nav><main aria-label="Private paper review drafts">')
    for index, (path, review) in enumerate(reviews, 1):
        checksum = hashlib.sha256(path.read_bytes()).hexdigest()
        parts.extend([
            f'<details class="review" id="review-{index:03d}">',
            f'<summary><span class="number">{index:03d} / {count:03d}</span> · {text(review["title"])}</summary>',
            f'<article aria-labelledby="review-title-{index:03d}">',
            '<p class="label">Private · Editorial pending · Human approval required</p>',
            f'<h2 id="review-title-{index:03d}">{text(review["title"])}</h2>',
            f'<p>{text(", ".join(review["authors"]))}</p>',
            '<dl>',
        ])
        metadata = [
            ('Paper identifier', review['id']), ('Version', review['version']),
            ('First released', review['firstReleaseAt']), ('Source revision', review['revisionAt']),
            ('Retrieved', review['retrievedAt']), ('AI source check', review['provenance']['sourceCheckedAt']),
            ('Draft updated', review['updatedAt']), ('Venue', review['venue']['label']),
            ('Topics', ', '.join(review['topics'])), ('Source SHA256', review['fullText']['sha256']),
            ('Private source file', str(path.relative_to(ROOT))), ('Draft SHA256', checksum),
        ]
        parts.extend(f'<dt>{text(label)}</dt><dd>{text(value)}</dd>' for label, value in metadata)
        parts.extend([
            f'<dt>Primary source</dt><dd>{link(review["primaryUrl"], review["primaryUrl"])}</dd>',
            f'<dt>Full text</dt><dd>{link(review["fullText"]["url"], review["fullText"]["url"])}</dd>',
            f'<dt>Recorded license</dt><dd>{link(review["license"]["url"], review["license"]["url"])}</dd>',
            '</dl>',
            f'<p class="notice">{text(review["provenance"]["disclosure"])}</p>',
            '<h3>Editorial summary</h3>', paragraphs(review['summary']),
        ])
        for key, title in SECTIONS.items():
            parts.extend([f'<section class="review-section"><h3>{text(title)}</h3>', paragraphs(review['sections'][key]), '</section>'])
        parts.append('<section><h3>Claim-source locators</h3><ol class="sources">')
        for citation in review['citations']:
            parts.append(f'<li>{link(citation["url"], citation["locator"])}<p>{text(citation["supports"])}</p></li>')
        parts.extend([
            '</ol></section><section><h3>Source-reading record</h3>',
            paragraphs(review['provenance']['sourceCheckMethod']),
            paragraphs(review['fullText']['completenessNotes']),
            '<p class="muted">This is the AI-assisted source-reading record. The human editor must independently check the evidence and perform the explicit source-check, approval, and publication steps in the hosted workflow.</p>',
            '</section>',
        ])
        if review.get('relatedLessons'):
            parts.extend(['<h3>Related lesson references</h3>', f'<p>{text(", ".join(review["relatedLessons"]))}</p>'])
        parts.extend(['<p><a href="#top">Back to title index</a></p></article></details>'])
    parts.extend([
        '</main><footer><p>Generated deterministically by scripts/paper-export-drafts.py from the private JSON reviews. The accompanying platform-drafts.json maps the same drafts to hosted fields. This preview does not import, upload, approve, or publish any review.</p></footer>',
        '</body></html>',
    ])
    return '\n'.join(parts) + '\n'

class PreviewStructure(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.counts = {}
        self.ids = set()
        self.fragments = []
        self.stack = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        allowed = {'html', 'head', 'meta', 'title', 'style', 'body', 'header', 'h1', 'p', 'strong', 'nav', 'h2', 'ol', 'li', 'a', 'main', 'details', 'summary', 'span', 'article', 'dl', 'dt', 'dd', 'h3', 'section', 'footer'}
        if tag not in allowed or any(key.startswith('on') or key in ('src', 'srcset') for key in attrs):
            raise ValueError(f'Unsafe preview element or attribute: {tag}')
        if tag != 'meta':
            self.stack.append(tag)
        self.counts[tag] = self.counts.get(tag, 0) + 1
        if attrs.get('class') == 'review-section':
            self.counts['review-section'] = self.counts.get('review-section', 0) + 1
        if 'id' in attrs:
            if attrs['id'] in self.ids:
                raise ValueError('Duplicate preview anchor')
            self.ids.add(attrs['id'])
        if 'href' in attrs:
            if attrs['href'].startswith('#'):
                self.fragments.append(attrs['href'][1:])
            else:
                link(attrs['href'], '')

    def handle_endtag(self, tag):
        if not self.stack or self.stack.pop() != tag:
            raise ValueError(f'Misnested preview element: {tag}')

def verify_preview(document, count):
    parser = PreviewStructure()
    parser.feed(document)
    parser.close()
    if parser.stack or any(fragment not in parser.ids for fragment in parser.fragments):
        raise ValueError('Unclosed preview elements or missing anchors')
    for tag, expected in [('html', 1), ('head', 1), ('body', 1), ('main', 1), ('details', count), ('article', count), ('review-section', 8 * count)]:
        if parser.counts.get(tag, 0) != expected:
            raise ValueError(f'Unexpected {tag} count in preview')
    if text('<script>"&</script>') != '&lt;script&gt;&quot;&amp;&lt;/script&gt;':
        raise ValueError('Preview escaping failed')

if __name__ == '__main__':
    reviews = load_reviews()
    data = json.dumps(export(reviews), indent=2, ensure_ascii=False) + '\n'
    document = preview(reviews)
    verify_preview(document, len(reviews))
    if '--check' in sys.argv:
        for destination, expected in [(DESTINATION, data), (PREVIEW_DESTINATION, document)]:
            if not destination.exists() or destination.read_text() != expected:
                raise SystemExit(f'{destination.name} is missing or stale; run scripts/paper-export-drafts.py locally.')
    else:
        DESTINATION.parent.mkdir(parents=True, exist_ok=True)
        DESTINATION.write_text(data)
        PREVIEW_DESTINATION.write_text(document)
    print(f'PASS {len(reviews)} local private draft mappings and escaped offline preview; no publication or human approval recorded.')
