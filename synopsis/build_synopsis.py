"""
Builds the standalone project synopsis, for submission to the Regional Centre
with the project proposal proforma and the guide's bio-data.

Run:  python3 build_synopsis.py
"""
import os
import sys
import pathlib

REPORT = pathlib.Path(__file__).parent.parent / 'report'
sys.path.insert(0, str(REPORT))

from docx_kit import Report          # noqa: E402
import content_synopsis              # noqa: E402


def main():
    r = Report()
    r.add_page_numbers()
    r.add_header_text('Project Synopsis (BCSP-064) — Kailash Kumar Jha — 2400767095')
    content_synopsis.build(r, standalone=True)

    public = os.environ.get('IGNOU_REDACT') == '1'
    out = (pathlib.Path(__file__).parent /
           ('BCA_Project_Synopsis_BCSP064_Kailash_Kumar_Jha'
            + ('_PUBLIC' if public else '') + '.docx'))
    r.save(out)
    print(f'  saved : {out.name}')
    print(f'  size  : {out.stat().st_size / 1024:.0f} KB')


if __name__ == '__main__':
    main()
