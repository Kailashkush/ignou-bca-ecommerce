"""Level-2 explosions of processes 2.0 and 4.0, drawn as left-to-right chains."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from _build import *

# ================= Figure 5.3  Level 2 — explosion of 4.0 ===================
W, H = 1420, 600
s = header(W, H, "DFD level 2 — checkout")
s += txt(W/2, 34, "Figure 5.3   DFD Level 2 — Explosion of Process 4.0 (Process Checkout)", 16, INK, "700")

R = 52
ROW = 300
CX = [250, 470, 690, 910, 1130]

s += box(36, 256, 108, 88, ["Customer"], None, GREY, LINE)
for cx, label in zip(CX, [["4.1","Validate","Cart"], ["4.2","Re-price","from DB"],
                          ["4.3","Reserve","Stock"], ["4.4","Authorise","Payment"],
                          ["4.5","Persist","Order"]]):
    s += circle(cx, ROW, R, label, None, FILL, BRAND)
s += circle(910, 468, R, ["4.6", "Release", "Stock"], None, FILL, BRAND)

s += store(560, 92, 170, 44, "D3", "Products")
s += store(1046, 92, 170, 44, "D4", "Orders")

# Main chain
s += arrow(146, 300, CX[0] - R - 4, 300, "cart lines", BRAND, "arrowb", ly=290)
for i in range(4):
    labels = ["valid lines", "priced lines", "reserved", "authorised"]
    s += arrow(CX[i] + R + 2, 300, CX[i+1] - R - 4, 300, labels[i], BRAND, "arrowb", ly=290)

# Store access
s += flow(edge(470, ROW, R, 578, 140), (578, 140), "price + stock read", colour=LINE,
          marker="arrow", t=0.46, dy=-8)
s += flow(edge(690, ROW, R, 700, 140), (700, 140), "stock − qty", colour=LINE,
          marker="arrow", t=0.5, dy=-8, size=11)
s += flow(edge(1130, ROW, R, 1120, 140), (1120, 140), "order record", colour=LINE,
          marker="arrow", t=0.5, dy=-8)

# Decline branch and its compensating write
s += arrow(910, ROW + R + 2, 910, 468 - R - 4, "declined", BRAND, "arrowb", lx=946, ly=400)
s += poly([(910, 524), (910, 548), (620, 548), (620, 140)], colour=LINE)
s += txt(700, 566, "stock + qty  (compensating action)", 11, MUTED)

# Returns to the customer
s += poly([(1130, 244), (1130, 74), (90, 74), (90, 252)], colour=BRAND, marker="arrowb")
s += txt(610, 66, "invoice number + order confirmation", 11, MUTED)
s += poly([(856, 468), (160, 468), (160, 348)], colour=BRAND, marker="arrowb")
s += txt(500, 460, "decline message — cart preserved, nothing charged", 11, MUTED)

s += caption(W, 588, "Stock is reserved (4.3) before the payment is authorised (4.4), so nobody is charged for an item that has just sold out; 4.6 returns the reservation when authorisation fails.")
write("fig-5-3-dfd-level-2-checkout", s)

# ================= Figure 5.4  Level 2 — explosion of 2.0 ===================
W, H = 1420, 470
s = header(W, H, "DFD level 2 — catalogue")
s += txt(W/2, 34, "Figure 5.4   DFD Level 2 — Explosion of Process 2.0 (Browse Catalogue)", 16, INK, "700")

R = 52
ROW = 270
CX = [248, 468, 688, 908, 1128]

s += box(36, 226, 108, 88, ["Customer"], None, GREY, LINE)
for cx, label in zip(CX, [["2.1","Parse","Parameters"], ["2.2","Build","Filter"],
                          ["2.3","Execute","Query"], ["2.4","Count &","Paginate"],
                          ["2.5","Shape","Response"]]):
    s += circle(cx, ROW, R, label, None, FILL, BRAND)

s += store(560, 96, 168, 44, "D2", "Categories")
s += store(830, 96, 168, 44, "D3", "Products")

s += arrow(146, 270, CX[0] - R - 4, 270, "query string", BRAND, "arrowb", ly=260)
for i in range(4):
    labels = ["typed values", "Mongo filter", "matched set", "page window"]
    s += arrow(CX[i] + R + 2, 270, CX[i+1] - R - 4, 270, labels[i], BRAND, "arrowb", ly=260)

s += flow(edge(468, ROW, R, 600, 144), (600, 144), "category read", colour=LINE,
          marker="arrow", t=0.46, dy=-8)
s += flow(edge(688, ROW, R, 862, 144), (862, 144), "indexed read", colour=LINE,
          marker="arrow", t=0.5, dy=-8)
s += flow(edge(908, ROW, R, 950, 144), (950, 144), "count", colour=LINE,
          marker="arrow", t=0.5, dy=-8)

s += poly([(1128, 214), (1128, 72), (90, 72), (90, 222)], colour=BRAND, marker="arrowb")
s += txt(610, 64, "product list + pagination metadata", 11, MUTED)

s += caption(W, 452, "Parsing (2.1) and filter construction (2.2) are separate processes so that no client-supplied value reaches MongoDB without first being coerced to the type the filter expects.")
write("fig-5-4-dfd-level-2-catalogue", s)
