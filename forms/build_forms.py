"""
Builds the four signature forms required by the BCSP-064 guidelines as a
separate printable document, so they can be signed and dated without printing
the whole report:

  1. Proforma of BCA Project Proposal (Section II)
  2. Certificate of Originality        (Section IX)
  3. Bio-data of the Project Guide
  4. Remuneration Bill for the Project Guide (Section VIII) — note that the
     guidelines require this to be submitted in a SEPARATE envelope alongside
     the project report, not bound into it.

Run:  python3 build_forms.py
"""
import os
import sys
import pathlib

REPORT = pathlib.Path(__file__).parent.parent / 'report'
sys.path.insert(0, str(REPORT))

from docx_kit import Report, ACCENT     # noqa: E402
import content_front                     # noqa: E402

STUDENT = content_front.STUDENT
GUIDE = content_front.GUIDE
TITLE = content_front.TITLE


def remuneration_bill(r):
    r.page_break()
    r.centered('INDIRA GANDHI NATIONAL OPEN UNIVERSITY', 13, bold=True, space_after=2)
    r.centered('MAIDAN GARHI, NEW DELHI — 110068', 11, space_after=14)
    r.centered('REMUNERATION BILL FOR THE BCA PROJECT GUIDE', 14, bold=True,
               colour=ACCENT, space_after=10)
    r.rule()
    r.spacer(12)

    r.table(['#', 'Item', 'Details'],
            [['1', 'Course Code', 'BCA (BCSP-064)'],
             ['2', 'Name of the Guide', GUIDE['name']],
             ['3', 'Residential Address', GUIDE['address']],
             ['4', 'Designation', GUIDE['designation']],
             ['5', 'Office Address', f"{GUIDE['organisation']}"]],
            widths=[0.3, 1.3, 2.7], font_size=10.5)

    r.spacer(14)
    r.p('This is to certify that I have guided the following student for their project work:',
        first_line_indent=False, size=11)
    r.spacer(6)

    r.table(['S. No.', 'Enrolment Number', 'PR No.\n(filled by the Regional Centre)',
             'Name of the Student', 'Title of the Project', 'Amount Claimed'],
            [['1', STUDENT['enrolment'], '', STUDENT['name'], TITLE, ''],
             ['2', '', '', '', '', ''],
             ['3', '', '', '', '', '']],
            widths=[0.3, 0.75, 0.8, 0.9, 1.6, 0.6], font_size=9)

    r.spacer(34)
    r.table(['', ''],
            [['\n\nSignature of the Guide', '\n\nDate: ..............................']],
            widths=[1, 1], font_size=10.5, zebra=False, header_fill='FFFFFF')

    r.spacer(18)
    r.p('NOTE: A project guide cannot guide more than eight students at any given point in '
        'time. This form, duly signed by the guide, should be placed in a SEPARATE ENVELOPE '
        'and submitted along with the project report. A remuneration bill not accompanying '
        'the project report will not be considered for payment.',
        first_line_indent=False, size=10, italic=True)


def main():
    r = Report()
    r.add_page_numbers()
    r.add_header_text('BCSP-064 Submission Forms — Kailash Kumar Jha — 2400767095')

    # content_front.build emits, in order: title page, certificate of
    # originality, proposal proforma, guide bio-data, acknowledgement.
    content_front.build(r)
    remuneration_bill(r)

    public = os.environ.get('IGNOU_REDACT') == '1'
    out = (pathlib.Path(__file__).parent /
           ('BCSP064_Submission_Forms_Signature_Pages'
            + ('_PUBLIC' if public else '') + '.docx'))
    r.save(out)
    print(f'  saved : {out.name}')
    print(f'  size  : {out.stat().st_size / 1024:.0f} KB')


if __name__ == '__main__':
    main()
