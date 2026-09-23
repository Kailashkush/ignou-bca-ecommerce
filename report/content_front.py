"""Front matter: title page, certificate, proforma, guide bio-data, contents."""
from docx_kit import ACCENT

import os

# ---------------------------------------------------------------------------
# Contact details.
#
# IGNOU requires the student's and guide's contact details on the proforma and
# the certificate, so the bound submission carries them. The public repository
# does not: a mobile number and two home addresses on a search-indexed page are
# a standing privacy cost with no academic benefit.
#
# The real values live in `contact_details.py`, which is git-ignored. Without
# that file — as in any fresh clone — the builders fall back to redacted values
# automatically, so nothing leaks by omission. Setting IGNOU_REDACT=1 forces
# the redacted build even when the file is present.
#
# Name, enrolment number and centre codes are kept in both: an examiner needs
# those to verify authorship.
# ---------------------------------------------------------------------------
try:
    from contact_details import STUDENT_CONTACT, GUIDE_CONTACT
except ImportError:
    STUDENT_CONTACT = GUIDE_CONTACT = None

WITHHELD = 'Provided in the submitted copy'
REDACT = os.environ.get('IGNOU_REDACT') == '1' or STUDENT_CONTACT is None


def _contact(source, key):
    return WITHHELD if REDACT else source[key]


STUDENT = {
    'name': 'Kailash Kumar Jha',
    'enrolment': '2400767095',
    'programme': 'Bachelor of Computer Applications (BCA)',
    'course': 'BCSP-064',
    'study_centre': '07162P',
    'regional_centre': 'RCD1 — 07: Delhi 1 (Mohan Estate, South Delhi)',
    'email': _contact(STUDENT_CONTACT, 'email'),
    'mobile': _contact(STUDENT_CONTACT, 'mobile'),
    'address': _contact(STUDENT_CONTACT, 'address'),
}

GUIDE = {
    'name': 'Shankar Jha',
    'qualification': 'B.Tech (Information Technology), Bharati Vidyapeeth College of Engineering',
    'designation': 'Backend Lead (Software Engineer)',
    'organisation': 'Wizcart Technologies LLC',
    'experience': '5+ years (Industry)',
    'specialisation': 'Backend development, product engineering, SaaS platforms',
    'address': _contact(GUIDE_CONTACT, 'address'),
    'email': _contact(GUIDE_CONTACT, 'email'),
}

TITLE = 'DEVELOPMENT OF AN E-COMMERCE WEB APPLICATION FOR ONLINE SHOPPING'


