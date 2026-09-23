"""
Builds the single, print-ready PDF of the complete project report.

The document is assembled in the order it should be hard bound:

    FRONT MATTER  (numbered i, ii, iii …)
      1. Title page
      2. Certificate of Originality
      3. Approved Proforma of Project Proposal
      4. Bio-data of the Project Guide
      5. Project Synopsis                      <- the attached proposal document
      6. Acknowledgement
      7. Table of Contents                     <- with real page numbers
      8. List of Figures
      9. List of Tables
     10. List of Abbreviations

    BODY  (numbered 1, 2, 3 …)
     Chapters 1–14, then Appendix A (complete source code)

Why HTML and Chrome rather than Word: it gives an exact page count instead of
an estimate, a contents page with true page numbers, and identical output on
any machine. The pipeline runs in four stages:

    1. render the body, so pagination is known;
    2. read back which page each heading landed on;
    3. render the front matter with that map baked into the contents page;
    4. stamp page numbers and running headers, then merge.

Run:  python3 build_print.py
"""
import io
import os
import pathlib
import re
import subprocess
import sys

BASE = pathlib.Path(__file__).parent
sys.path.insert(0, str(BASE))

from html_kit import HtmlReport, ACCENT, esc      # noqa: E402
import content_front                              # noqa: E402
import content_synopsis                           # noqa: E402
import content_abbrev                             # noqa: E402
import content_ch1_3                              # noqa: E402
import content_ch4_5                              # noqa: E402
import content_ch6_7                              # noqa: E402
import content_ch8                                # noqa: E402
import content_ch9_13                             # noqa: E402
import content_appendix                           # noqa: E402
import content_resources                      # noqa: E402

BODY_MODULES = (content_ch1_3, content_ch4_5, content_ch6_7, content_ch8, content_ch9_13)

BUILD = BASE / '_print_build'
PUBLIC = os.environ.get('IGNOU_REDACT') == '1'
OUT_PDF = BASE / ('BCA_Project_BCSP064_Kailash_Kumar_Jha_'
                  + ('PUBLIC' if PUBLIC else 'PRINT_READY') + '.pdf')

HEADER_TEXT = 'Development of an E-Commerce Web Application for Online Shopping'
FOOTER_LEFT = 'Kailash Kumar Jha  |  Enrolment No. 2400767095'


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def roman(n):
    """Lower-case roman numeral, for the front-matter folios."""
    table = [(1000, 'm'), (900, 'cm'), (500, 'd'), (400, 'cd'), (100, 'c'),
             (90, 'xc'), (50, 'l'), (40, 'xl'), (10, 'x'), (9, 'ix'),
             (5, 'v'), (4, 'iv'), (1, 'i')]
    out = []
    for value, sign in table:
        while n >= value:
            out.append(sign)
            n -= value
    return ''.join(out)


def render_html_to_pdf(html_text, stem):
    BUILD.mkdir(exist_ok=True)
    html_path = BUILD / f'{stem}.html'
    pdf_path = BUILD / f'{stem}.pdf'
    html_path.write_text(html_text, encoding='utf-8')
    subprocess.run(
        ['node', str(BASE / 'render_pdf.mjs'), str(html_path), str(pdf_path)],
        check=True, cwd=str(BASE))
    return pdf_path


def normalise(text):
    return re.sub(r'\s+', ' ', text).strip().lower()


def heading_page_map(pdf_path, headings):
    """Reads the rendered body back and records the page each heading fell on.

    Chrome's text extraction collapses runs of whitespace differently from the
    source, so both sides are normalised before matching. The first page a
    heading appears on wins, which is correct: a heading is printed once, and
    any later mention is a cross-reference in prose.
    """
    from pypdf import PdfReader

    reader = PdfReader(str(pdf_path))
    pages = [normalise(p.extract_text() or '') for p in reader.pages]

    mapping = {}
    for level, text, anchor in headings:
        needle = normalise(text)
        for page_no, page_text in enumerate(pages, start=1):
            if needle and needle in page_text:
                mapping[anchor] = page_no
                break
    return mapping, len(reader.pages)


def toc_html(headings, page_map):
    rows = []
    for level, text, anchor in headings:
        page = page_map.get(anchor)
        rows.append(
            f'<tr class="lvl{level}">'
            f'<td class="txt"><span>{esc(text)}</span><span class="leader"></span></td>'
            f'<td class="num">{page if page else "—"}</td>'
            f'</tr>')
    # A fixed layout is what makes the dot leaders reach the folio column;
    # without it the browser gives the number column more room than it needs.
    return ('<table class="toc">'
            '<colgroup><col style="width:91%"><col style="width:9%"></colgroup>'
            f'{"".join(rows)}</table>')


