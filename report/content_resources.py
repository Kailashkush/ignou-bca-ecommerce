"""
Project Resources page — the QR codes linking the printed report to the live
source repository and the running application.

The page degrades gracefully: if neither URL is configured in links.py it is
omitted entirely, and if only one is set only that one is shown. The URL is
always printed in full beneath its code, so the page remains usable to a reader
without a phone, and remains readable if the code is damaged in photocopying.
"""
import pathlib
import sys

BASE = pathlib.Path(__file__).parent
sys.path.insert(0, str(BASE))
import links  # noqa: E402

ACCENT = '#1f3b73'


def available():
    return bool(links.GITHUB_URL) or bool(links.LIVE_URL)


def build(r):
    if not available():
        return

    r.page_break()
    r.centered('PROJECT RESOURCES', 16, bold=True, colour=ACCENT, space_after=6)
    r.rule()
    r.spacer(10)

    r.p('The complete source code of this project, and a running instance of the '
        'application, are available online. Scan the code below with any phone camera, '
        'or type the address into a browser.', first_line_indent=False)
    r.spacer(10)

    entries = []
    if links.GITHUB_URL and (BASE / 'diagrams' / 'qr-github.png').exists():
        entries.append(('qr-github.png', 'Source code repository', 1.75))
    if links.LIVE_URL and (BASE / 'diagrams' / 'qr-live.png').exists():
        entries.append(('qr-live.png', 'Live application', 1.75))

    if entries:
        # Unnumbered: these are wayfinding, not analytical figures.
        r.figure_row(entries, folder='diagrams', numbered=False)

    rows = []
    if links.GITHUB_URL:
        rows.append(['**Source code**', links.GITHUB_URL, links.GITHUB_LABEL])
    if links.LIVE_URL:
        rows.append(['**Live application**', links.LIVE_URL, links.LIVE_LABEL])
    r.table(['Resource', 'Address', 'What you will find there'], rows,
            widths=[0.75, 1.9, 1.65], font_size=9.5)

    if links.LIVE_URL:
        r.spacer(6)
        r.h3('Signing in to the live application')
        r.p('The deployed instance is seeded with the same demonstration data used '
            'throughout Chapter 9: six categories, thirty-four products, five customer '
            'accounts and forty historical orders. Two accounts are provided for '
            'assessment.', first_line_indent=False)
        r.table(['Role', 'Email address', 'Password'],
                [[role, f'`{email}`', f'`{pw}`'] for role, email, pw in links.DEMO_ACCOUNTS],
                widths=[0.8, 1.8, 1.0], font_size=9.5)

        r.p('Card payment is simulated and no money moves. Use '
            '`4539 5787 6362 1486` for an approved payment, or any Luhn-valid number '
            'ending in `0000` — for example `4111 1111 1109 0000` — to see the decline '
            'path described in Section 6.3.2.', first_line_indent=False)
        r.p('The demonstration is hosted on a free tier that suspends the service after a '
            'period without traffic, so the very first request after an idle spell may '
            'take up to a minute while the instance restarts. Subsequent requests are '
            'immediate.', first_line_indent=False, italic=True, size=10.5)
