"""Entity-relationship diagram and the document/collection schema map."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from _build import *

# ============================ Figure 5.5  ER diagram ========================
W, H = 1340, 900
s = header(W, H, "ER diagram")
s += txt(W/2, 36, "Figure 5.5   Entity–Relationship Diagram", 16, INK, "700")

def entity(x, y, w, title, rows, key_rows=()):
    """Rectangle listing an entity's attributes; key attributes underlined."""
    rh = 22
    h = 40 + rh * len(rows)
    out = (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="#ffffff" '
           f'stroke="{BRAND}" stroke-width="1.8"/>\n'
           f'<rect x="{x}" y="{y}" width="{w}" height="34" rx="8" fill="{FILL}" '
           f'stroke="{BRAND}" stroke-width="1.8"/>\n'
           f'<rect x="{x}" y="{y+26}" width="{w}" height="8" fill="{FILL}"/>\n'
           f'<line x1="{x}" y1="{y+34}" x2="{x+w}" y2="{y+34}" stroke="{BRAND}" stroke-width="1.8"/>\n')
    out += txt(x + w/2, y + 23, title, 14, INK, "700")
    for i, r in enumerate(rows):
        ty = y + 34 + rh * (i + 1) - 6
        out += txt(x + 14, ty, r, 12, INK if r in key_rows else MUTED, "600" if r in key_rows else "400", anchor="start")
        if r in key_rows:
            out += (f'<line x1="{x+14}" y1="{ty+3}" x2="{x+14+len(r)*6.4}" y2="{ty+3}" '
                    f'stroke="{INK}" stroke-width="1"/>\n')
    return out, h

def diamond(cx, cy, label, rw=78, rh=34):
    pts = f"{cx},{cy-rh} {cx+rw},{cy} {cx},{cy+rh} {cx-rw},{cy}"
    out = f'<polygon points="{pts}" fill="{GFILL}" stroke="{GREEN}" stroke-width="1.6"/>\n'
    out += txt(cx, cy + 4, label, 12, INK, "600")
    return out

def card(x, y, text):
    return txt(x, y, text, 12, AMBER, "700")

e1, h1 = entity(60, 110, 240, "USER", ["_id", "name", "email", "password", "role", "address", "isActive", "createdAt"], {"_id", "email"})
e2, h2 = entity(1040, 110, 240, "CATEGORY", ["_id", "name", "slug", "description", "isActive"], {"_id", "name", "slug"})
e3, h3 = entity(1040, 420, 240, "PRODUCT", ["_id", "title", "description", "brand", "price", "mrp", "stockCount", "imageUrl", "categoryId", "isActive"], {"_id"})
e4, h4 = entity(60, 470, 240, "ORDER", ["_id", "invoiceNo", "userId", "itemsTotal", "shippingFee", "taxAmount", "totalPrice", "status", "payment", "placedAt"], {"_id", "invoiceNo"})
e5, h5 = entity(570, 614, 240, "ORDER_ITEM", ["orderId", "productId", "title", "unitPrice", "quantity", "lineTotal"], {"orderId", "productId"})
s += e1 + e2 + e3 + e4 + e5

# USER --places--> ORDER
s += diamond(180, 390, "places")
s += arrow(180, 110 + h1, 180, 356, None, LINE); s += card(196, 340, "1")
s += arrow(180, 424, 180, 466, None, LINE); s += card(196, 452, "M")

# ORDER --contains--> ORDER_ITEM
s += diamond(430, 700, "contains")
s += arrow(302, 700, 348, 700, None, LINE); s += card(318, 690, "1")
s += arrow(510, 700, 564, 700, None, LINE); s += card(532, 690, "M")

# ORDER_ITEM --refers to--> PRODUCT
s += diamond(935, 700, "refers to", 72)
s += arrow(812, 700, 859, 700, None, LINE); s += card(830, 690, "M")
s += poly([(1009, 700), (1160, 700), (1160, 420 + h3)], colour=LINE)
s += card(1176, 650, "1")

# CATEGORY --classifies--> PRODUCT
s += diamond(1160, 330, "classifies", 74)
s += arrow(1160, 110 + h2, 1160, 296, None, LINE); s += card(1176, 280, "1")
s += arrow(1160, 364, 1160, 416, None, LINE); s += card(1176, 400, "M")

s += lines(670, 200, [
    "Cardinality notation",
    "1 : M  read as “one … many”.",
    "",
    "ORDER_ITEM is an embedded sub-document array inside ORDER,",
    "not a separate collection. It is drawn as a weak entity because it",
    "has no independent existence: its identity is (orderId, productId).",
    "",
    "The line snapshots title and unitPrice at the moment of sale so a",
    "later price change cannot rewrite a historical invoice.",
], 12, MUTED, lh=19)

s += caption(W, 876, "Four collections and one embedded sub-document array. Relationships are carried by ObjectId reference fields rather than by foreign-key constraints.")
write("fig-5-5-er-diagram", s)
