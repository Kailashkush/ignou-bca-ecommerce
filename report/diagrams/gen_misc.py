"""Architecture, use case, module hierarchy, order state machine, schedule."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from _build import *

# ====================== Figure 4.1  Three-tier architecture =================
W, H = 1240, 700
s = header(W, H, "architecture")
s += txt(W/2, 36, "Figure 4.1   Three-Tier System Architecture", 16, INK, "700")

def tier(x, y, w, h, title, subtitle, colour, fill):
    out = (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" fill="{fill}" '
           f'stroke="{colour}" stroke-width="1.8"/>\n')
    out += txt(x + 18, y + 28, title, 14, colour, "700", anchor="start")
    out += txt(x + 18, y + 47, subtitle, 11, MUTED, anchor="start")
    return out

def chip(x, y, w, label, sub=None, colour=BRAND):
    out = (f'<rect x="{x}" y="{y}" width="{w}" height="{46 if sub else 34}" rx="7" '
           f'fill="#ffffff" stroke="{colour}" stroke-width="1.4"/>\n')
    out += txt(x + w/2, y + (19 if sub else 22), label, 12, INK, "600")
    if sub:
        out += txt(x + w/2, y + 36, sub, 10, MUTED)
    return out

s += tier(50, 90, 340, 480, "PRESENTATION TIER", "Browser — React 18 single-page application", BRAND, FILL)
s += tier(450, 90, 340, 480, "APPLICATION TIER", "Node.js 22 + Express 4 REST API", GREEN, GFILL)
s += tier(850, 90, 340, 480, "DATA TIER", "MongoDB 7 + Mongoose ODM", AMBER, AFILL)

for i, (label, sub) in enumerate([
        ("react-router-dom", "client-side routing"),
        ("Context providers", "Auth · Cart · Toast"),
        ("Page components", "22 screens"),
        ("Presentational components", "ProductCard, Pagination, …"),
        ("Axios instance", "token + error interceptors"),
        ("localStorage", "token and cart persistence")]):
    s += chip(72, 122 + i * 72, 296, label, sub)

for i, (label, sub) in enumerate([
        ("helmet · cors · rate limit", "security middleware"),
        ("express-mongo-sanitize", "operator-injection defence"),
        ("Routers + validators", "/auth /products /orders /admin"),
        ("Controllers", "request → response orchestration"),
        ("Services", "catalog · checkout · payment"),
        ("Central error handler", "one response shape")]):
    s += chip(472, 122 + i * 72, 296, label, sub, GREEN)

for i, (label, sub) in enumerate([
        ("users", "unique index on email"),
        ("categories", "unique index on name, slug"),
        ("products", "weighted text index; (category, price)"),
        ("orders", "unique invoiceNo; (user, placedAt)"),
        ("Schema validation", "Mongoose, at write time"),
        ("Atomic $inc on stockCount", "single-document guarantee")]):
    s += chip(872, 122 + i * 72, 296, label, sub, AMBER)

s += arrow(392, 300, 448, 300, None, LINE)
s += txt(420, 274, "HTTPS", 11, MUTED)
s += txt(420, 288, "JSON", 11, MUTED)
s += arrow(448, 360, 392, 360, None, LINE)
s += arrow(792, 300, 848, 300, None, LINE)
s += txt(820, 274, "Mongo", 11, MUTED)
s += txt(820, 288, "wire", 11, MUTED)
s += arrow(848, 360, 792, 360, None, LINE)

s += lines(W/2, 606, [
    "The browser never reaches the database. Every request passes through the Express middleware chain, so authentication,",
    "authorisation, input sanitisation and rate limiting are applied uniformly and cannot be bypassed by a crafted client.",
], 12, MUTED, lh=18)
s += caption(W, 672, "Figure 4.1 — the decoupled three-tier arrangement adopted for the project.")
write("fig-4-1-architecture", s)

# ========================= Figure 5.6  Use case diagram =====================
W, H = 1420, 740
s = header(W, H, "use cases")
s += txt(W/2, 36, "Figure 5.6   Use Case Diagram", 16, INK, "700")

def actor(cx, cy, name):
    out = (f'<circle cx="{cx}" cy="{cy-38}" r="13" fill="none" stroke="{INK}" stroke-width="1.8"/>\n'
           f'<line x1="{cx}" y1="{cy-25}" x2="{cx}" y2="{cy+6}" stroke="{INK}" stroke-width="1.8"/>\n'
           f'<line x1="{cx-17}" y1="{cy-14}" x2="{cx+17}" y2="{cy-14}" stroke="{INK}" stroke-width="1.8"/>\n'
           f'<line x1="{cx}" y1="{cy+6}" x2="{cx-14}" y2="{cy+28}" stroke="{INK}" stroke-width="1.8"/>\n'
           f'<line x1="{cx}" y1="{cy+6}" x2="{cx+14}" y2="{cy+28}" stroke="{INK}" stroke-width="1.8"/>\n')
    out += txt(cx, cy + 48, name, 13, INK, "700")
    return out

def usecase(cx, cy, label, rx=140, ry=25):
    out = (f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{FILL}" stroke="{BRAND}" '
           f'stroke-width="1.5"/>\n')
    out += txt(cx, cy + 4, label, 12, INK, "500")
    return out

s += (f'<rect x="286" y="96" width="790" height="556" rx="16" fill="none" stroke="{LINE}" '
      f'stroke-width="1.6" stroke-dasharray="7 5"/>\n')
s += txt(681, 124, "ShopSphere E-Commerce System", 13, MUTED, "700")

s += actor(140, 374, "Customer")
s += actor(1250, 374, "Store Administrator")

CUST = ["Register an account", "Sign in / sign out", "Search and filter catalogue",
        "View product detail", "Manage shopping cart", "Place an order",
        "Track and cancel an order"]
ADMIN = ["Maintain product catalogue", "Maintain categories", "Adjust stock levels",
         "Progress order status", "Manage customer accounts", "View sales dashboard"]

for i, label in enumerate(CUST):
    cy = 190 + i * 62
    s += usecase(460, cy, label)
    s += arrow(164, 374, 318, cy, None, LINE)

for i, label in enumerate(ADMIN):
    cy = 221 + i * 62
    s += usecase(902, cy, label)
    s += arrow(1226, 374, 1044, cy, None, LINE)

s += caption(W, 716, "Seven customer use cases and six administrative use cases. Signing in is a precondition for placing, tracking and cancelling an order.")
write("fig-5-6-use-case", s)