def stamp(pdf_path, out_path, start_style, header=True):
    """Draws the folio, and a running header on body pages, onto every page."""
    from pypdf import PdfReader, PdfWriter
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4

    reader = PdfReader(str(pdf_path))
    writer = PdfWriter()
    width, height = A4

    for index, page in enumerate(reader.pages, start=1):
        packet = io.BytesIO()
        c = canvas.Canvas(packet, pagesize=A4)

        folio = roman(index) if start_style == 'roman' else str(index)
        c.setFont('Times-Roman', 9.5)
        c.setFillColorRGB(0.27, 0.27, 0.27)
        c.drawCentredString(width / 2, 12 * 2.2, folio)

        if header:
            c.setFont('Times-Italic', 8.5)
            c.setFillColorRGB(0.42, 0.42, 0.42)
            c.drawString(99, height - 40, FOOTER_LEFT)
            c.drawRightString(width - 62, height - 40, HEADER_TEXT)
            c.setStrokeColorRGB(0.80, 0.83, 0.88)
            c.setLineWidth(0.4)
            c.line(99, height - 46, width - 62, height - 46)

        c.save()
        packet.seek(0)
        overlay = PdfReader(packet).pages[0]
        page.merge_page(overlay)
        writer.add_page(page)

    with open(out_path, 'wb') as fh:
        writer.write(fh)
    return len(reader.pages)


# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
def build_body(ref_index=None):
    r = HtmlReport()
    r.ref_index = ref_index or {}
    for module in BODY_MODULES:
        module.build(r)
    lines = content_appendix.build(r)
    return r, lines


def build_front(figures, tables, headings, page_map, ref_index=None):
    r = HtmlReport()
    r.ref_index = ref_index or {}

    content_front.build(r, include_acknowledgement=False)
    content_resources.build(r)      # QR codes, omitted when no URL is set
    content_synopsis.build(r)
    content_front.acknowledgement(r)

    r.page_break()
    r.centered('TABLE OF CONTENTS', 16, bold=True, colour=ACCENT, space_after=6)
    r.rule()
    r.spacer(8)
    r.parts.append(toc_html(headings, page_map))

    r.page_break()
    r.centered('LIST OF FIGURES', 15, bold=True, colour=ACCENT, space_after=6)
    r.rule()
    r.spacer(8)
    r.table(['Figure', 'Caption'], [[a, b] for a, b in figures],
            widths=[0.65, 3.65], font_size=9.5)

    r.page_break()
    r.centered('LIST OF TABLES', 15, bold=True, colour=ACCENT, space_after=6)
    r.rule()
    r.spacer(8)
    r.table(['Table', 'Caption'], [[a, b] for a, b in tables],
            widths=[0.65, 3.65], font_size=9.5)

    content_abbrev.build(r, ACCENT)
    return r


def main():
    css = (BASE / 'print.css').read_text()
    BUILD.mkdir(exist_ok=True)

    # --- 1. Body ---------------------------------------------------------
    # Built twice: the first pass only registers figure and table captions so
    # that the second can resolve every "see Table N" to the right number.
    print('1/4  resolving cross-references, then rendering the body …')
    probe, _ = build_body()
    body, code_lines = build_body(probe.make_ref_index())
    body_pdf = render_html_to_pdf(body.render('Project Report — Body', css), 'body')

    # --- 2. Page map -----------------------------------------------------
    print('2/4  reading back the page each heading landed on …')
    page_map, body_pages = heading_page_map(body_pdf, body.headings)
    resolved = sum(1 for h in body.headings if h[2] in page_map)
    print(f'     {resolved}/{len(body.headings)} headings located across {body_pages} pages')

    # --- 3. Front matter -------------------------------------------------
    print('3/4  rendering the front matter with the real contents page …')
    front = build_front(body.figures, body.tables, body.headings, page_map,
                        body.make_ref_index())
    front_pdf = render_html_to_pdf(front.render('Project Report — Front Matter', css), 'front')

    # --- 4. Stamp and merge ----------------------------------------------
    print('4/4  stamping folios and merging …')
    front_stamped = BUILD / 'front_stamped.pdf'
    body_stamped = BUILD / 'body_stamped.pdf'
    front_pages = stamp(front_pdf, front_stamped, 'roman', header=False)
    stamp(body_pdf, body_stamped, 'arabic', header=True)

    from pypdf import PdfWriter, PdfReader
    writer = PdfWriter()
    for part in (front_stamped, body_stamped):
        for page in PdfReader(str(part)).pages:
            writer.add_page(page)
    writer.add_metadata({
        '/Title': 'Development of an E-Commerce Web Application for Online Shopping',
        '/Author': 'Kailash Kumar Jha (Enrolment No. 2400767095)',
        '/Subject': 'BCA Project Report — BCSP-064 — IGNOU',
        '/Keywords': 'IGNOU, BCA, BCSP-064, MERN, e-commerce, project report',
    })
    with open(OUT_PDF, 'wb') as fh:
        writer.write(fh)

    # Where does the appendix start? Needed to report the body page count.
    appendix_page = next(
        (page_map[a] for lvl, t, a in body.headings
         if t.startswith('APPENDIX A') and a in page_map), body_pages)

    print()
    print(f'  front matter   : {front_pages} pages  (i – {roman(front_pages)})')
    print(f'  report body    : {appendix_page - 1} pages  (1 – {appendix_page - 1})')
    print(f'  appendix A     : {body_pages - appendix_page + 1} pages of source code')
    print(f'  TOTAL          : {front_pages + body_pages} pages')
    print(f'  figures/tables : {len(body.figures)} / {len(body.tables)}')
    print(f'  code listed    : {code_lines:,} lines')
    print(f'  saved          : {OUT_PDF.name}  '
          f'({OUT_PDF.stat().st_size / 1024 / 1024:.1f} MB)')


if __name__ == '__main__':
    main()
