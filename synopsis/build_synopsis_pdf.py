"""
Print-ready PDF of the standalone synopsis, for submission with the project
proposal. Uses the same HTML renderer and stylesheet as the main report, so the
two documents are typographically identical.

Run:  python3 build_synopsis_pdf.py
"""
import os
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).parent
REPORT = HERE.parent / 'report'
sys.path.insert(0, str(REPORT))

from html_kit import HtmlReport          # noqa: E402
import content_synopsis                   # noqa: E402
from build_print import stamp             # noqa: E402


def main():
    css = (REPORT / 'print.css').read_text()

    # Two passes: the first registers captions so cross-references resolve.
    probe = HtmlReport()
    content_synopsis.build(probe, standalone=True)

    r = HtmlReport()
    r.ref_index = probe.make_ref_index()
    content_synopsis.build(r, standalone=True)

    build = HERE / '_build'
    build.mkdir(exist_ok=True)
    html_path = build / 'synopsis.html'
    raw_pdf = build / 'synopsis_raw.pdf'
    html_path.write_text(r.render('Project Synopsis', css), encoding='utf-8')

    subprocess.run(['node', str(REPORT / 'render_pdf.mjs'), str(html_path), str(raw_pdf)],
                   check=True, cwd=str(REPORT))

    public = os.environ.get('IGNOU_REDACT') == '1'
    out = HERE / ('BCA_Project_Synopsis_BCSP064_Kailash_Kumar_Jha_'
                  + ('PUBLIC' if public else 'PRINT_READY') + '.pdf')
    pages = stamp(raw_pdf, out, 'arabic', header=False)
    print(f'  {pages} pages  ->  {out.name}  '
          f'({out.stat().st_size / 1024 / 1024:.1f} MB)')


if __name__ == '__main__':
    main()
