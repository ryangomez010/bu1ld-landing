#!/usr/bin/env python3
"""Offline tests for source identity, network boundaries and retry behavior."""
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import Mock, patch
import urllib.error

spec = importlib.util.spec_from_file_location("discovery", Path(__file__).with_name("paper-discover.py"))
d = importlib.util.module_from_spec(spec)
spec.loader.exec_module(d)

class Response:
    headers = {"Content-Type": "text/html"}
    def __enter__(self): return self
    def __exit__(self, *args): return False
    def geturl(self): return "https://arxiv.org/html/2610.22372v1"
    def read(self, size): return b"<article>source</article>"

class DiscoveryTests(unittest.TestCase):
    def test_identity_versions_and_doi(self):
        self.assertEqual(d.normalize_id("https://arxiv.org/pdf/2610.22372v3.pdf"), "2610.22372")
        self.assertEqual(d.normalize_doi("https://doi.org/10.1000/ABC"), "10.1000/abc")
        with self.assertRaises(ValueError): d.normalize_id("../../private")

    def test_source_host_credentials_and_private_dns_are_denied(self):
        for url in ["http://arxiv.org/abs/1", "https://evil.example/x", "https://u:p@arxiv.org/x", "https://arxiv.org:444/x"]:
            with self.assertRaises(ValueError): d.safe_url(url)
        with patch.object(d.socket, "getaddrinfo", return_value=[(None,None,None,None,("127.0.0.1",443))]):
            with self.assertRaises(ValueError): d.safe_url("https://arxiv.org/x")

    def test_redirect_cannot_leave_official_hosts(self):
        with self.assertRaises(ValueError):
            d.Redirects().redirect_request(None, None, 302, "redirect", {}, "https://example.com/private")

    def test_retry_after_is_bounded_and_transient_failure_recovers(self):
        client=d.Client(delay=0,retries=3)
        client.opener=Mock()
        error=urllib.error.HTTPError("https://arxiv.org/x",429,"rate limit",{"Retry-After":"9999"},None)
        client.opener.open.side_effect=[error,Response()]
        with patch.object(d,"safe_url",side_effect=lambda u:u), patch.object(d.time,"sleep") as sleep:
            body,_,_=client.fetch("https://arxiv.org/x")
        self.assertEqual(body,b"<article>source</article>")
        self.assertEqual(client.opener.open.call_count,2)
        self.assertIn(unittest.mock.call(60),sleep.call_args_list)

    def test_permanent_failure_is_not_retried(self):
        client=d.Client(delay=0,retries=3);client.opener=Mock()
        client.opener.open.side_effect=urllib.error.HTTPError("https://arxiv.org/x",404,"missing",{},None)
        with patch.object(d,"safe_url",side_effect=lambda u:u), patch.object(d.time,"sleep"):
            with self.assertRaises(urllib.error.HTTPError): client.fetch("https://arxiv.org/x")
        self.assertEqual(client.opener.open.call_count,1)

    def test_exhausted_transient_failure_remains_a_failure(self):
        client=d.Client(delay=0,retries=3);client.opener=Mock()
        client.opener.open.side_effect=urllib.error.URLError("offline")
        with patch.object(d,"safe_url",side_effect=lambda u:u), patch.object(d.time,"sleep"):
            with self.assertRaises(urllib.error.URLError): client.fetch("https://arxiv.org/x")
        self.assertEqual(client.opener.open.call_count,3)

    def test_text_parser_keeps_locators_without_scripts(self):
        parser=d.TextParser();parser.feed('<article id="S1"><p>Evidence</p><script>malicious()</script><p>More evidence</p></article>')
        self.assertIn('[#S1]',parser.text());self.assertIn('More evidence',parser.text())
        self.assertNotIn('malicious',parser.text())

    def test_feed_uses_first_release_not_revision_and_never_implies_reading(self):
        source=b'''<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>http://arxiv.org/abs/2501.12345v3</id><title>Example</title><published>2025-01-01T12:00:00Z</published><updated>2026-10-15T12:00:00Z</updated><author><name>A. Researcher</name></author><category term="cs.LG"/></entry></feed>'''
        record=d.parse_feed(source)[0]
        self.assertEqual(record['version'],'v3');self.assertEqual(record['firstReleaseAt'],'2025-01-01T12:00:00Z')
        self.assertIsNone(record['fullText']);self.assertEqual(record['state'],'metadata-verified')

if __name__ == '__main__': unittest.main()
