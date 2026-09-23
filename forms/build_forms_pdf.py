"""
Print-ready PDF of the four signature forms, so they can be printed and signed
without printing the whole report.

Run:  python3 build_forms_pdf.py
"""
import os
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).parent
REPORT = HERE.parent / 'report'
sys.path.insert(0, str(REPORT))

from html_kit import HtmlReport, ACCENT   # noqa: E402
import content_front                       # noqa: E402
from build_print import stamp              # noqa: E402
from build_forms import remuneration_bill  # noqa: E402


def main():
    css = (REPORT / 'print.css').read_text()

    r = HtmlReport()
    content_front.build(r)          # title, certificate, proforma, bio-data, acknowledgement
    remuneration_bill(r)

    build = HERE / '_build'
    build.mkdir(exist_ok=True)
    html_path = build / 'forms.html'
    raw_pdf = build / 'forms_raw.pdf'
    html_path.write_text(r.render('BCSP-064 Submission Forms', css), encoding='utf-8')

    subprocess.run(['node', str(REPORT / 'render_pdf.mjs'), str(html_path), str(raw_pdf)],
                   check=True, cwd=str(REPORT))

    public = os.environ.get('IGNOU_REDACT') == '1'
    out = HERE / ('BCSP064_Submission_Forms_'
                  + ('PUBLIC' if public else 'PRINT_READY') + '.pdf')
    pages = stamp(raw_pdf, out, 'arabic', header=False)
    print(f'  {pages} pages  ->  {out.name}  '
          f'({out.stat().st_size / 1024:.0f} KB)')


if __name__ == '__main__':
    main()
