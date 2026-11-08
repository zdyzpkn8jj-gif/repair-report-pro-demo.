#!/usr/bin/env python3
"""Monitor official OEM documentation entry points; stage changes for human review.
No model or procedure is automatically added, deleted, or approved.
"""
import hashlib
import html.parser
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "manual-watch.json"
STATE = ROOT / "manual-watch-state.json"
REPORT = ROOT / "manual-watch-report.md"
MAX_BYTES = 1_500_000
AGENT = "RepairReportProManualMonitor/1.0 (public documentation link verification)"
KEYWORDS = re.compile(r"(manual|instruction|maintenance|installation|iom|download|documentation|technical|pdf)", re.I)
URL_RE = re.compile(r"^(https://|http://)", re.I)

class Anchors(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.href = None
        self.label = []
    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self.href = dict(attrs).get("href", "")
            self.label = []
    def handle_data(self, data):
        if self.href is not None:
            self.label.append(data)
    def handle_endtag(self, tag):
        if tag == "a" and self.href is not None:
            self.links.append((self.href, " ".join(self.label).strip()))
            self.href = None
            self.label = []

def scan(source):
    url = source["url"]
    req = urllib.request.Request(url, headers={"User-Agent": AGENT, "Accept": "text/html,*/*"})
    try:
        with urllib.request.urlopen(req, timeout=22) as response:
            final = response.geturl()
            status = response.status
            content_type = response.headers.get("Content-Type", "")
            raw = response.read(MAX_BYTES + 1)
            if len(raw) > MAX_BYTES:
                return {"status": "too_large", "http": status, "links": [], "url": final}
            if "html" not in content_type.lower():
                return {"status": "non_html", "http": status, "links": [], "url": final}
            parser = Anchors()
            parser.feed(raw.decode("utf-8", errors="replace"))
            host = urllib.parse.urlsplit(url).hostname or ""
            links = []
            for href, text in parser.links:
                absolute = urllib.parse.urljoin(final, href)
                parsed = urllib.parse.urlsplit(absolute)
                # Only watch documents belonging to the manufacturer domain.
                if parsed.scheme not in ("http", "https"):
                    continue
                other_host = (parsed.hostname or "").lower()
                root = ".".join(host.lower().split(".")[-2:])
                if not (other_host == root or other_host.endswith("." + root)):
                    continue
                if KEYWORDS.search(absolute + " " + text):
                    links.append(urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, parsed.query, "")))
            return {"status": "ok", "http": status, "links": sorted(set(links))[:300], "url": final}
    except (urllib.error.URLError, TimeoutError, OSError, ValueError) as error:
        return {"status": "unreachable", "error": str(error)[:250], "links": [], "url": url}

def main():
    data = json.loads(REGISTRY.read_text(encoding="utf-8"))
    old = json.loads(STATE.read_text(encoding="utf-8")) if STATE.exists() else {}
    new = {}
    changes = []
    for source in data["sources"]:
        key = source["manufacturer"]
        result = scan(source)
        previous = old.get(key)
        new[key] = result
        # Never remove a prior link just because a scan failed or a portal temporarily changed.
        if result["status"] != "ok" and previous and previous.get("status") == "ok":
            new[key]["links"] = previous.get("links", [])
            changes.append(f"- {key}: portal could not be verified ({result['status']}). Inspect source: {source['url']}")
        elif result["status"] == "ok" and previous and previous.get("status") == "ok":
            additions = sorted(set(result["links"]) - set(previous.get("links", [])))
            for link in additions[:20]:
                changes.append(f"- {key}: candidate documentation link (not validated): {link}")
            if len(additions) > 20:
                changes.append(f"- {key}: {len(additions)-20} additional candidates; inspect scan state.")
        elif result["status"] != "ok":
            changes.append(f"- {key}: verification incomplete ({result['status']}). Inspect: {source['url']}")
    STATE.write_text(json.dumps(new, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    REPORT.write_text("# OEM manual library review\n\n"
       "Automated discovery is provisional. Review models, correct OEM, document number, revision, and applicability before publishing. "
       "Keep historical manuals discoverable even after a link fails.\n\n"
       + ("\n".join(changes) if changes else "No manual-library changes requiring review detected.")
       + "\n", encoding="utf-8")
    print(f"Checked {len(new)} official manufacturer portals; {len(changes)} review item(s).")
    # Publish review issue only if there are changes (not for the first successful baseline).
    if changes and os.environ.get("GITHUB_TOKEN") and os.environ.get("GITHUB_REPOSITORY"):
        create_review_issue(changes)
    return 0

def create_review_issue(changes):
    repo = os.environ["GITHUB_REPOSITORY"]
    token = os.environ["GITHUB_TOKEN"]
    title = "OEM manual library: review documentation updates"
    api = f"https://api.github.com/repos/{repo}/issues?state=open&per_page=100"
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json",
               "X-GitHub-Api-Version": "2022-11-28", "User-Agent": AGENT}
    try:
        with urllib.request.urlopen(urllib.request.Request(api, headers=headers), timeout=20) as response:
            existing = json.load(response)
        if any(issue.get("title") == title and "pull_request" not in issue for issue in existing):
            print("A manual-review issue is already open; leaving it for human triage.")
            return
        body = ("Automated monitoring flagged possible documentation changes. **Do not auto-approve manuals.**\n\n"
                + "\n".join(changes[:75])
                + "\n\nVerify the manufacturer, model, equipment configuration, manual document ID, revision, and source before adding any entry. "
                "Preserve legacy models and archive links. This monitor is not an exhaustive new-model discovery service.")
        req = urllib.request.Request(f"https://api.github.com/repos/{repo}/issues",
              data=json.dumps({"title": title, "body": body}).encode(),
              headers={**headers, "Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=20) as response:
            print("Created review issue:", json.load(response).get("html_url"))
    except Exception as error:
        print("Could not create issue:", str(error), file=sys.stderr)

if __name__ == "__main__":
    raise SystemExit(main())
