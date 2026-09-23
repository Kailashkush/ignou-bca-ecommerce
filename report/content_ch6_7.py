"""Chapters 6–7: Design Documents; Coding."""
import pathlib

SRC = pathlib.Path.home() / 'Desktop/ignou-bca-project/ecommerce-app'


def snippet(relative_path, start_marker=None, end_marker=None, dedent=0):
    """Pulls a fragment out of a real source file so the report cannot drift
    away from the code it documents."""
    text = (SRC / relative_path).read_text()
    if start_marker:
        idx = text.index(start_marker)
        text = text[idx:]
    if end_marker:
        text = text[:text.index(end_marker)]
    lines = text.rstrip().split('\n')
    if dedent:
        lines = [ln[dedent:] if len(ln) > dedent else ln for ln in lines]
    return '\n'.join(lines)


def build(r):
    # ==================== 6. DESIGN DOCUMENTS =============================
    r.h1('6.  SYSTEM DESIGN — DESIGN DOCUMENTS')

    r.h2('6.1  Modularisation')
    r.p('The system divides into five functional modules beneath a single application shell. '
        'Each module owns its routes, its controller, its service logic and its data model, '
        'so a change confined to one module does not ripple into the others.')

    r.figure('fig-6-2-module-hierarchy.png',
             'Module hierarchy. Each module owns its controller, service logic and data model.',
             width_inches=5.7)

    r.table(
        ['Module', 'Responsibility', 'Principal components', 'Coupling'],
        [['Identity', 'Registration, authentication, session establishment, profile and '
                      'password maintenance.',
          '`authController`, `auth` middleware, `token` utility, `User` model',
          'Depended on by every other module through the `protect` middleware; depends on none '
          'of them.'],
         ['Catalogue', 'Product and category storage, search, filtering, sorting, pagination '
                       'and administrator maintenance.',
          '`productController`, `categoryController`, `catalogService`, `Product` and '
          '`Category` models',
          'Depends on Identity for administrator route protection only.'],
         ['Cart', 'Holds the cart in the browser and mirrors it to local storage.',
          '`CartContext`, cart reducer', 'Client-side only; communicates with the server '
                                         'solely by submitting product identifiers and '
                                         'quantities.'],
         ['Checkout', 'Re-pricing, stock reservation, payment authorisation, order '
                      'persistence, cancellation.',
          '`orderController`, `checkoutService`, `paymentService`, `Order` model',
          'Depends on Catalogue for prices and stock, and on Identity for the purchaser.'],
         ['Administration', 'Analytics aggregation, customer account administration, order '
                            'fulfilment.',
          '`adminController`, `calendar` utility, aggregation pipelines',
          'Reads from all three data-owning modules; is depended on by none.']],
        caption='Modules, responsibilities and coupling',
        widths=[0.75, 1.5, 1.2, 1.4], font_size=8.5)

    r.p('The dependency direction is deliberate and one-way. Identity is depended upon but '
        'depends on nothing; Administration depends on the others but nothing depends on it. '
        'There are no cycles, which is what allows any single module to be unit tested without '
        'starting the others.')

    r.h2('6.2  Database Design')

    r.h3('6.2.1  Collections')
    r.p('The database holds four collections. Their fields are catalogued in Section 5.6; this '
        'section covers the design decisions behind them.')

    r.table(
        ['Collection', 'Approximate document size', 'Growth', 'Write frequency'],
        [['users', '350 bytes', 'One per registered customer', 'Low — on registration and '
                                                               'profile change'],
         ['categories', '200 bytes', 'Fixed and small (six in the seeded data)', 'Very low'],
         ['products', '900 bytes', 'One per catalogue item', 'Low for content; high for '
                                                             '`stockCount`, which changes on '
                                                             'every sale'],
         ['orders', '1.2 KB', 'One per order — the fastest-growing collection', 'Write once, '
                                                                                'then a small '
                                                                                'number of '
                                                                                'status '
                                                                                'updates']],
        caption='Collection characteristics',
        widths=[0.8, 1.0, 1.3, 1.3], font_size=8.5)

    r.h3('6.2.2  Normalisation')
    r.p('Normalisation is a relational concept, and applying it to a document store requires '
        'some care. The underlying goal — eliminating update anomalies caused by storing the '
        'same fact in more than one place — still applies, so the design is examined against '
        'the first three normal forms, with the places where it deliberately departs from them '
        'identified and justified.')

    r.table(
        ['Form', 'Requirement', 'Position in this design'],
        [['1NF', 'Atomic attribute values; no repeating groups.',
          'Scalar fields are atomic. The `items` array in an order is a repeating group in '
          'relational terms and would be a separate table in a relational schema. It is '
          'retained here because a document store supports arrays natively and because order '
          'lines are always read with their order.'],
         ['2NF', 'No partial dependency on part of a composite key.',
          'Satisfied. Every collection has a single-attribute key (`_id`), so partial '
          'dependency cannot arise.'],
         ['3NF', 'No transitive dependency of a non-key attribute on another non-key '
                 'attribute.',
          'Satisfied for users, categories and products. Orders deliberately depart from it: '
          '`items[].title` and `items[].unitPrice` are duplicated from the product document '
          'and therefore depend transitively on `items[].product`.']],
        caption='The design assessed against the first three normal forms',
        widths=[0.4, 1.3, 2.6], font_size=8.5)

    r.p('The departure in the orders collection is the interesting one, and it is worth being '
        'explicit that it is a departure rather than presenting the schema as fully normalised.')
    r.p('An order is a financial record. If an order line held only a reference to the product, '
        'then an administrator correcting a typographical error in a product title — or, more '
        'seriously, changing its price — would silently rewrite every historical invoice that '
        'referenced it. A customer printing a six-month-old invoice would see a price they had '
        'never paid. Denormalising the title and unit price into the line makes the order '
        'document a faithful snapshot of the transaction as it occurred. The product reference '
        'is retained alongside the snapshot so the catalogue entry can still be reached.')
    r.p('The update anomaly that normalisation exists to prevent does not arise here, because '
        'the duplicated values are immutable once written. They are never updated, only read. '
        'This is the standard justification for denormalising a historical record, and it is a '
        'considered trade-off rather than an oversight.')

    r.h3('6.2.3  Index design')
    r.p('Every index in the system exists to serve a specific query, and each is justified '
        'below. Indexes are not free: each one consumes storage and slows writes, so an index '
        'that serves no actual query is a cost with no benefit.')

    r.table(
        ['Collection', 'Index', 'Type', 'Query it serves'],
        [['users', '`{ email: 1 }`', 'Unique',
          'Sign-in lookup by email, and enforcement of one account per address. The uniqueness '
          'constraint is the real guarantee against a duplicate registration created by two '
          'concurrent requests.'],
         ['categories', '`{ name: 1 }`, `{ slug: 1 }`', 'Unique',
          'Category lookup and prevention of duplicates.'],
         ['products', '`{ title: text, brand: text, description: text }` with weights 10, 5, 1',
          'Weighted text',
          'Keyword search. The weighting makes a match in the title rank above the same word '
          'appearing only in the body text.'],
         ['products', '`{ category: 1, price: 1 }`', 'Compound',
          '"Browse a category, ordered by price" — the most common catalogue access path. The '
          'compound order matters: the equality field comes first, the range field second.'],
         ['products', '`{ createdAt: -1 }`', 'Single field',
          'The default "newest first" listing, served as an index scan rather than an '
          'in-memory sort.'],
         ['products', '`{ isActive: 1 }`', 'Single field',
          'Excluding soft-deleted products, which every public catalogue query does.'],
         ['orders', '`{ invoiceNo: 1 }`', 'Unique',
          'Invoice lookup, and a database-level guarantee that two orders cannot share a '
          'number even if the random generator were to collide.'],
         ['orders', '`{ user: 1, placedAt: -1 }`', 'Compound',
          '"My orders, newest first" — the single most frequent order query. Serving both the '
          'filter and the sort from one index avoids a sort stage entirely.'],
         ['orders', '`{ status: 1, placedAt: -1 }`', 'Compound',
          'The administrator’s order queue filtered by status.']],
        caption='Indexes and the queries they serve',
        widths=[0.6, 1.4, 0.6, 1.7], font_size=8.5)

    r.h3('6.2.4  Data integrity and constraints')
    r.p('MongoDB enforces no foreign keys, so referential integrity is the application’s '
        'responsibility. Rather than leaving that implicit, every constraint is listed below '
        'with the mechanism that enforces it and the test that proves it.')

    r.table(
        ['Constraint', 'Enforcement mechanism', 'Test case'],
        [['Email addresses are unique across accounts',
          'Unique index on `users.email`, with the value lower-cased at write time',
          'TC-U-40, TC-I-03'],
         ['Passwords are never stored in recoverable form',
          'A pre-save hook hashes the field whenever it changes; `select: false` keeps it out '
          'of query results', 'TC-U-37, TC-U-38, TC-I-02'],
         ['A product must belong to an existing, active category',
          'Checked in the controller before create and before update', 'TC-I-31'],
         ['A category holding active products cannot be deleted',
          'Referencing products are counted and the delete refused if any exist', 'TC-I-35'],
         ['Stock can never fall below zero',
          'Schema minimum of 0, plus the conditional atomic decrement which matches no document '
          'when stock is insufficient', 'TC-U-36, TC-I-41, TC-I-45'],
         ['Prices and stock counts are whole numbers',
          'A schema setter rounds price on write; an integer validator rejects fractional '
          'stock', 'TC-U-43, TC-U-44'],
         ['An order must contain at least one line',
          'Array validator on `orders.items`', 'TC-U-25'],
         ['Quantity per product is capped at 10',
          'Schema maximum, plus cart normalisation that merges duplicate lines before applying '
          'the cap', 'TC-U-29'],
         ['Invoice numbers are unique',
          'Unique index on `orders.invoiceNo`, with 24 bits of cryptographic randomness in the '
          'suffix', 'TC-U-48'],
         ['Order status follows the defined state machine',
          'The transition table is declared on the Order model and checked before every change',
          'TC-U-47, TC-I-52'],
         ['A withdrawn product remains resolvable from historical orders',
          'Deletion is a soft delete that clears `isActive` rather than removing the document',
          'TC-I-32'],
         ['Order totals equal the sum of their parts',
          'Tax is rounded to whole rupees at computation time, so the printed figures balance '
          'exactly', 'TC-U-30, TC-I-37']],
        caption='Integrity constraints, their enforcement and their tests',
        widths=[1.4, 2.0, 0.75], font_size=8.5)

    r.h2('6.3  Procedural Design')
    r.p('This section sets out the algorithms behind the three operations that carry the most '
        'logic. Each is given first as pseudocode and then as the actual implementation, so '
        'the design and the code can be compared directly.')

    r.h3('6.3.1  Authentication and request authorisation')
    r.code(
        'ALGORITHM  AuthenticateRequest\n'
        'INPUT      HTTP request\n'
        'OUTPUT     req.user, or an error response\n'
        '\n'
        '1.  token <- extract bearer token from the Authorization header\n'
        '2.  IF token is absent THEN\n'
        '3.      RETURN 401 "Authentication is required"\n'
        '4.  TRY\n'
        '5.      payload <- verify signature and expiry of token using JWT_SECRET\n'
        '6.  CATCH expired  -> RETURN 401 "Your session has expired"\n'
        '7.  CATCH invalid  -> RETURN 401 "Invalid authentication token"\n'
        '8.  user <- read users collection by payload.sub          // live read, not the token\n'
        '9.  IF user does not exist THEN RETURN 401\n'
        '10. IF user.isActive is false THEN RETURN 403 "Account deactivated"\n'
        '11. req.user <- user\n'
        '12. CONTINUE to the next middleware\n'
        '\n'
        'ALGORITHM  RestrictTo(allowedRoles)\n'
        '1.  IF req.user is absent THEN RETURN 401\n'
        '2.  IF req.user.role NOT IN allowedRoles THEN RETURN 403\n'
        '3.  CONTINUE',
        caption='Algorithm 1 — request authentication and role restriction')

    r.p('Step 8 is the design decision worth noting. The token already carries the user '
        'identifier and role, so the database read could be skipped. It is performed anyway '
        'because trusting the token payload alone would mean a deactivated account continued '
        'to work until its token expired — up to seven days. Re-reading costs one indexed '
        'lookup and makes deactivation effective on the very next request, which test case '
        'TC-I-62 demonstrates.')

    r.h3('6.3.2  Checkout: pricing and atomic stock reservation')
    r.p('This is the most important algorithm in the system, and the one where a naive '
        'implementation fails in ways that manual testing does not reveal.')

    r.code(
        'ALGORITHM  PlaceOrder\n'
        'INPUT      rawItems, shippingAddress, paymentMethod, card\n'
        'OUTPUT     order document, or an error\n'
        '\n'
        '1.  items <- NormaliseCart(rawItems)          // validate, merge duplicates, cap qty\n'
        '2.  quote <- PriceCart(items)                 // authoritative prices from the DB\n'
        '3.  reserved <- empty list\n'
        '4.  FOR EACH line IN quote.lines DO\n'
        '5.      ok <- AtomicReserve(line.product, line.quantity)\n'
        '6.      IF NOT ok THEN\n'
        '7.          FOR EACH r IN reserved DO AtomicRelease(r.product, r.quantity)\n'
        '8.          RETURN 409 "<title> went out of stock"\n'
        '9.      append line to reserved\n'
        '10. TRY\n'
        '11.     payment <- AuthorisePayment(card, quote.totalPrice)\n'
        '12. CATCH declined\n'
        '13.     FOR EACH r IN reserved DO AtomicRelease(r.product, r.quantity)\n'
        '14.     RETURN 422 "payment declined"\n'
        '15. invoiceNo <- "INV-" + yyyymmdd + "-" + 6 random hex characters\n'
        '16. status <- CONFIRMED IF payment.status = PAID ELSE PENDING\n'
        '17. WRITE order { invoiceNo, user, quote.lines, totals, address, payment, status }\n'
        '18. RETURN 201 with the order\n'
        '\n'
        'SUBROUTINE  AtomicReserve(productId, qty)\n'
        '1.  result <- findOneAndUpdate(\n'
        '        filter: { _id: productId, isActive: true, stockCount: { $gte: qty } },\n'
        '        update: { $inc: { stockCount: -qty } } )\n'
        '2.  RETURN (result IS NOT NULL)\n'
        '\n'
        'SUBROUTINE  PriceCart(items)\n'
        '1.  products <- find products by the identifiers in items, where isActive\n'
        '2.  FOR EACH item DO\n'
        '3.      IF product not found     THEN RETURN 404 "no longer available"\n'
        '4.      IF stockCount < quantity THEN RETURN 409 "only N remain"\n'
        '5.      lineTotal <- product.price * quantity      // price from the DB, not the client\n'
        '6.  itemsTotal  <- sum of lineTotal\n'
        '7.  shippingFee <- 0 IF itemsTotal >= 500 ELSE 49\n'
        '8.  taxAmount   <- round(itemsTotal * 0.18)\n'
        '9.  RETURN lines, itemsTotal, shippingFee, taxAmount, itemsTotal+shippingFee+taxAmount',
        caption='Algorithm 2 — order placement with atomic stock reservation')

    r.p('Two properties of this algorithm are worth drawing out.')
    r.p('**The predicate and the update are one operation.** The obvious implementation of a '
        'stock decrement is to read the current count, compare it with the quantity wanted, '
        'and write the reduced figure back. Between the read and the write there is a window '
        'in which a second request can perform its own read and see the same stock. Both '
        'requests then believe the stock is available and both write, and the store has sold '
        'one more unit than it has. The window is small — a few milliseconds — which is '
        'precisely why manual testing never finds the defect.')
    r.p('Expressing the check as part of the update closes the window. MongoDB guarantees that '
        'an update to a single document is atomic, so no other writer can interleave between '
        'the filter being evaluated and the increment being applied. The request that loses '
        'the race matches no document, receives `null`, and is told the item is out of stock. '
        'Test case TC-U-36 fires ten simultaneous reservations against a product with one unit '
        'in stock and asserts that exactly one succeeds and nine are rejected; TC-I-45 does '
        'the same through the HTTP layer with two concurrent customers.')
    r.p('**Failure leaves no trace.** An order spans several documents, so all-or-nothing '
        'behaviour must be arranged explicitly. Where the deployment is a replica set, a real '
        'multi-document transaction is used and the abort undoes the writes. On a standalone '
        '`mongod`, which does not support transactions and is the usual development '
        'configuration, the service falls back to a compensating-action pattern: every '
        'reservation already taken is released before the error is returned. The caller does '
        'not need to know which mode is in force, because both are hidden behind one helper. '
        'Test case TC-U-35 asserts the rollback directly, and TC-I-40 asserts that a declined '
        'payment leaves stock unchanged and writes no order.')

    r.p('The implementation of the reservation subroutine is reproduced below exactly as it '
        'appears in the source.')
    r.code(snippet('server/src/services/checkoutService.js',
                   '/**\n * Atomically decrements stock for one line.',
                   '/** Returns previously reserved units'),
           caption='Listing 1 — services/checkoutService.js, the atomic reservation',
           size=8.0)

    r.h3('6.3.3  Catalogue search and filter construction')
    r.code(
        'ALGORITHM  BuildProductQuery(queryString)\n'
        'OUTPUT     filter, sort, page, limit, skip\n'
        '\n'
        '1.  filter <- { isActive: true }\n'
        '2.  keyword <- trim(queryString.q) IF it is a string ELSE ""\n'
        '3.  IF keyword is not empty THEN\n'
        '4.      filter.$text <- { $search: first 100 characters of keyword }\n'
        '5.      usedTextSearch <- true\n'
        '6.  IF queryString.category parses as a valid ObjectId THEN\n'
        '7.      filter.category <- ObjectId(queryString.category)\n'
        '        // anything else is ignored, never passed through\n'
        '8.  min <- parseInt(queryString.minPrice);  max <- parseInt(queryString.maxPrice)\n'
        '9.  IF min is finite and >= 0 THEN priceFilter.$gte <- min\n'
        '10. IF max is finite and >= 0 THEN priceFilter.$lte <- max\n'
        '11. IF both present AND min > max THEN discard both      // an inverted band would\n'
        '                                                          // silently return nothing\n'
        '12. IF queryString.inStock = "true" THEN filter.stockCount <- { $gt: 0 }\n'
        '13. IF queryString.sort is a key of the SORT_OPTIONS whitelist THEN\n'
        '14.     sort <- SORT_OPTIONS[queryString.sort]\n'
        '15. ELSE IF usedTextSearch THEN sort <- { score: { $meta: "textScore" } }\n'
        '16. ELSE sort <- { createdAt: -1 }\n'
        '17. page  <- parseInt(queryString.page)  IF valid and > 0 ELSE 1\n'
        '18. limit <- min(parseInt(queryString.limit), 48) IF valid and > 0 ELSE 12\n'
        '19. RETURN filter, sort, page, limit, (page-1) * limit',
        caption='Algorithm 3 — construction of the catalogue query')

    r.p('Every line that consumes user input coerces it to an expected type before use. An '
        'identifier is accepted only if it parses as an ObjectId; a price bound only if it '
        'parses as an integer; a sort key only if it appears in a whitelist; a page size only '
        'after being capped at 48. A raw string is never handed to MongoDB, which is what '
        'prevents a query parameter carrying an operator object from reaching the engine. The '
        'cap at step 18 is equally deliberate: without it, a request for a page of one million '
        'items would be honoured and would exhaust server memory.')
    r.p('Step 11 addresses a usability failure rather than a security one. A price band whose '
        'minimum exceeds its maximum matches nothing, and a user who types the two figures the '
        'wrong way round would see an empty catalogue with no explanation. Discarding the '
        'inverted band shows the unfiltered catalogue instead, which is the more useful '
        'behaviour. Test case TC-U-19 covers it.')

    r.h3('6.3.4  Order status transitions')
    r.p('Order status is governed by an explicit state machine rather than by scattered '
        '`if` statements. The transition table is declared once on the Order model, so every '
        'code path that changes a status is bound by the same rules.')

    r.figure('fig-6-1-order-states.png',
             'Order status state machine. DELIVERED and CANCELLED are terminal states.',
             width_inches=5.6)

    r.code(snippet('server/src/models/Order.js',
                   '/**\n * Legal status transitions.',
                   'orderSchema.statics.ORDER_STATUSES'),
           caption='Listing 2 — models/Order.js, the transition table',
           size=8.5)

    r.p('Declaring the table in one place has a practical consequence in the interface: the '
        'administrator’s order queue renders a button only for a transition the server '
        'will accept, so an invalid state cannot be reached by clicking the wrong control. The '
        'server still validates, because the interface is not a security boundary, but the two '
        'never disagree.')

    r.h2('6.4  User Interface Design')

    r.h3('6.4.1  Principles applied')
    r.bullets([
        '**A fluid grid rather than breakpoint-driven layouts.** The catalogue uses CSS Grid '
        'with `repeat(auto-fill, minmax(220px, 1fr))`, so the column count adapts to the '
        'viewport without a media query deciding it. Media queries are reserved for the few '
        'places where the structure itself has to change — the filter sidebar, the navigation '
        'bar and the administration tables.',
        '**State in the URL, not only in memory.** Every catalogue filter, sort order and page '
        'number lives in the query string. A search result can therefore be bookmarked and '
        'shared, the browser back button behaves as the user expects, and a page refresh '
        'returns the same results.',
        '**Report every validation failure at once.** The API collects all validation failures '
        'in one pass and returns them together with the field each concerns, so a user '
        'correcting a form is not sent round the loop once per mistake.',
        '**Distinguish empty from loading.** A screen fetching data shows skeleton placeholders '
        'shaped like the content that is coming; a screen with genuinely nothing to show says '
        'so and offers the next action.',
        '**Keyboard access and a visible focus ring.** The default focus outline is replaced '
        'with a higher-contrast one rather than removed, so keyboard users can see where they '
        'are.',
        '**Honour a reduced-motion preference.** Decorative transitions are disabled under '
        '`prefers-reduced-motion`.',
        '**Never offer an action that will be refused.** Out-of-stock products show a disabled '
        'control rather than one that fails on click; an order past despatch shows no cancel '
        'button; the order queue offers only legal status transitions.',
    ])

    r.h3('6.4.2  Screen inventory')
    r.table(
        ['Area', 'Screens'],
        [['Public', 'Home, catalogue listing, product detail, shopping cart, sign in, '
                    'register, page not found'],
         ['Customer', 'Checkout, order confirmation, order history, order detail, profile'],
         ['Administration', 'Dashboard, products, product form, categories, orders, customers'],
         ['Shared components', 'Navigation bar with search and cart badge, footer, pagination, '
                               'alert, toast notification, loading skeleton, empty state, '
                               'quantity stepper, product card, route guard']],
        caption='Screen inventory',
        widths=[0.9, 3.4], font_size=8.5)

    r.h3('6.4.3  Responsive behaviour')
    r.table(
        ['Viewport', 'Catalogue grid', 'Structural change'],
        [['1200 px and above', '4–5 columns',
          'Filter sidebar fixed at 250 px; dashboard in two columns'],
         ['1000–1199 px', '3–4 columns', 'Unchanged'],
         ['720–999 px', '2–3 columns',
          'Filter sidebar moves above the results; dashboard becomes one column; '
          'administration navigation becomes a horizontal scroller'],
         ['Below 720 px', '2 columns at a 150 px minimum',
          'Navigation labels collapse to icons; the brand word mark is hidden; forms become '
          'single column; cart lines reflow to two rows']],
        caption='Responsive behaviour by viewport width',
        widths=[0.9, 1.0, 2.4], font_size=8.5)

    r.h2('6.5  API Design')
    r.p('The server exposes a REST API over five namespaces. '
        + r.ref_table('Complete API endpoint specification') + ' is the complete '
        'endpoint specification.')

    r.table(
        ['Method and path', 'Access', 'Purpose'],
        [['`POST /api/auth/register`', 'Public', 'Create a customer account; returns a token'],
         ['`POST /api/auth/login`', 'Public', 'Authenticate; returns a token'],
         ['`GET /api/auth/me`', 'Authenticated', 'Current user — used to restore a session'],
         ['`PATCH /api/auth/me`', 'Authenticated', 'Update own name and default address'],
         ['`PATCH /api/auth/me/password`', 'Authenticated', 'Change own password'],
         ['`GET /api/categories`', 'Public', 'Active categories with live product counts'],
         ['`POST /api/categories`', 'Admin', 'Create a category'],
         ['`PATCH /api/categories/:id`', 'Admin', 'Amend a category'],
         ['`DELETE /api/categories/:id`', 'Admin', 'Delete a category, if empty'],
         ['`GET /api/products`', 'Public', 'Catalogue listing with search, filter, sort, page'],
         ['`GET /api/products/:id`', 'Public', 'Product detail'],
         ['`GET /api/products/:id/related`', 'Public', 'Up to four related in-stock products'],
         ['`POST /api/products`', 'Admin', 'Create a product'],
         ['`PATCH /api/products/:id`', 'Admin', 'Amend a product'],
         ['`DELETE /api/products/:id`', 'Admin', 'Withdraw a product (soft delete)'],
         ['`PATCH /api/products/:id/stock`', 'Admin', 'Set stock to an absolute figure'],
         ['`POST /api/orders/quote`', 'Authenticated', 'Re-price a cart without placing an order'],
         ['`POST /api/orders`', 'Authenticated', 'Place an order'],
         ['`GET /api/orders/my`', 'Authenticated', 'Own order history, paginated'],
         ['`GET /api/orders/:id`', 'Owner or admin', 'Order detail'],
         ['`PATCH /api/orders/:id/cancel`', 'Owner or admin', 'Cancel before despatch'],
         ['`GET /api/orders`', 'Admin', 'All orders, optionally filtered by status'],
         ['`PATCH /api/orders/:id/status`', 'Admin', 'Advance status within the state machine'],
         ['`GET /api/admin/dashboard`', 'Admin', 'Aggregated analytics'],
         ['`GET /api/admin/users`', 'Admin', 'Customer accounts, searchable and paginated'],
         ['`PATCH /api/admin/users/:id/status`', 'Admin', 'Activate or deactivate an account'],
         ['`GET /api/health`', 'Public', 'Liveness check']],
        caption='Complete API endpoint specification',
        widths=[1.6, 0.8, 1.9], font_size=8.5)

    r.p('Every response shares one envelope, so a client never has to guess the shape of what '
        'it received:')
    r.code('// success\n'
           '{ "success": true,  "message": "…", "data": { … } }\n'
           '\n'
           '// failure\n'
           '{ "success": false, "message": "…", "details": [ { "field": "…", "message": "…" } ] }',
           caption='Listing 3 — the uniform response envelope', size=9.0)

    # ==================== 7. CODING =======================================
    r.h1('7.  CODING')

    r.h2('7.1  Coding Standards Adopted')
    r.p('A consistent set of conventions was applied throughout, both because the BCSP-064 '
        'guidelines call for standardisation of coding and because consistency is what makes a '
        '9,000-line code base navigable by one person over several months.')

    r.table(
        ['Area', 'Convention adopted'],
        [['Indentation', 'Two spaces, no tabs, throughout both server and client.'],
         ['Naming — variables and functions', '`camelCase`, with names that state intent: '
                                              '`reserveStock`, `normaliseCartItems`, '
                                              '`toLocalDateKey`.'],
         ['Naming — classes and models', '`PascalCase`: `ApiError`, `User`, `Product`, '
                                         '`Order`.'],
         ['Naming — constants', '`UPPER_SNAKE_CASE` for module-level constants: '
                                '`SALT_ROUNDS`, `PRICING_RULES`, `MAX_LIMIT`.'],
         ['Naming — React components', '`PascalCase` file and component names; one component '
                                       'per file.'],
         ['File organisation (server)', 'Strict separation into `config`, `models`, '
                                        '`middleware`, `services`, `controllers`, `routes`, '
                                        '`utils`.'],
         ['File organisation (client)', 'Separation into `api`, `context`, `components`, '
                                        '`pages`, `utils`, `styles`.'],
         ['Asynchronous code', '`async` / `await` throughout; no raw promise chains and no '
                               'callbacks.'],
         ['Error handling', 'Controllers throw `ApiError`; a single middleware converts every '
                            'error into the response envelope. No controller formats an error '
                            'itself.'],
         ['Comments', 'Every module opens with a block comment stating its purpose. Inline '
                      'comments explain **why**, not what — the code already states what.'],
         ['Line length', 'Approximately 100 characters.'],
         ['Magic numbers', 'Avoided. Business rules live in named constants: '
                           '`FREE_SHIPPING_THRESHOLD`, `TAX_RATE`, `MAX_QTY_PER_ITEM`.'],
         ['Imports', 'Grouped: Node built-ins, then third-party packages, then local modules.']],
        caption='Coding conventions applied',
        widths=[1.1, 3.2], font_size=8.5)

    r.h2('7.2  Project Directory Structure')
    r.code(
        'ecommerce-app/\n'
        '├── server/                          Node.js + Express REST API\n'
        '│   ├── src/\n'
        '│   │   ├── config/\n'
        '│   │   │   ├── env.js                Validated environment configuration\n'
        '│   │   │   └── db.js                 Connection management; transaction capability probe\n'
        '│   │   ├── models/\n'
        '│   │   │   ├── User.js               Schema, password hashing hook, comparison method\n'
        '│   │   │   ├── Category.js           Schema with slug derivation\n'
        '│   │   │   ├── Product.js            Schema, text and compound indexes, virtuals\n'
        '│   │   │   └── Order.js              Schema, embedded lines, state-transition table\n'
        '│   │   ├── middleware/\n'
        '│   │   │   ├── auth.js               protect, restrictTo, optionalAuth\n'
        '│   │   │   ├── validate.js           express-validator bridge\n'
        '│   │   │   ├── rateLimiter.js        API and authentication request budgets\n'
        '│   │   │   └── errorHandler.js       Central error normalisation and 404 handler\n'
        '│   │   ├── services/\n'
        '│   │   │   ├── catalogService.js     Query-string to Mongo filter construction\n'
        '│   │   │   ├── checkoutService.js    Pricing, atomic reservation, compensation\n'
        '│   │   │   └── paymentService.js     Simulated gateway; Luhn and expiry validation\n'
        '│   │   ├── controllers/              One per module\n'
        '│   │   ├── routes/                   Validation rules beside each route\n'
        '│   │   ├── utils/\n'
        '│   │   │   ├── ApiError.js           Error type carrying an HTTP status\n'
        '│   │   │   ├── asyncHandler.js       Forwards rejected promises to next()\n'
        '│   │   │   ├── token.js              JWT sign and verify\n'
        '│   │   │   ├── invoice.js            Cryptographically random invoice numbers\n'
        '│   │   │   ├── calendar.js           Timezone-correct calendar-day helpers\n'
        '│   │   │   └── slugify.js            URL-safe slug derivation\n'
        '│   │   ├── seed/                     Demonstration data\n'
        '│   │   ├── app.js                    Middleware assembly; exported unstarted\n'
        '│   │   └── server.js                 Port binding and graceful shutdown\n'
        '│   └── tests/\n'
        '│       ├── setup.js                  In-memory MongoDB lifecycle\n'
        '│       ├── helpers.js                Shared fixtures\n'
        '│       ├── unit/                     5 suites,  55 cases\n'
        '│       ├── integration/              4 suites,  69 cases\n'
        '│       └── system/                   1 suite,    5 cases\n'
        '└── client/                           React 18 single-page application\n'
        '    ├── public/                       Favicon and bundled product illustrations\n'
        '    └── src/\n'
        '        ├── api/                      Axios instance and endpoint wrappers\n'
        '        ├── context/                  Auth, Cart and Toast providers\n'
        '        ├── components/               Reusable presentational components\n'
        '        ├── pages/                    22 screens, including pages/admin/\n'
        '        ├── utils/                    Currency, date and status formatting\n'
        '        ├── styles/global.css         Design tokens, fluid grid, responsive rules\n'
        '        ├── App.jsx                   Route table\n'
        '        └── main.jsx                  Entry point and provider composition',
        caption='Listing 4 — project directory structure', size=7.8)

    r.h2('7.3  Selected Implementation Listings')
    r.p('The complete source is reproduced in Appendix A. This section presents the listings '
        'that carry the design decisions discussed in Chapter 6, each with an explanation of '
        'what it does and why it is written that way.')

    r.h3('7.3.1  Password storage')
    r.code(snippet('server/src/models/User.js',
                   '/**\n * Hash the password before every save',
                   'module.exports ='),
           caption='Listing 5 — models/User.js, password hashing and verification', size=8.2)
    r.p('Three points. The guard on `isModified` prevents an already-hashed value being hashed '
        'a second time when an unrelated field such as `lastLoginAt` is saved — without it, '
        'the stored hash would be destroyed on the user’s next sign-in. A work factor of '
        'twelve costs roughly a quarter of a second per hash, which is negligible on a login '
        'but makes an offline brute-force attempt expensive. And `bcrypt.compare` performs a '
        'constant-time comparison, so the time taken to reject a wrong password reveals '
        'nothing about how much of it was correct.')

    r.h3('7.3.2  Central error handling')
    r.code(snippet('server/src/middleware/errorHandler.js',
                   '/**\n * Translates driver- and Mongoose-specific errors',
                   '// eslint-disable-next-line no-unused-vars'),
           caption='Listing 6 — middleware/errorHandler.js, error normalisation', size=8.0)
    r.p('Converging every failure on one handler gives a single place to decide what the client '
        'is allowed to see. Driver messages, stack traces and the shape of a failing query are '
        'logged on the server but never returned in production, because each of them helps an '
        'attacker map the system. The same function also translates Mongoose validation '
        'failures and duplicate-key violations into the field-level detail list the interface '
        'renders, so a 409 on a duplicate email arrives as a sentence the user can act on '
        'rather than as `E11000 duplicate key error collection`.')

    r.h3('7.3.3  Client-side cart state')
    r.code(snippet('client/src/context/CartContext.jsx',
                   '/** Reads the persisted cart, discarding anything that is not well formed. */',
                   'export function CartProvider'),
           caption='Listing 7 — context/CartContext.jsx, cart loading and reduction', size=8.0)
    r.p('The reducer exists because every cart mutation must be followed by the same '
        'persistence step, and a single switch keeps those transitions in one readable place. '
        'The loader is defensive: local storage can contain anything a user has put there, so '
        'every entry is checked for shape and every quantity re-capped before it is trusted. '
        'None of this is a security control — the server re-validates and re-prices everything '
        '— but it prevents a corrupted storage entry from crashing the application on load.')

    r.h2('7.4  Validation Checks Implemented')
    r.p('Validation is applied in three layers, and the layering is deliberate. The client '
        'validates for immediate feedback; the route validates the shape of the request; the '
        'schema validates at the point of writing. Only the last two are security controls — '
        'the first can be bypassed by anyone with developer tools open.')

    r.table(
        ['Field', 'Client check', 'Route check (express-validator)', 'Schema check (Mongoose)'],
        [['Name', 'Required, 2–80 characters', '`isLength({min:2, max:80})`, trimmed',
          'Required, minlength 2, maxlength 80'],
         ['Email', 'HTML5 email type', '`isEmail`, normalised', 'Pattern match, unique index, '
                                                                'lower-cased'],
         ['Password', 'Live checklist of the four rules',
          'Length 8–72, plus lower case, upper case and digit',
          'Required, minlength 8, `select:false`'],
         ['Product price', '`type="number"`, minimum 1, step 1',
          '`isInt({min:1, max:10000000})`', 'Required, min 1, rounded by a setter'],
         ['Stock count', '`type="number"`, minimum 0, step 1', '`isInt({min:0})`',
          'Required, min 0, integer validator'],
         ['Pincode', '6-digit input mask', '`matches(/^\\d{6}$/)`', 'Pattern `/^\\d{6}$/`'],
         ['Mobile number', '10-digit input mask', '`matches(/^[6-9]\\d{9}$/)`',
          'Pattern `/^[6-9]\\d{9}$/`'],
         ['Cart quantity', 'Stepper capped at min(10, stock)', '`isInt({min:1, max:10})`',
          'Order line min 1, max 10, integer'],
         ['Card number', '13–19 digits', 'Present and a string',
          'Not persisted — validated in the service by Luhn checksum'],
         ['Image URL', '`type="url"`', 'http(s) URL or a root-relative path',
          'Maximum 500 characters'],
         ['Category reference', 'Select list of existing categories', '`isMongoId()`',
          'ObjectId reference, plus an existence check in the controller'],
         ['Order status', 'Only legal transitions rendered', '`isIn(ORDER_STATUSES)`',
          'Enumeration, plus the transition table check']],
        caption='Validation applied at each layer',
        widths=[0.8, 1.1, 1.3, 1.2], font_size=8.5)

    r.h2('7.5  Error Handling Strategy')
    r.table(
        ['Condition', 'Status', 'Behaviour'],
        [['Malformed request body', '400', 'Body parser failure translated to a readable message'],
         ['Invalid ObjectId in a path parameter', '400 / 422',
          'Cast error translated, naming the parameter'],
         ['Missing or invalid token', '401', 'Client clears the stored token and falls back to '
                                             'the signed-out state'],
         ['Expired token', '401', 'Distinct message inviting the user to sign in again'],
         ['Deactivated account', '403', 'Explains the account state'],
         ['Insufficient role', '403', 'Named as an administrator-only action'],
         ['Resource not found', '404', 'Generic message; an order belonging to another customer '
                                       'also returns 404 rather than 403, so that the existence '
                                       'of the record is not disclosed'],
         ['Duplicate key', '409', 'Field-specific message, for example "an account with this '
                                  'email already exists"'],
         ['Out of stock during checkout', '409', 'Names the item and the quantity remaining'],
         ['Illegal status transition', '409', 'Names the permitted next states'],
         ['Validation failure', '422', 'Every offending field returned together in `details`'],
         ['Payment declined', '422', 'Reserved stock released first; no order written'],
         ['Rate limit exceeded', '429', 'Retry guidance returned'],
         ['Unexpected server fault', '500', 'Generic message in production; full stack logged '
                                            'server-side and returned only outside production']],
        caption='Error conditions and the system’s response',
        widths=[1.4, 0.5, 2.4], font_size=8.5)
