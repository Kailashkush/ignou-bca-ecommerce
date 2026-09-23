"""
Generates the report's diagrams as SVG.

Everything is drawn from primitives so the diagrams stay consistent: one type
scale, one palette, one set of box/arrow styles across all nine figures.
"""
import pathlib

OUT = pathlib.Path(__file__).parent

INK   = "#0f172a"
MUTED = "#64748b"
LINE  = "#94a3b8"
BRAND = "#4f46e5"
FILL  = "#eef2ff"
GREEN = "#059669"
GFILL = "#ecfdf5"
AMBER = "#b45309"
AFILL = "#fffbeb"
GREY  = "#f1f5f9"

FONT = "Inter, Helvetica, Arial, sans-serif"

def header(w, h, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
            f'width="{w}" height="{h}" font-family="{FONT}">\n'
            f'<rect width="{w}" height="{h}" fill="#ffffff"/>\n'
            '<defs>\n'
            f'  <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" '
            f'markerHeight="7" orient="auto-start-reverse">'
            f'<path d="M0 0 L10 5 L0 10 z" fill="{LINE}"/></marker>\n'
            f'  <marker id="arrowb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" '
            f'markerHeight="7" orient="auto-start-reverse">'
            f'<path d="M0 0 L10 5 L0 10 z" fill="{BRAND}"/></marker>\n'
            '</defs>\n')

def txt(x, y, s, size=13, fill=INK, weight="400", anchor="middle", style=""):
    s = (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
    return (f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" font-weight="{weight}" '
            f'text-anchor="{anchor}" {style}>{s}</text>\n')

def lines(x, y, rows, size=12, fill=INK, weight="400", anchor="middle", lh=15):
    out = ""
    for i, row in enumerate(rows):
        out += txt(x, y + i * lh, row, size, fill, weight, anchor)
    return out

def box(x, y, w, h, label, sub=None, fill=FILL, stroke=BRAND, r=10, size=13, weight="600"):
    out = (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" '
           f'stroke="{stroke}" stroke-width="1.6"/>\n')
    rows = label if isinstance(label, list) else [label]
    cy = y + h / 2 - (len(rows) - 1) * 8 + (0 if not sub else -7)
    out += lines(x + w / 2, cy + 4, rows, size, INK, weight, lh=16)
    if sub:
        out += txt(x + w / 2, y + h / 2 + (len(rows) - 1) * 8 + 17, sub, 11, MUTED)
    return out

def circle(cx, cy, r, label, sub=None, fill=GFILL, stroke=GREEN):
    out = (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{stroke}" '
           f'stroke-width="1.6"/>\n')
    rows = label if isinstance(label, list) else [label]
    out += lines(cx, cy - (len(rows) - 1) * 7 + 4, rows, 12, INK, "600", lh=14)
    if sub:
        out += txt(cx, cy + (len(rows) - 1) * 7 + 18, sub, 10, MUTED)
    return out

def store(x, y, w, h, tag, label):
    """Open-ended data store in the Gane–Sarson style."""
    out = (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{AFILL}" stroke="{AMBER}" '
           f'stroke-width="1.6"/>\n'
           f'<line x1="{x+34}" y1="{y}" x2="{x+34}" y2="{y+h}" stroke="{AMBER}" stroke-width="1.6"/>\n')
    out += txt(x + 17, y + h / 2 + 4, tag, 12, AMBER, "700")
    out += txt(x + 34 + (w - 34) / 2, y + h / 2 + 4, label, 12, INK, "600")
    return out

def arrow(x1, y1, x2, y2, label=None, colour=LINE, marker="arrow", dash=None, lx=None, ly=None, size=11):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    out = (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{colour}" stroke-width="1.5" '
           f'marker-end="url(#{marker})"{d}/>\n')
    if label:
        mx = lx if lx is not None else (x1 + x2) / 2
        my = ly if ly is not None else (y1 + y2) / 2 - 7
        width = len(label) * 5.6 + 10
        out += (f'<rect x="{mx - width/2}" y="{my - 11}" width="{width}" height="16" rx="3" '
                f'fill="#ffffff" opacity="0.94"/>\n')
        out += txt(mx, my + 1, label, size, MUTED)
    return out

def poly(points, label=None, colour=LINE, marker="arrow"):
    pts = " ".join(f"{x},{y}" for x, y in points)
    return (f'<polyline points="{pts}" fill="none" stroke="{colour}" stroke-width="1.5" '
            f'marker-end="url(#{marker})"/>\n')

def caption(w, y, text):
    return txt(w / 2, y, text, 12, MUTED, "500")

def write(name, body):
    (OUT / f"{name}.svg").write_text(body + "</svg>\n")
    print(f"  wrote {name}.svg")


import math

def edge(cx, cy, r, tx, ty, pad=2):
    """Point on a circle's circumference facing (tx, ty)."""
    dx, dy = tx - cx, ty - cy
    d = math.hypot(dx, dy) or 1
    return (cx + dx / d * (r + pad), cy + dy / d * (r + pad))

def flow(p1, p2, label=None, colour=None, marker="arrowb", t=0.5, dy=-6, size=11):
    """Straight labelled arrow; the label sits on the line with a white backing
    so it stays readable wherever the line crosses something else."""
    colour = colour or BRAND
    x1, y1 = p1
    x2, y2 = p2
    out = (f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{colour}" '
           f'stroke-width="1.5" marker-end="url(#{marker})"/>\n')
    if label:
        mx = x1 + (x2 - x1) * t
        my = y1 + (y2 - y1) * t + dy
        w = len(label) * 5.7 + 12
        out += (f'<rect x="{mx - w/2:.1f}" y="{my - 11:.1f}" width="{w:.1f}" height="16" rx="3" '
                f'fill="#ffffff" opacity="0.96"/>\n')
        out += txt(mx, my + 1.5, label, size, MUTED)
    return out
