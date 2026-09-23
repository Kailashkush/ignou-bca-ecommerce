"""Order state machine, module hierarchy and project schedule."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from _build import *

# ===================== Figure 6.1  Order state machine ======================
W, H = 1260, 570
s = header(W, H, "order states")
s += txt(W/2, 36, "Figure 6.1   Order Status State Machine", 16, INK, "700")

def state(cx, cy, label, sub, fill=FILL, stroke=BRAND, w=168, h=62):
    out = (f'<rect x="{cx-w/2}" y="{cy-h/2}" width="{w}" height="{h}" rx="12" fill="{fill}" '
           f'stroke="{stroke}" stroke-width="1.8"/>\n')
    out += txt(cx, cy - 4, label, 13, INK, "700")
    out += txt(cx, cy + 15, sub, 10, MUTED)
    return out

ROW = 190
s += f'<circle cx="86" cy="{ROW}" r="13" fill="{INK}"/>\n'
s += txt(86, ROW + 40, "order placed", 11, MUTED)

s += state(230, ROW, "PENDING", "cash on delivery")
s += state(470, ROW, "CONFIRMED", "payment authorised")
s += state(710, ROW, "SHIPPED", "handed to courier")
s += state(950, ROW, "DELIVERED", "terminal", GFILL, GREEN)
s += state(590, 400, "CANCELLED", "stock returned to catalogue", "#fef2f2", "#dc2626", 210)

s += arrow(101, ROW, 142, ROW, None, LINE)
s += txt(120, ROW - 14, "cash on delivery", 10, MUTED, anchor="start")
# A card order never passes through PENDING: it is created already CONFIRMED.
s += poly([(86, 177), (86, 112), (470, 112), (470, 155)], colour=LINE)
s += txt(278, 104, "card payment authorised at checkout", 11, MUTED)
s += arrow(316, ROW, 384, ROW, "admin confirms", BRAND, "arrowb", ly=ROW - 12)
s += arrow(556, ROW, 624, ROW, "admin ships", BRAND, "arrowb", ly=ROW - 12)
s += arrow(796, ROW, 864, ROW, "admin delivers", BRAND, "arrowb", ly=ROW - 12)

s += f'<circle cx="1084" cy="{ROW}" r="14" fill="none" stroke="{INK}" stroke-width="2"/>\n'
s += f'<circle cx="1084" cy="{ROW}" r="8" fill="{INK}"/>\n'
s += arrow(1035, ROW, 1068, ROW, None, LINE)

s += poly([(230, 221), (230, 400), (484, 400)], colour="#dc2626", marker="arrow")
s += txt(262, 380, "customer or admin cancels", 11, MUTED, anchor="start")
s += poly([(470, 221), (470, 340), (560, 340), (560, 368)], colour="#dc2626", marker="arrow")

s += f'<circle cx="590" cy="482" r="14" fill="none" stroke="{INK}" stroke-width="2"/>\n'
s += f'<circle cx="590" cy="482" r="8" fill="{INK}"/>\n'
s += arrow(590, 432, 590, 464, None, LINE)

s += lines(980, 330, [
    "Once an order is SHIPPED it can no longer",
    "be cancelled: the parcel has left the store.",
    "",
    "DELIVERED and CANCELLED are terminal.",
    "The transition table is declared on the Order",
    "model, so every code path is bound by it.",
], 11, MUTED, lh=17)

s += caption(W, 548, "Five states with seven legal transitions. A cash-on-delivery order is additionally marked paid when it reaches DELIVERED.")
write("fig-6-1-order-states", s)

# ===================== Figure 6.2  Module hierarchy =========================
W, H = 1400, 700
s = header(W, H, "module hierarchy")
s += txt(W/2, 36, "Figure 6.2   Module Hierarchy (Structure Chart)", 16, INK, "700")

def node(cx, cy, label, sub=None, w=190, h=54, fill=FILL, stroke=BRAND):
    out = (f'<rect x="{cx-w/2}" y="{cy-h/2}" width="{w}" height="{h}" rx="9" fill="{fill}" '
           f'stroke="{stroke}" stroke-width="1.6"/>\n')
    out += txt(cx, cy + (0 if sub else 5) - (6 if sub else 0), label, 12.5, INK, "700")
    if sub:
        out += txt(cx, cy + 13, sub, 10, MUTED)
    return out

s += node(700, 96, "ShopSphere Application", "app.js — middleware chain + routers", 300, 58)

L2 = [(190, "Identity", "6 endpoints"), (430, "Catalogue", "7 endpoints"),
      (700, "Cart", "client-side context"), (960, "Checkout", "3 endpoints"),
      (1220, "Administration", "5 endpoints")]
for cx, label, sub in L2:
    s += node(cx, 238, label, sub, 190)
    s += poly([(700, 125), (700, 180), (cx, 180), (cx, 209)], colour=LINE)

L3 = {
    190: ["authController", "auth middleware", "token utility", "User model"],
    430: ["productController", "categoryController", "catalogService", "Product / Category"],
    700: ["CartContext", "cart reducer", "localStorage sync", "quantity caps"],
    960: ["orderController", "checkoutService", "paymentService", "Order model"],
    1220: ["adminController", "calendar utility", "aggregation pipelines", "dashboard screens"],
}
# Children hang from a spine dropped out of their parent module, which is the
# structure-chart convention; arrows drawn between siblings would wrongly imply
# a calling sequence among them.
for cx, children in L3.items():
    spine = cx - 118
    last_cy = 348 + (len(children) - 1) * 62
    s += (f'<polyline points="{cx},265 {cx},300 {spine},300" fill="none" '
      f'stroke="{LINE}" stroke-width="1.5"/>\n')
    s += (f'<line x1="{spine}" y1="300" x2="{spine}" y2="{last_cy}" stroke="{LINE}" '
          f'stroke-width="1.5"/>\n')
    for i, child in enumerate(children):
        cy = 348 + i * 62
        s += node(cx, cy, child, None, 180, 44, "#ffffff", LINE)
        s += arrow(spine, cy, cx - 90, cy, None, LINE)

s += caption(W, 676, "Five functional modules under a single application shell. Each module owns its controller, its service logic and its data model, which keeps coupling between modules low.")
write("fig-6-2-module-hierarchy", s)

# ===================== Figure 3.1  Project schedule =========================
W, H = 1320, 620
s = header(W, H, "schedule")
s += txt(W/2, 36, "Figure 3.1   Project Schedule (Gantt Chart)", 16, INK, "700")

TASKS = [
    ("Requirement study and synopsis",     0,  2, BRAND),
    ("Feasibility study",                  1,  1, BRAND),
    ("System analysis — SRS, DFD, ER",     2,  3, BRAND),
    ("Database and schema design",         4,  2, GREEN),
    ("User interface design",              5,  2, GREEN),
    ("Backend — auth and catalogue",       6,  3, GREEN),
    ("Backend — cart, checkout, orders",   8,  3, GREEN),
    ("Backend — administration module",   10,  2, GREEN),
    ("Frontend — customer screens",        9,  4, AMBER),
    ("Frontend — administration screens", 12,  3, AMBER),
    ("Unit and integration testing",       8,  6, "#7c3aed"),
    ("System testing and debugging",      14,  3, "#7c3aed"),
    ("Documentation and report",          15,  4, "#0e7490"),
]

X0, XW = 420, 820
WEEKS = 19
colw = XW / WEEKS
y0, rh = 96, 34

for wk in range(0, WEEKS + 1, 2):
    x = X0 + wk * colw
    s += f'<line x1="{x:.1f}" y1="{y0-8}" x2="{x:.1f}" y2="{y0 + rh*len(TASKS) + 6}" stroke="{GREY}" stroke-width="1"/>\n'
    s += txt(x, y0 - 16, f"W{wk}", 10, MUTED)

for i, (name, start, span, colour) in enumerate(TASKS):
    cy = y0 + i * rh + rh / 2
    if i % 2 == 0:
        s += f'<rect x="40" y="{y0 + i*rh}" width="{X0 + XW - 40}" height="{rh}" fill="#fafbfc"/>\n'
    s += txt(48, cy + 4, name, 12, INK, "500", anchor="start")
    bx = X0 + start * colw
    bw = span * colw - 4
    s += (f'<rect x="{bx:.1f}" y="{cy-9}" width="{bw:.1f}" height="18" rx="5" fill="{colour}" '
          f'opacity="0.86"/>\n')
    s += txt(bx + bw + 8, cy + 4, f"{span}w", 10, MUTED, anchor="start")

s += txt(48, y0 + rh*len(TASKS) + 36, "Total elapsed time: 19 weeks (one student, part-time alongside coursework).",
         12, MUTED, "500", anchor="start")
s += caption(W, 596, "Analysis, design, implementation, testing and documentation phases, with testing deliberately overlapping implementation.")
write("fig-3-1-gantt", s)
