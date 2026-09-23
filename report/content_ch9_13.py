"""Chapters 9–13: Screens, Security, Limitations, Future work, Conclusion, Bibliography."""


def build(r):
    # ==================== 9. INPUT AND OUTPUT SCREENS =====================
    r.h1('9.  INPUT AND OUTPUT SCREENS')
    r.p('Every screen reproduced in this chapter was captured from the running application '
        'connected to a live MongoDB database holding the seeded demonstration catalogue of '
        '34 products across six categories, five customer accounts and forty historical '
        'orders. None of the images is a mock-up. The screens that carry the most detail are '
        'reproduced at full width; the remainder are paired to keep the chapter compact.',
        first_line_indent=False)

    r.h2('9.1  Public Screens')

    r.screenshot('02-catalogue.png',
                 'Catalogue listing — fluid product grid with the filter sidebar and sort '
                 'control', width_inches=5.1)
    r.p('Discount badges are derived from the difference between the selling price and the '
        'maximum retail price. Every filter shown writes to the URL query string, so this '
        'view can be bookmarked and shared, and the browser back button behaves as expected.',
        first_line_indent=False)

    r.figure_row([
        ('01-home.png', 'Home page — hero, category shortcuts with live counts, new arrivals', 2.9),
        ('03-search-results.png', 'Keyword search for "earphones", ranked by relevance', 2.9),
    ])
    r.figure_row([
        ('04-filtered-catalogue.png', 'Combined filters: ₹500–₹2,000, in stock, price ascending', 2.9),
        ('28-not-found.png', 'Page not found — shown for any unmatched route', 2.9),
    ])

    r.screenshot('05-product-detail.png',
                 'Product detail — description, live stock position, quantity stepper and '
                 'related items', width_inches=4.4)
    r.p('The stock badge changes colour and wording according to the live figure: green above '
        'five units, amber at five or fewer, and a disabled control with an out-of-stock veil '
        'at zero. The category tile counts on the home page are computed by a server-side '
        'aggregation rather than hard-coded, so they remain correct as the catalogue changes.',
        first_line_indent=False)

    r.h2('9.2  Account Screens')

    r.figure_row([
        ('07-login.png', 'Sign in, with the demonstration credentials shown', 2.9),
        ('08-login-error.png', 'Sign-in failure — one generic message for both cases', 2.9),
    ])
    r.p('The identical message for an unknown address and a wrong password is deliberate: '
        'distinguishing them would let the endpoint be used to discover which addresses are '
        'registered (test case TC-I-09).', first_line_indent=False)

    r.figure_row([
        ('06-register-validation.png', 'Registration — the password policy as a live checklist', 2.9),
        ('17-profile.png', 'Profile — details, default address and password change', 2.9),
    ])
    r.p('The email field on the profile screen is disabled because it is the sign-in '
        'identifier; changing it would require a verification flow, which Section 2.3 places '
        'outside the scope.', first_line_indent=False)

    r.h2('9.3  Cart and Checkout')

    r.figure_row([
        ('09-add-to-cart-toast.png', 'Adding to the cart — transient confirmation and badge', 2.9),
        ('10-cart.png', 'Shopping cart with the free-delivery threshold prompt', 2.9),
    ])
    r.p('The cart summary is explicitly labelled an estimate. The binding figure is the one '
        'the server returns at checkout, for the reasons set out in Section 1.2.1.',
        first_line_indent=False)

    r.screenshot('12-checkout-filled.png',
                 'Checkout — delivery address, payment selection, card entry and the '
                 'server-priced order summary', width_inches=5.1)
    r.p('The payment panel states plainly that the gateway is simulated and that no card '
        'number is stored. The order summary is populated from the server\u2019s own quote, '
        'not from figures computed in the browser.', first_line_indent=False)

    r.figure_row([
        ('13-payment-declined.png', 'Declined payment — stock already returned, no order written', 2.9),
        ('14-order-confirmation.png', 'Order confirmation with the invoice number', 2.9),
    ])
    r.p('The declined-payment screen is the visible face of test case TC-I-40: by the time the '
        'message appears, the compensating action has already returned the reserved units to '
        'the catalogue and no order document exists.', first_line_indent=False)

    r.h2('9.4  Order Tracking')

    r.figure_row([
        ('15-my-orders.png', 'Order history, most recent first', 2.9),
        ('16-order-detail.png', 'Order detail with the status timeline', 2.9),
    ])
    r.p('Only the last four digits of the card are shown, because only the last four digits '
        'were ever stored. The cancel control appears only while the order status permits '
        'cancellation.', first_line_indent=False)

    r.h2('9.5  Administration Screens')

    r.screenshot('18-admin-dashboard.png',
                 'Administrator dashboard — headline figures, fourteen-day revenue series, '
                 'status breakdown, best sellers and low-stock alerts', width_inches=5.1)
    r.p('Every figure on this screen is computed by a MongoDB aggregation pipeline rather than '
        'by loading orders into the application and summing them in JavaScript. The date '
        'window is resolved in the store\u2019s own timezone — see the defect recorded in '
        'Section 8.6.1.', first_line_indent=False)

    r.screenshot('22-admin-orders.png',
                 'Order queue — filterable by status, offering only the transitions the state '
                 'machine permits from each order\u2019s current state', width_inches=5.1)

    r.figure_row([
        ('19-admin-products.png', 'Product maintenance with colour-coded stock levels', 2.9),
        ('20-admin-product-form.png', 'Product form with per-field validation', 2.9),
    ])
    r.figure_row([
        ('21-admin-categories.png', 'Category maintenance — deletion blocked while in use', 2.9),
        ('23-admin-users.png', 'Customer administration — search, filter, activation', 2.9),
    ])

    r.h2('9.6  Responsive Behaviour')
    r.p('The same application, without a separate mobile site, rendered at three viewport '
        'widths.', first_line_indent=False)

    r.figure_row([
        ('24-mobile-home.png', 'Home page at 390 px', 1.7),
        ('25-mobile-catalogue.png', 'Catalogue at 390 px — two columns', 1.7),
        ('26-mobile-product.png', 'Product detail at 390 px', 1.7),
    ])
    r.p('At phone width the navigation labels collapse to icons, the brand word mark is hidden '
        'to free horizontal space, the filter sidebar moves above the results and forms become '
        'single column. The catalogue grid itself needs no instruction: because it is declared '
        'with `auto-fill` and `minmax`, the column count follows the viewport on its own.',
        first_line_indent=False)

    r.screenshot('27-tablet-catalogue.png', 'Catalogue at 834 px (tablet) — three columns',
                 width_inches=3.4)

    # ==================== 10. SECURITY =====================================
    r.h1('10.  IMPLEMENTATION OF SECURITY')
    r.p('This chapter sets out the security measures implemented, the reasoning behind each, '
        'and the test case that demonstrates it. The BCSP-064 guidelines specifically require '
        'an account of how a user name and password are protected in transmission to the '
        'server; that is covered in Section 10.4.')

    r.h2('10.1  Authentication')
    r.p('Authentication uses stateless JSON Web Tokens. On a successful sign-in the server '
        'signs a token carrying only the user identifier and role, with a seven-day expiry and '
        'an issuer claim. The token is signed, not encrypted, so nothing confidential is '
        'placed in its payload — anyone holding the token can decode and read it.')
    r.p('The signing secret is read from the environment and is never committed. The '
        'configuration module refuses to start a production server if the secret is still the '
        'development fallback, because a predictable signing key would let anyone forge an '
        'administrator token. That check runs at start-up, so the failure is immediate and '
        'obvious rather than latent.')

    r.h2('10.2  Password Storage')
    r.p('Passwords are hashed with bcrypt at a work factor of twelve. Bcrypt is an adaptive '
        'function: the work factor can be raised as hardware improves, which a plain '
        'cryptographic hash such as SHA-256 cannot offer. Twelve rounds cost roughly a quarter '
        'of a second, which is unnoticeable on a sign-in but makes large-scale offline '
        'guessing expensive. Bcrypt also generates and stores a per-password salt, so two '
        'users choosing the same password produce different hashes and a precomputed rainbow '
        'table is useless.')
    r.p('The stored hash is protected by three independent mechanisms: the schema marks the '
        'field `select: false`, so it is excluded from every query result unless explicitly '
        'requested; the JSON serialiser deletes it, so even a query that did select it cannot '
        'leak it through a response; and comparison is performed by `bcrypt.compare`, which '
        'runs in constant time and therefore reveals nothing through timing.')
    r.p('The password policy requires at least eight characters with a lower-case letter, an '
        'upper-case letter and a digit, and is capped at seventy-two characters. The cap is '
        'not arbitrary: bcrypt silently truncates its input at seventy-two bytes, so accepting '
        'a longer password would give the user a false impression of strength. Evidence: '
        'TC-U-37, TC-U-38, TC-U-39, TC-U-41, TC-U-42, TC-I-02, TC-I-04.')

    r.h2('10.3  Authorisation and Access Control')
    r.p('Authentication establishes who the caller is; authorisation decides what they may do. '
        'The two are separate middleware functions so that an endpoint can require a signed-in '
        'user without also hard-coding a role check.')

    r.table(
        ['Control', 'Implementation', 'Evidence'],
        [['Role escalation through registration is impossible',
          'The registration controller sets `role: customer` explicitly and never reads a '
          'role from the request body.', 'TC-I-06'],
         ['Administrative endpoints reject customers',
          '`restrictTo(\'admin\')` runs after `protect` on every administrative router.',
          'TC-I-29, TC-I-50, TC-I-59'],
         ['A customer can read only their own orders',
          'The controller compares the order’s owner with the caller and returns 404 — '
          'not 403 — when they differ, so the existence of the record is not disclosed.',
          'TC-I-47'],
         ['A deactivated account loses access immediately',
          'The user record is re-read from the database on every protected request rather '
          'than trusting the token payload.', 'TC-I-62'],
         ['An administrator cannot lock themselves out',
          'Self-deactivation is refused, because the screen needed to undo it is the one that '
          'would become unreachable.', 'TC-I-63'],
         ['Mass assignment is not possible on product updates',
          'Only an explicit whitelist of fields is copied from the request body.', 'TC-I-33']],
        caption='Access controls and the evidence for each',
        widths=[1.4, 2.1, 0.8], font_size=8.5)

    r.h2('10.4  Protection of Credentials in Transmission')
    r.p('The BCSP-064 guidelines ask specifically about the security of the user name and '
        'password during transmission to the server. The position is as follows.')
    r.bullets([
        'Credentials are sent in the body of a `POST` request, never in a query string. A '
        'query string is recorded in server access logs, in browser history and in the '
        '`Referer` header sent to third-party resources; a request body is not.',
        'The deployment terminates TLS at the hosting layer, so the request body — including '
        'the password — is encrypted in transit. The application sets HTTP Strict Transport '
        'Security through helmet, instructing the browser to refuse a plain-text connection to '
        'the origin on subsequent visits.',
        'The password is never written to a log. The request logger records method, path, '
        'status and duration; it does not record request bodies.',
        'The password is never returned in a response, and never stored in the browser. Only '
        'the issued token is stored, which carries no password material.',
        'Authentication endpoints are rate limited to ten failed attempts per address per '
        'fifteen minutes, with successful attempts excluded from the budget. Without this, '
        'bcrypt alone would not protect a weak password against sustained guessing.',
        'Sign-in failures return one generic message for both an unknown address and a wrong '
        'password, so the endpoint cannot be used to discover which addresses are registered '
        '(TC-I-09).',
    ])
    r.p('It should be stated plainly that TLS is a deployment responsibility, not something '
        'the application code can guarantee. The application takes every measure available to '
        'it — HSTS headers, body-only credential transport, no logging — but a deployment that '
        'serves the API over plain HTTP would expose credentials regardless. The deployment '
        'requirement in Section 3.6.2 states this.')

    r.h2('10.5  Injection Defences')
    r.p('MongoDB is not vulnerable to classical SQL injection, because queries are structured '
        'documents rather than concatenated strings. It is, however, vulnerable to **operator '
        'injection**. If a login handler passes the request body straight into a query, a '
        'payload of `{"email": {"$ne": null}, "password": {"$ne": null}}` matches the first '
        'user in the collection and authenticates the attacker as them.')
    r.p('Three layers defend against this:')
    r.numbered([
        '`express-mongo-sanitize` strips any key beginning with `$` or containing a dot from '
        'the request body, query string and route parameters before any handler sees them.',
        'Route-level validation asserts the type of every field: an email must be a string '
        'that parses as an email address, an identifier must be a valid ObjectId, a price '
        'bound must be an integer. An object fails these checks.',
        'The catalogue query builder coerces every value to its expected type rather than '
        'passing it through, so even a value that survived the first two layers could not '
        'reach the engine as an operator.',
    ])
    r.p('Evidence: TC-I-10 attempts exactly the login payload above and asserts that no token '
        'is issued; TC-U-24 attempts operator injection through the catalogue filter and '
        'asserts the resulting filter contains neither value. Regular-expression injection is '
        'addressed separately: the only endpoint that builds a regular expression from user '
        'input is the administrative user search, which escapes every regex metacharacter '
        'first.')

    r.h2('10.6  Handling of Payment Data')
    r.p('The simulated gateway is the one place where genuinely sensitive third-party data '
        'enters the system, and it is handled on the principle that the safest data is the '
        'data you do not keep.')
    r.bullets([
        'The card number is validated in memory using the Luhn checksum, the same check-digit '
        'algorithm every card issuer uses, which catches a mistyped number before an '
        'authorisation is attempted.',
        'The expiry date is checked against the current date, treating a card as valid through '
        'the final day of its expiry month.',
        'Only the last four digits are retained, for display on the invoice. The remaining '
        'digits and the CVV are local constants inside the authorisation function and become '
        'unreachable when it returns.',
        'Neither the card number nor the CVV is written to the database or to any log.',
        'A real deployment would replace this module with a gateway SDK, and the card number '
        'would never reach the application server at all — the browser would post it directly '
        'to the gateway, which would return a token. The module boundary is drawn so that this '
        'substitution touches one file.',
    ])
    r.p('Evidence: TC-U-09 asserts that the full card number and the CVV appear nowhere in the '
        'authorisation result; TC-I-39 asserts the same of the stored order document.')

    r.h2('10.7  Other Measures')
    r.table(
        ['Measure', 'Purpose'],
        [['Security response headers (helmet)',
          'Strict Transport Security, MIME-sniffing protection, frame denial to prevent '
          'clickjacking, and a restrictive referrer policy.'],
         ['Restrictive CORS policy',
          'The browser may call the API only from the configured client origin. A wildcard '
          'would let any website on the internet issue authenticated requests on behalf of a '
          'signed-in visitor.'],
         ['Request body size cap of 100 KB',
          'Prevents a single oversized payload from exhausting server memory.'],
         ['Page size cap of 48 items',
          'Prevents a request for an unbounded page being used as a denial-of-service vector.'],
         ['General API rate limit of 300 requests per fifteen minutes',
          'Limits automated scraping and abuse.'],
         ['Generic error messages in production',
          'Stack traces and driver messages are logged server-side but never returned, because '
          'each helps an attacker map the system.'],
         ['Soft deletion of products',
          'Historical orders retain a resolvable product reference, so an audit trail cannot '
          'be broken by a catalogue change.'],
         ['Cryptographically random invoice numbers',
          'Six hex characters from `crypto.randomBytes` mean invoice numbers cannot be guessed '
          'or enumerated, unlike a sequential counter.'],
         ['Environment secrets excluded from version control',
          'The `.env` file is git-ignored; `.env.example` documents the required variables '
          'with placeholder values.']],
        caption='Additional security measures',
        widths=[1.3, 3.0], font_size=8.5)

    r.h2('10.8  Security Testing Summary')
    r.table(
        ['Attack or misuse attempted', 'Test case', 'Outcome'],
        [['Register with an elevated role in the request body', 'TC-I-06',
          'Role forced to customer'],
         ['NoSQL operator injection at sign-in', 'TC-I-10', 'Rejected; no token issued'],
         ['NoSQL operator injection through catalogue filters', 'TC-U-24',
          'Values discarded; filter unaffected'],
         ['Enumerate registered email addresses through sign-in', 'TC-I-09',
          'Identical response for both cases'],
         ['Present a tampered token', 'TC-I-14', 'Rejected with 401'],
         ['Reach an administrative endpoint as a customer', 'TC-I-29, TC-I-59',
          'Rejected with 403'],
         ['Reach an administrative endpoint anonymously', 'TC-I-30', 'Rejected with 401'],
         ['Read another customer’s order by identifier', 'TC-I-47',
          'Rejected with 404, disclosing nothing'],
         ['List every order in the store as a customer', 'TC-I-50', 'Rejected with 403'],
         ['Continue using a token after deactivation', 'TC-I-62',
          'Refused on the next request'],
         ['Pay a tampered price for real goods', 'TC-I-38', 'Server price applied'],
         ['Recover a password from the database or an API response', 'TC-U-37, TC-I-02',
          'Only a bcrypt hash exists; never serialised'],
         ['Recover a card number or CVV from a stored order', 'TC-I-39',
          'Absent; only the last four digits retained'],
         ['Exceed the per-product quantity cap by splitting cart lines', 'TC-U-29',
          'Lines merged before the cap is applied'],
         ['Store a `javascript:` URL as a product image', 'TC-I-36b',
          'Rejected with a field-level error']],
        caption='Security tests and their outcomes',
        widths=[2.0, 1.0, 1.3], font_size=8.5)

    # ==================== 11. LIMITATIONS ==================================
    r.h1('11.  LIMITATIONS OF THE PROJECT')
    r.p('An honest account of what a system cannot do is more useful than an inflated account '
        'of what it can. The limitations below are grouped by whether they arise from the '
        'academic brief, from a design trade-off, or from scope.')

    r.h2('11.1  Limitations Arising from the Academic Brief')
    r.bullets([
        '**The payment gateway is simulated.** No money moves and no acquiring bank is '
        'contacted. The module reproduces a real gateway’s contract, but a production '
        'deployment would need a certified integration, and PCI-DSS obligations would then '
        'apply to the deployment as a whole.',
        '**The system has not been load tested.** Performance claims in this report rest on '
        'the index design and on query plans, not on measurements under sustained concurrent '
        'load. The concurrency correctness of the checkout is demonstrated by test, but its '
        'throughput ceiling is unknown.',
        '**It has not been deployed to a public server.** All testing was performed locally. '
        'Behaviour behind a reverse proxy, under a content delivery network, or with TLS '
        'termination at a load balancer is therefore untested, although the application is '
        'configured for it.',
    ])

    r.h2('11.2  Limitations Arising from Design Trade-offs')
    r.bullets([
        '**Multi-document transactions are unavailable on a standalone database.** The '
        'checkout falls back to a compensating-action pattern, which is correct but not '
        'equivalent to a transaction: if the process were killed between reserving stock and '
        'writing the order, the reservation would not be released. A replica-set deployment '
        'removes this exposure, and the code already detects and uses real transactions where '
        'they are available.',
        '**Money is stored in whole rupees.** This avoids binary floating-point error '
        'accumulating across order arithmetic, but prices cannot carry paise. A production '
        'system would store amounts as integer paise rather than integer rupees.',
        '**A single flat tax rate is applied.** Real GST varies by product category. The rate '
        'is isolated in one constant so the change is contained, but the schema would need an '
        'HSN code per product.',
        '**Tokens cannot be revoked before expiry.** The live database read on every request '
        'mitigates this for account deactivation, but a stolen token remains usable for its '
        'remaining lifetime unless the account is deactivated. A refresh-token scheme with a '
        'short-lived access token would narrow the window.',
        '**The cart is per-browser, not per-account.** A cart built on a phone does not appear '
        'on a laptop. Persisting the cart server-side against the account would fix this at '
        'the cost of a write on every cart change.',
    ])

    r.h2('11.3  Limitations of Scope')
    r.bullets([
        '**No product variants.** Size and colour would each require a separate catalogue '
        'entry. A variant sub-document with its own stock count would be the correct model.',
        '**No image upload.** Products reference an image by URL or bundled path; there is no '
        'upload, resizing or content delivery pipeline.',
        '**No email or SMS notification.** Order confirmation is shown on screen only.',
        '**No customer-submitted reviews.** Ratings are displayed from seeded data but cannot '
        'be submitted.',
        '**No returns or refunds workflow.** Cancellation before despatch is supported; a '
        'post-delivery return is not.',
        '**No discount codes, coupons or promotional pricing.**',
        '**No wishlist or saved-for-later list.**',
        '**Single language and single currency.** The interface is English and prices are in '
        'Indian rupees, with no localisation layer.',
        '**Administrative actions are not audit-logged.** Order status changes carry a history, '
        'but a price change or a product withdrawal does not record who made it.',
    ])

    # ==================== 12. FUTURE APPLICATIONS ==========================
    r.h1('12.  FUTURE APPLICATIONS AND ENHANCEMENTS')
    r.p('The limitations above suggest the work that would follow. They are grouped by the '
        'effort each would take and the value it would deliver.')

    r.h2('12.1  Near-term Enhancements')
    r.table(
        ['Enhancement', 'What it involves', 'Value'],
        [['Product variants',
          'A `variants` array on the product document, each with its own SKU, attributes and '
          'stock count. The atomic reservation would operate on a positional array element '
          'rather than the top-level field.',
          'High — without it, apparel and footwear cannot be sold properly.'],
         ['Server-side cart',
          'A cart collection keyed by user, merged with the local cart on sign-in.',
          'Medium — the cart would follow the customer across devices.'],
         ['Image upload pipeline',
          'Multipart upload, server-side resizing to several widths, and storage in object '
          'storage behind a CDN.',
          'Medium — removes the dependency on externally hosted images.'],
         ['Email notification',
          'A transactional email provider, triggered on order placement and each status '
          'change, dispatched through a queue so a provider outage cannot fail a checkout.',
          'High — customers expect written confirmation.'],
         ['Customer reviews',
          'A reviews collection with a verified-purchase check, and an incremental update of '
          'the product’s rating average.',
          'Medium — ratings are currently displayed but cannot be earned.'],
         ['Discount codes',
          'A coupons collection with validity rules, applied during the server-side re-pricing '
          'step so the discount cannot be forged by the client.',
          'Medium — a standard commercial requirement.']],
        caption='Near-term enhancements',
        widths=[0.9, 2.2, 1.2], font_size=8.5)

    r.h2('12.2  Production Readiness')
    r.p('Three changes would be required before the system carried real money.')
    r.numbered([
        '**A certified payment gateway.** The browser would post card details directly to the '
        'gateway and receive a token, which is the only value the application would ever see. '
        'This keeps the application outside the scope of the strictest PCI-DSS requirements. '
        'The `paymentService` module boundary is drawn so that this substitution touches one '
        'file.',
        '**A replica-set database.** This makes real multi-document transactions available, '
        'closing the exposure described in Section 11.2, and provides automatic failover. The '
        'checkout already detects and uses transactions when the deployment supports them, so '
        'no code change is needed.',
        '**Operational infrastructure.** Structured logging with correlation identifiers, '
        'error aggregation, uptime monitoring, automated database backups with a tested '
        'restore procedure, and a continuous integration pipeline that runs the test suite on '
        'every change.',
    ])

    r.h2('12.3  Longer-term Directions')
    r.bullets([
        '**A native mobile application.** Because the server is a headless REST API, a React '
        'Native client could consume the same endpoints with no server change. This was a '
        'consideration in choosing a decoupled architecture.',
        '**Recommendation engine.** "Related products" is currently a same-category query. '
        'Order history contains enough co-purchase information to support collaborative '
        'filtering, which is a substantially more useful signal.',
        '**Search improvements.** MongoDB’s text index does not support typo tolerance, '
        'synonyms or faceted counts. A dedicated search engine such as Elasticsearch or '
        'MeiliSearch would provide all three.',
        '**Multi-vendor marketplace.** Seller accounts, per-seller catalogues, commission '
        'calculation and split settlement. This is a substantial change to the order model '
        'rather than an addition to it.',
        '**Internationalisation.** Extracting interface strings into translation catalogues '
        'and storing prices per currency.',
        '**Progressive web application.** A service worker would allow catalogue browsing '
        'while offline and add installability, which matters on intermittent mobile '
        'connections.',
    ])

    # ==================== 13. CONCLUSION ===================================
    r.h1('13.  CONCLUSION')
    r.p('This project set out to build a working e-commerce application on the MERN stack and '
        'to document every phase of its development in accordance with the BCSP-064 '
        'guidelines. Both objectives have been met.')
    r.p('The delivered system comprises 82 source files totalling approximately 9,100 lines, '
        'of which 5,530 are executable code and the remainder comments and blank lines. These '
        'are organised into five modules behind a documented REST API of twenty-seven '
        'endpoints, with a React single-page front end of twenty-two screens. The system is '
        'covered by 127 automated tests at three levels, all passing, achieving 86.2% '
        'statement coverage of the server source. Every objective stated in Section 2.1 is '
        'traceable to the evidence that establishes it.')
    r.p('The more valuable outcome, from the point of view of the software engineering the '
        'course is concerned with, lies in the problems that were harder than they first '
        'appeared. Three stand out.')
    r.p('The first is that **a cart in the browser cannot be trusted with a price**. This '
        'sounds obvious stated baldly, but the convenient implementation — accept the totals '
        'the client computed, since it already computed them to display them — is the one that '
        'fails. Recomputing every amount on the server costs an extra database read at '
        'checkout and eliminates an entire class of commercial fraud. Test case TC-I-38 makes '
        'the property explicit rather than assumed.')
    r.p('The second is that **correctness under concurrency has to be designed in, not tested '
        'in**. The read-compare-write sequence that oversells the last unit passes every '
        'manual test, because the failure needs two requests within milliseconds of each '
        'other. It is only avoided by recognising, at design time, that the check and the '
        'update must be a single atomic operation. The test that demonstrates it — ten '
        'simultaneous reservations against one unit of stock — had to be written deliberately; '
        'no ordinary test would have found the defect.')
    r.p('The third is that **the defects that matter most are often the ones that produce no '
        'error at all**. The timezone defect recorded in Section 8.6.1 threw no exception, '
        'failed no request and logged no warning. The dashboard simply reported the wrong '
        'fourteen days and silently omitted the current one. It was found by reading a chart '
        'against data that was known to be correct — which is an argument for testing against '
        'known-good data rather than only against the code’s own assumptions, and for '
        'writing down environmental assumptions as tests, which is what TC-U-49 to TC-U-55 now '
        'do.')
    r.p('The system as delivered is not production software: the payment gateway is simulated, '
        'it has not been load tested and it has never been deployed publicly, and Chapters 11 '
        'and 12 set out those limitations and what closing them would take. What the project '
        'does demonstrate is an end-to-end pass through the software development life cycle, '
        'applied to a problem substantial enough to raise real engineering questions and '
        'answered with reasoning that is set out rather than assumed.')

    # ==================== 14. BIBLIOGRAPHY =================================
    r.h1('14.  BIBLIOGRAPHY')

    r.h2('Books')
    r.p('[1]  Pressman, R. S. and Maxim, B. R. (2020). *Software Engineering: A '
        "Practitioner's Approach*, 9th edition. McGraw-Hill Education.",
        first_line_indent=False, spacing='single', space_after=8)
    r.p('[2]  Silberschatz, A., Korth, H. F. and Sudarshan, S. (2019). *Database System '
        'Concepts*, 7th edition. McGraw-Hill Education.',
        first_line_indent=False, spacing='single', space_after=8)
    r.p('[3]  Martin, R. C. (2008). *Clean Code: A Handbook of Agile Software Craftsmanship*. '
        'Prentice Hall.', first_line_indent=False, spacing='single', space_after=8)
    r.p('[4]  Hunt, A. and Thomas, D. (2019). *The Pragmatic Programmer: Your Journey to '
        'Mastery*, 20th Anniversary Edition. Addison-Wesley.',
        first_line_indent=False, spacing='single', space_after=8)
    r.p('[5]  Sommerville, I. (2015). *Software Engineering*, 10th edition. Pearson.',
        first_line_indent=False, spacing='single', space_after=8)
    r.p('[6]  Chodorow, K. (2013). *MongoDB: The Definitive Guide*, 2nd edition. '
        "O'Reilly Media.", first_line_indent=False, spacing='single', space_after=8)
    r.p('[7]  Boehm, B. W. (1981). *Software Engineering Economics*. Prentice Hall. '
        '(Source of the COCOMO model applied in Section 3.4.1.)',
        first_line_indent=False, spacing='single', space_after=8)

    r.h2('Official Documentation')
    r.p('[8]   React Documentation. Meta Open Source. https://react.dev',
        first_line_indent=False, spacing='single', space_after=8)
    r.p('[9]   Node.js Documentation. OpenJS Foundation. https://nodejs.org/docs',
        first_line_indent=False, spacing='single', space_after=8)
    r.p('[10]  Express.js Guide. OpenJS Foundation. https://expressjs.com',
        first_line_indent=False, spacing='single', space_after=8)
    r.p('[11]  MongoDB Manual. MongoDB Inc. https://www.mongodb.com/docs/manual',
        first_line_indent=False, spacing='single', space_after=8)
    r.p('[12]  Mongoose Documentation. https://mongoosejs.com/docs',
        first_line_indent=False, spacing='single', space_after=8)
    r.p('[13]  MDN Web Docs. Mozilla Foundation. https://developer.mozilla.org',
        first_line_indent=False, spacing='single', space_after=8)
    r.p('[14]  Jest Documentation. https://jestjs.io/docs/getting-started',
        first_line_indent=False, spacing='single', space_after=8)
    r.p('[15]  Vite Guide. https://vitejs.dev/guide',
        first_line_indent=False, spacing='single', space_after=8)

    r.h2('Standards and Specifications')
    r.p('[16]  RFC 7519 — JSON Web Token (JWT). Internet Engineering Task Force, 2015. '
        'https://datatracker.ietf.org/doc/html/rfc7519',
        first_line_indent=False, spacing='single', space_after=8)
    r.p('[17]  Provos, N. and Mazières, D. (1999). "A Future-Adaptable Password Scheme." '
        'Proceedings of the USENIX Annual Technical Conference. (The bcrypt algorithm.)',
        first_line_indent=False, spacing='single', space_after=8)
    r.p('[18]  ISO/IEC 7812-1:2017 — Identification cards: Identification of issuers. '
        '(Source of the Luhn check-digit algorithm.)',
        first_line_indent=False, spacing='single', space_after=8)
    r.p('[19]  OWASP Top Ten Web Application Security Risks. Open Worldwide Application '
        'Security Project. https://owasp.org/www-project-top-ten',
        first_line_indent=False, spacing='single', space_after=8)
    r.p('[20]  Web Content Accessibility Guidelines (WCAG) 2.1. World Wide Web Consortium, '
        '2018. https://www.w3.org/TR/WCAG21',
        first_line_indent=False, spacing='single', space_after=8)

    r.h2('University Material')
    r.p('[21]  BCSP-064 Project Guidelines, BCA (Revised Syllabus). School of Computer and '
        'Information Sciences, Indira Gandhi National Open University, Maidan Garhi, '
        'New Delhi.', first_line_indent=False, spacing='single', space_after=8)
    r.p('[22]  MCS-011, MCS-021, MCS-023 and MCS-034 course material — Problem Solving and '
        'Programming, Data and File Structures, Database Management Systems, and Software '
        'Engineering. IGNOU.', first_line_indent=False, spacing='single', space_after=8)