def build(r, include_acknowledgement=True):
    # ===================== Title page =====================================
    # Vertical rhythm here is tuned so the whole title page fits one leaf.
    r.spacer(8)
    r.centered('INDIRA GANDHI NATIONAL OPEN UNIVERSITY', 15, bold=True, colour=ACCENT)
    r.centered('School of Computer and Information Sciences', 12.5, italic=True)
    r.centered('Maidan Garhi, New Delhi — 110 068', 11, italic=True, space_after=18)
    r.rule()
    r.spacer(14)

    r.centered('PROJECT REPORT', 13, bold=True, space_after=4)
    r.centered('BCSP-064', 12, space_after=24)

    for line in ['DEVELOPMENT OF AN E-COMMERCE', 'WEB APPLICATION FOR',
                 'ONLINE SHOPPING']:
        r.centered(line, 20, bold=True, space_after=5, colour=ACCENT)

    r.spacer(12)
    r.centered('A project report submitted in partial fulfilment of the requirements', 11.5, italic=True, space_after=2)
    r.centered('for the award of the degree of', 11.5, italic=True, space_after=6)
    r.centered('BACHELOR OF COMPUTER APPLICATIONS (BCA)', 13, bold=True, space_after=20)

    r.table(
        ['Particulars', 'Details'],
        [['Submitted by', f"**{STUDENT['name']}**"],
         ['Enrolment Number', STUDENT['enrolment']],
         ['Programme', STUDENT['programme']],
         ['Course Code', STUDENT['course']],
         ['Study Centre Code', STUDENT['study_centre']],
         ['Regional Centre', STUDENT['regional_centre']],
         ['E-mail', STUDENT['email']],
         ['Mobile Number', STUDENT['mobile']],
         ['Project Guide', f"**{GUIDE['name']}** — {GUIDE['designation']}"],
         ['Session', 'January 2026']],
        widths=[1.1, 2.4], font_size=11)

    r.spacer(8)
    r.centered('Under the supervision of', 11.5, italic=True, space_after=3)
    r.centered(GUIDE['name'], 14, bold=True, space_after=2)
    r.centered(f"{GUIDE['designation']}, {GUIDE['organisation']}", 11, italic=True)

    # ===================== Certificate of originality =====================
    r.page_break()
    r.spacer(26)
    r.centered('CERTIFICATE OF ORIGINALITY', 16, bold=True, colour=ACCENT, space_after=6)
    r.rule()
    r.spacer(26)

    body = (
        f'This is to certify that the project report entitled "{TITLE}" submitted to '
        f'Indira Gandhi National Open University in partial fulfilment of the requirements '
        f'for the award of the degree of BACHELOR OF COMPUTER APPLICATIONS (BCA), is an '
        f'original work carried out by Mr. {STUDENT["name"]}, Enrolment No.: '
        f'{STUDENT["enrolment"]}, under the guidance of Mr. {GUIDE["name"]}.'
    )
    r.p(body, first_line_indent=False)
    r.spacer(10)
    r.p('The matter embodied in this project is a genuine work done by the student and has '
        'not been submitted whether to this University or to any other University / Institute '
        'for the fulfilment of the requirement of any course of study.',
        first_line_indent=False)

    r.spacer(48)
    r.table(
        ['Signature of the Student', 'Signature of the Guide'],
        [['\n\n', '\n\n'],
         [f"Name: {STUDENT['name']}", f"Name: {GUIDE['name']}"],
         [f"Enrolment No.: {STUDENT['enrolment']}", f"Designation: {GUIDE['designation']}"],
         [f"Address: {STUDENT['address']}", f"Address: {GUIDE['address']}"],
         ['Date: ..............................', 'Date: ..............................']],
        widths=[1, 1], font_size=10.5, zebra=False, header_fill='FFFFFF')

    # ===================== Project proposal proforma ======================
    r.page_break()
    r.centered('SCHOOL OF COMPUTER AND INFORMATION SCIENCES', 12.5, bold=True, space_after=2)
    r.centered('IGNOU, MAIDAN GARHI, NEW DELHI — 110 068', 11, space_after=14)
    r.centered('PROFORMA OF BCA PROJECT PROPOSAL (BCSP-064)', 13, bold=True,
               colour=ACCENT, space_after=2)
    r.centered('(Project Title and Guide’s Details)', 11, italic=True, space_after=14)
    r.rule()
    r.spacer(10)

    r.table(
        ['#', 'Item', 'Details'],
        [['', 'Enrolment No.', STUDENT['enrolment']],
         ['', 'Regional Centre Code', 'RCD1'],
         ['', 'Study Centre Code', STUDENT['study_centre']],
         ['1', 'Name of Student', STUDENT['name']],
         ['2', 'Address of the Student', STUDENT['address']],
         ['3 (a)', 'E-mail', STUDENT['email']],
         ['3 (b)', 'Telephone / Mobile No.', STUDENT['mobile']],
         ['4', 'Title of the Project', f'**{TITLE}**'],
         ['5 (a)', 'Name of the Project Guide', GUIDE['name']],
         ['5 (b)', 'Designation of the Project Guide', GUIDE['designation']],
         ['6', 'Address of Project Guide', GUIDE['address']],
         ['7', 'Qualification of the Guide',
          'B.Tech (Information Technology) — bio-data attached'],
         ['8', 'Industrial / Teaching experience of the Guide', '5+ years (Industry)'],
         ['9', 'Software used for this Project',
          'MongoDB 7 (Community Server), Express.js 4, React 18, Node.js 22, '
          'Mongoose 8, JSON Web Token, bcrypt, Jest, Supertest, Vite, Git, VS Code, Postman']],
        widths=[0.35, 1.5, 3.0], font_size=10)

    r.spacer(20)
    r.table(['Signature of the Student', 'Signature of the Guide'],
            [['\n\nDate: ..............................', '\n\nDate: ..............................']],
            widths=[1, 1], font_size=10.5, zebra=False, header_fill='FFFFFF')

    r.spacer(14)
    r.p('Note — as required by the BCSP-064 guidelines: the use of Visual Basic with '
        'MS-Access as front end and back end respectively is forbidden, and the use of C or '
        'C++ is prohibited for projects associated with database management. This project '
        'uses none of those. MongoDB is listed among the permitted database engines and '
        'React among the permitted languages and frameworks in Section VII of the '
        'guidelines.', first_line_indent=False, size=10.5, italic=True)

    r.spacer(16)
    r.table(['For Office Use Only', ''],
            [['Approved  ☐          Not approved  ☐', 'Signature, Designation and Stamp of the\nProject Proposal Evaluator\n\nDate: ..........................'],
             ['Suggestions for reformulating the project:', '\n\n\n']],
            widths=[1, 1], font_size=10, zebra=False)

    # ===================== Guide bio-data ==================================
    r.page_break()
    r.centered('BIO-DATA OF THE PROJECT GUIDE', 16, bold=True, colour=ACCENT, space_after=6)
    r.rule()
    r.spacer(14)

    r.table(['Particulars', 'Details'],
            [['Name', f"**{GUIDE['name']}**"],
             ['Qualification', GUIDE['qualification']],
             ['Current Designation', GUIDE['designation']],
             ['Organisation', GUIDE['organisation']],
             ['Total Experience', GUIDE['experience']],
             ['Area of Specialisation', GUIDE['specialisation']],
             ['Address', GUIDE['address']],
             ['E-mail', GUIDE['email']]],
            widths=[1.1, 2.6], font_size=11)

    r.spacer(12)
    r.h3('Professional Summary')
    r.p('Shankar Jha is a software engineer with more than five years of industry experience '
        'in backend engineering, full-stack application development and SaaS platform '
        'architecture. He currently serves as Backend Lead at Wizcart Technologies LLC, where '
        'he is responsible for the design of scalable service infrastructure, data '
        'synchronisation pipelines and transactional API design.', first_line_indent=False)

    r.h3('Professional Experience')
    r.bullets([
        '**Backend Lead** — Wizcart Technologies LLC (current role)',
        '**Senior Development Engineer** — AVIZVA',
        '**Full Stack Engineer** — Surepass Technologies',
        '**Full Stack Software Developer** — Flowboard Technologies',
    ])

    r.h3('Key Projects and Achievements')
    r.bullets([
        'Designed and engineered core systems for high-throughput, enterprise-grade SaaS platforms.',
        'Architected security-compliance protocols and transactional APIs for financial technology platforms.',
        'Integrated distributed analytical engines within real-time health-technology systems.',
    ])

    r.h3('Educational Credentials')
    r.bullets(['**B.Tech in Information Technology** — Bharati Vidyapeeth College of Engineering'])

    r.spacer(40)
    r.table(['', ''],
            [['\n\nSignature of the Guide', '\n\nDate: ..............................']],
            widths=[1, 1], font_size=10.5, zebra=False, header_fill='FFFFFF')

    if include_acknowledgement:
        acknowledgement(r)


