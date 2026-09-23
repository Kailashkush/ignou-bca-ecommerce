"""DFD context diagram, level 1, and two level-2 explosions."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from _build import *

# ============================ Figure 5.1  DFD level 0 =======================
W, H = 940, 430
s = header(W, H, "Context diagram")
s += txt(W/2, 36, "Figure 5.1   Context Diagram (DFD Level 0)", 16, INK, "700")

s += box(45, 168, 150, 84, ["Customer"], "external entity", GREY, LINE)
s += box(745, 168, 150, 84, ["Store", "Administrator"], "external entity", GREY, LINE)
s += circle(470, 210, 96, ["0", "ShopSphere", "E-Commerce", "System"], None, FILL, BRAND)

s += arrow(198, 186, 366, 186, None, BRAND, "arrowb")
s += lines(282, 170, ["registration, sign-in, search,", "cart lines, address, card details"], 11, MUTED, lh=14)
s += arrow(366, 240, 198, 240, None, BRAND, "arrowb")
s += lines(282, 268, ["catalogue pages, cart total,", "invoice, order status"], 11, MUTED, lh=14)

s += arrow(742, 186, 574, 186, None, BRAND, "arrowb")
s += lines(658, 170, ["product and category updates,", "stock levels, fulfilment actions"], 11, MUTED, lh=14)
s += arrow(574, 240, 742, 240, None, BRAND, "arrowb")
s += lines(658, 268, ["sales analytics, order queue,", "low-stock alerts"], 11, MUTED, lh=14)

s += caption(W, 402, "The system as a single process, showing the two external entities and every data flow that crosses the system boundary.")
write("fig-5-1-dfd-level-0", s)

# ============================ Figure 5.2  DFD level 1 =======================
# Layout: customer processes on the left, the four data stores down the centre,
# administrator processes on the right. Placing the stores between the two
# actor groups keeps the flow lines short and nearly free of crossings.
W, H = 1420, 900
s = header(W, H, "DFD level 1")
s += txt(W/2, 36, "Figure 5.2   Data Flow Diagram — Level 1", 16, INK, "700")

R = 56
CPX, APX = 396, 1096          # customer / administrator process centres
SX, SW = 694, 168             # store column
CY = [132, 316, 500, 706]     # customer process rows
AY = [196, 452, 716]          # administrator process rows
SY = [110, 292, 470, 676]     # store rows
SR = SX + SW

s += box(34, 384, 116, 92, ["Customer"], None, GREY, LINE)
s += box(1300, 424, 104, 92, ["Store", "Admin"], None, GREY, LINE)

for i, label in enumerate([["1.0","Manage","Identity"], ["2.0","Browse","Catalogue"],
                           ["3.0","Maintain","Cart"],   ["4.0","Process","Checkout"]]):
    s += circle(CPX, CY[i], R, label, None, FILL, BRAND)
for i, label in enumerate([["5.0","Maintain","Catalogue"], ["6.0","Fulfil","Orders"],
                           ["7.0","Report","Analytics"]]):
    s += circle(APX, AY[i], R, label, None, FILL, BRAND)

for i, (tag, name) in enumerate([("D1","Users"), ("D2","Categories"),
                                 ("D3","Products"), ("D4","Orders")]):
    s += store(SX, SY[i], SW, 48, tag, name)

# ---- Customer <-> processes -------------------------------------------------
# Radial fan-out: the inbound and outbound arrows meet each process at
# different points on its circumference, so the pair stays legible.
CUST_OUT = (152, 404)
CUST_IN = (152, 452)
FLOWS = [
    ("sign-in details", "session token",  0.50, 0.66),
    ("search terms",    "result page",    0.32, 0.72),
    ("cart line edit",  "cart subtotal",  0.66, 0.30),
    ("address + card",  "invoice",        0.46, 0.62),
]
for i, (out_label, in_label, t_out, t_in) in enumerate(FLOWS):
    s += flow(CUST_OUT, edge(CPX, CY[i], R, *CUST_OUT), out_label, t=t_out, dy=-9)
    s += flow(edge(CPX, CY[i] + 20, R, *CUST_IN), CUST_IN, in_label, t=1 - t_in, dy=15)

# ---- Customer processes <-> stores -----------------------------------------
s += arrow(CPX + R + 4, 126, SX - 4, 126, "account record", LINE)
s += poly([(CPX + R + 2, 304), (600, 304), (600, 310), (SX - 4, 310)], colour=LINE)
s += txt(612, 300, "category list", 11, MUTED, anchor="start")
s += poly([(CPX + R + 2, 330), (580, 330), (580, 482), (SX - 4, 482)], colour=LINE)
s += txt(592, 424, "catalogue query", 11, MUTED, anchor="start")
s += poly([(CPX + R + 4, 494), (620, 494), (620, 494), (SX - 4, 494)], colour=LINE)
s += txt(500, 486, "price lookup", 11, MUTED, anchor="start")
s += poly([(CPX + R + 2, 700), (620, 700), (620, 704), (SX - 4, 704)], colour=LINE)
s += txt(506, 692, "order record", 11, MUTED, anchor="start")
s += poly([(CPX + R + 2, 726), (656, 726), (656, 506), (SX - 4, 506)], colour=LINE)
s += txt(506, 742, "stock decrement", 11, MUTED, anchor="start")

# ---- Stores <-> administrator processes ------------------------------------
s += poly([(SR + 4, 304), (900, 304), (900, 206), (APX - R - 4, 206)], colour=LINE)
s += txt(912, 196, "category write", 11, MUTED, anchor="start")
s += poly([(SR + 4, 482), (944, 482), (944, 232), (APX - R - 2, 232)], colour=LINE)
s += txt(956, 252, "product write", 11, MUTED, anchor="start")

s += poly([(SR + 4, 690), (890, 690), (890, 464), (APX - R - 4, 464)], colour=LINE)
s += txt(902, 456, "status write", 11, MUTED, anchor="start")
s += poly([(SR + 4, 494), (980, 494), (980, 436), (APX - R - 2, 436)], colour=LINE)
s += txt(880, 524, "stock restore on cancel", 11, MUTED, anchor="start")

s += poly([(SR + 4, 712), (900, 712), (900, 744), (APX - R - 4, 744)], colour=LINE)
s += txt(912, 762, "sales aggregate", 11, MUTED, anchor="start")
s += poly([(SR + 4, 134), (886, 134), (886, 800), (1050, 800), (1050, 774)], colour=LINE)
s += txt(898, 818, "customer counts", 11, MUTED, anchor="start")

# ---- Administrator <-> processes -------------------------------------------
ADM_L = (1298, 444)
ADM_R = (1298, 496)
s += flow(ADM_L, edge(APX, AY[0], R, *ADM_L), "catalogue edits", t=0.46, dy=-9)
s += flow(edge(APX, AY[0] + 22, R, *ADM_R), ADM_R, "save result", t=0.52, dy=15)
s += flow(ADM_L, edge(APX, AY[1] - 12, R, *ADM_L), "order actions", t=0.46, dy=-9)
s += flow(edge(APX, AY[1] + 18, R, *ADM_R), ADM_R, "order queue", t=0.52, dy=16)
s += flow(ADM_L, edge(APX, AY[2], R, *ADM_L), "report request", t=0.44, dy=-9)
s += flow(edge(APX, AY[2] + 22, R, *ADM_R), ADM_R, "dashboard figures", t=0.54, dy=16)

s += caption(W, 876, "Seven processes, with the four persistent stores placed between the customer-facing processes on the left and the administrative processes on the right.")
write("fig-5-2-dfd-level-1", s)
