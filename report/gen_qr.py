"""
Renders the project's URLs as QR codes for the report's Project Resources page.

Error correction is set to 'H' (about 30% recoverable), which is the right
choice for a code that will be printed, photocopied and then read off paper
under whatever light the examination room happens to have.

Run:  python3 gen_qr.py
"""
import pathlib
import subprocess
import sys

import segno

BASE = pathlib.Path(__file__).parent
sys.path.insert(0, str(BASE))
import links  # noqa: E402

OUT = BASE / 'diagrams'


def make(url, stem):
    """Writes an SVG and a print-resolution PNG for one URL."""
    qr = segno.make(url, error='h')
    svg = OUT / f'{stem}.svg'
    png = OUT / f'{stem}.png'
    # `scale` is the module size in px; 20 gives roughly 600 px across, which
    # prints crisply at the ~45 mm the page allots each code.
    qr.save(str(svg), scale=20, border=2, dark='#0f172a', light='#ffffff')
    qr.save(str(png), scale=20, border=2, dark='#0f172a', light='#ffffff')
    return png, qr.version, qr.symbol_size(scale=20)[0]


def main():
    made = []
    for url, stem in ((links.GITHUB_URL, 'qr-github'), (links.LIVE_URL, 'qr-live')):
        if not url:
            print(f'  skipped {stem} — no URL set in links.py')
            continue
        png, version, px = make(url, stem)
        print(f'  {png.name:<16} version {version}, {px}x{px} px  <-  {url}')
        made.append(png)

    if not made:
        print('\n  Nothing generated. Set GITHUB_URL / LIVE_URL in report/links.py.')
        return

    # Prove the codes actually decode, rather than trusting that they do.
    try:
        import cv2  # noqa: F401
        for png in made:
            import cv2
            img = cv2.imread(str(png))
            data, _, _ = cv2.QRCodeDetector().detectAndDecode(img)
            print(f'  decoded {png.name}: {data or "*** FAILED TO DECODE ***"}')
    except ImportError:
        print('  (install opencv-python to verify the codes decode)')


if __name__ == '__main__':
    main()