def acknowledgement(r):
    # ===================== Acknowledgement =================================
    r.page_break()
    r.centered('ACKNOWLEDGEMENT', 16, bold=True, colour=ACCENT, space_after=6)
    r.rule()
    r.spacer(18)

    r.p('The completion of this project has depended on the guidance, encouragement and '
        'patience of a number of people, and it is a pleasure to record my thanks to them here.')
    r.p(f'I am deeply grateful to my project guide, Mr. {GUIDE["name"]}, Backend Lead at '
        f'Wizcart Technologies LLC, for agreeing to supervise this work. His insistence that I '
        f'justify every design decision — rather than simply make it work — shaped the project '
        f'more than any other single influence. The concurrency handling in the checkout engine '
        f'and the decision to recompute every price on the server are both the direct result of '
        f'his review comments.')
    r.p('I thank the School of Computer and Information Sciences, IGNOU, for framing a project '
        'course that requires the student to work through the whole software development life '
        'cycle rather than only the coding phase. I am also grateful to the Coordinator and the '
        'academic counsellors at Study Centre 07162P for their guidance on the procedural '
        'requirements of the submission.')
    r.p('Finally, I thank my family for their steady support over the months this project took, '
        'and for tolerating the long evenings it consumed.')

    r.spacer(34)
    r.right_text(f'{STUDENT["name"]}\nEnrolment No.: {STUDENT["enrolment"]}')
