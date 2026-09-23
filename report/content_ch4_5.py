"""Chapters 4–5: Tools and Environment; Analysis Documents."""


def build(r):
    # ==================== 4. TOOLS AND ENVIRONMENT ========================
    r.h1('4.  TOOLS AND ENVIRONMENT USED')

    r.h2('4.1  Architectural Overview')
    r.p('The system is organised as three tiers that communicate only through defined '
        'interfaces. ' + r.ref_figure('Three-tier architecture') +
        ' shows the arrangement and what occupies each tier.')

    r.figure('fig-4-1-architecture.png',
             'Three-tier architecture. The browser never reaches the database directly; '
             'every request passes through the Express middleware chain.',
             width_inches=5.6)

    r.p('The property that matters most in this arrangement is that the presentation tier has '
        'no path to the data tier. A browser cannot open a database connection, so every read '
        'and every write must pass through the application tier, where authentication, '
        'authorisation, input sanitisation and rate limiting are applied. A security control '
        'placed in that chain therefore cannot be bypassed by a crafted client, which is not '
        'true of a design where the browser talks to the database directly.')

    r.h2('4.2  Presentation Tier')
    r.table(
        ['Technology', 'Version', 'Role in this project'],
        [['React', '18.3', 'Component model and rendering. The virtual DOM reconciles only the '
                           'parts of the tree that changed, so updating a cart quantity does '
                           'not re-render the catalogue.'],
         ['react-router-dom', '6.26', 'Client-side routing for 22 screens, including nested '
                                      'routes for the administration section and route guards '
                                      'for protected pages.'],
         ['React Context API', 'built in', 'Application-wide state: the signed-in user, the '
                                           'cart and the notification queue. Chosen over Redux '
                                           'because the state is small and the reducer pattern '
                                           'alone is sufficient — see Section 4.6.'],
         ['Axios', '1.7', 'HTTP client, configured with request and response interceptors that '
                          'attach the access token and normalise every API error into one '
                          'shape.'],
         ['Recharts', '2.12', 'Declarative charting for the administrator dashboard, built on '
                              'SVG so charts scale with the container.'],
         ['Vite', '5.4', 'Development server with hot module replacement, and the production '
                         'bundler. The development proxy forwards /api to the Node server so '
                         'that the browser sees one origin.'],
         ['CSS custom properties', '—', 'A single design-token block defines the palette, '
                                        'radii and shadows; the fluid grid uses CSS Grid with '
                                        'auto-fill and minmax so the column count adapts '
                                        'without media queries.']],
        caption='Presentation-tier technologies',
        widths=[1.0, 0.55, 2.6], font_size=8.5)

    r.h2('4.3  Application Tier')
    r.table(
        ['Technology', 'Version', 'Role in this project'],
        [['Node.js', '22.23', 'JavaScript runtime. Its non-blocking event loop suits a workload '
                              'dominated by waiting on the database.'],
         ['Express', '4.19', 'HTTP framework. Routers divide the API into five namespaces; the '
                             'middleware chain provides a single place to apply cross-cutting '
                             'concerns.'],
         ['Mongoose', '8.6', 'Object document mapper. Provides schema definition, validation at '
                             'write time, index declaration and population of referenced '
                             'documents.'],
         ['jsonwebtoken', '9.0', 'Issues and verifies the signed access tokens described in '
                                 'Section 10.1.'],
         ['bcryptjs', '2.4', 'Adaptive password hashing at a work factor of 12.'],
         ['express-validator', '7.2', 'Declarative request validation beside each route, '
                                      'collecting all failures in one pass.'],
         ['helmet', '7.1', 'Sets security response headers, including content-type sniffing '
                           'protection, frame denial and a restrictive referrer policy.'],
         ['express-mongo-sanitize', '2.2', 'Strips keys beginning with $ or containing a dot '
                                           'from the body, query and parameters — the defence '
                                           'against NoSQL operator injection.'],
         ['express-rate-limit', '7.4', 'Request budgets: 300 per fifteen minutes for the API '
                                       'generally, 10 failed attempts for authentication.'],
         ['cors', '2.8', 'Restricts browser access to the configured client origin.'],
         ['morgan', '1.10', 'Request logging in development and production formats.']],
        caption='Application-tier technologies',
        widths=[1.1, 0.5, 2.55], font_size=8.5)

    r.h2('4.4  Data Tier')
    r.table(
        ['Technology', 'Version', 'Role in this project'],
        [['MongoDB Community Server', '7.0', 'Document database holding four collections. '
                                             'Chosen for the schema flexibility discussed in '
                                             'Section 4.6 and for its single-document atomicity '
                                             'guarantee, on which the stock reservation '
                                             'depends.'],
         ['MongoDB text index', '—', 'A weighted compound text index over product title, brand '
                                     'and description, giving relevance-ranked keyword search '
                                     'without a collection scan.'],
         ['MongoDB aggregation pipeline', '—', 'Computes the dashboard figures — revenue '
                                               'totals, the daily series, the status breakdown '
                                               'and best sellers — inside the database rather '
                                               'than by loading every order into the '
                                               'application.']],
        caption='Data-tier technologies',
        widths=[1.3, 0.5, 2.35], font_size=8.5)

    r.h2('4.5  Development, Testing and Tooling')
    r.table(
        ['Tool', 'Purpose'],
        [['Jest 29', 'Test runner and assertion library for all 129 automated tests.'],
         ['Supertest 7', 'Drives the Express application over HTTP inside the test process, '
                         'without binding a port.'],
         ['mongodb-memory-server 10', 'Starts a real MongoDB binary on a random port with data '
                                      'files in a temporary directory. Using a genuine server '
                                      'rather than a mock means the tests exercise real index '
                                      'behaviour, real unique-constraint violations and real '
                                      'atomic updates.'],
         ['Visual Studio Code', 'Editor.'],
         ['Postman and curl', 'Manual API exploration during development.'],
         ['Git', 'Version control.'],
         ['MongoDB Compass / mongosh', 'Inspecting collections and explaining query plans.'],
         ['Chrome DevTools', 'Layout debugging, network inspection and responsive testing.']],
        caption='Development and testing tools',
        widths=[1.1, 3.2], font_size=8.5)

    r.h2('4.6  Justification of the Principal Choices')
    r.p('Three choices deserve an explicit defence, because in each case a reasonable '
        'alternative exists.')

    r.h3('4.6.1  Why a document database rather than a relational one')
    r.p('The decisive consideration is the shape of product data. A pair of running shoes has '
        'a size and a colour; a laptop has a processor, a memory capacity and a warranty '
        'period; a paperback has an author, a publisher and a page count. Representing all '
        'three in one relational table requires either a wide table in which most columns are '
        'null for most rows, or an entity-attribute-value arrangement in which every attribute '
        'read becomes a join. The first wastes space and makes constraints meaningless; the '
        'second turns a simple product listing into a multi-way join whose cost grows with '
        'traffic.')
    r.p('A document model stores each product as one self-contained record, so products with '
        'different attributes coexist in one collection and a product read is a single '
        'document fetch. This is not an argument that document databases are generally '
        'superior — for a system dominated by many-to-many relationships and multi-table '
        'transactions, a relational engine would be the better choice. It is an argument that '
        'the dominant access pattern here, which is reading one product or a page of products '
        'by an indexed filter, is exactly what a document store is good at.')

    r.h3('4.6.2  Why the Context API rather than Redux')
    r.p('The application-wide state consists of three things: the signed-in user, the cart and '
        'the notification queue. Redux would add a store, action creators, reducers, selectors '
        'and middleware to manage state that fits comfortably in three context providers, one '
        'of which already uses a reducer where a reducer earns its place — the cart, whose '
        'every mutation must be followed by the same persistence step. Adding a dependency to '
        'solve a problem the project does not have would make the code harder to follow, not '
        'easier. Were the state to grow to the point where prop drilling or unnecessary '
        're-renders became a real cost, the reducer in `CartContext` would migrate to a store '
        'with little disruption, because the component interface is already the same shape.')

    r.h3('4.6.3  Why JSON Web Tokens rather than server sessions')
    r.p('Server-side sessions require the server to hold state for every signed-in user, which '
        'ties a user to a particular server instance unless a shared session store is '
        'introduced. A signed token moves that state to the client and lets any instance '
        'verify a request with nothing but the signing key.')
    r.p('The standard objection to tokens is that they cannot be revoked before they expire. '
        'That objection is answered here by re-reading the user record from the database on '
        'every protected request rather than trusting the token payload. The cost is one '
        'indexed lookup per request; the benefit is that deactivating an account takes effect '
        'on that account’s very next request, which test case TC-I-62 demonstrates. The '
        'token therefore establishes identity, but authority is always checked against live '
        'data.')

    # ==================== 5. ANALYSIS DOCUMENTS ===========================
    r.h1('5.  SYSTEM DESIGN — ANALYSIS DOCUMENTS')

    r.p('This chapter presents the analysis models: the data flow diagrams from context level '
        'down to the second level, the entity-relationship model, the use case model and the '
        'data dictionary. Chapter 6 then moves from what the system does to how it is built.')

    r.h2('5.1  Context Diagram (DFD Level 0)')
    r.p('The context diagram fixes the system boundary. It shows the whole application as a '
        'single process and identifies the two external entities that interact with it, '
        'together with the data that crosses the boundary in each direction.')

    r.figure('fig-5-1-dfd-level-0.png',
             'Context diagram showing the system boundary and the two external entities')

    r.p('There are exactly two external entities. The **Customer** supplies registration and '
        'sign-in details, search terms, cart changes, a delivery address and payment details, '
        'and receives catalogue pages, cart totals, an invoice and order status. The **Store '
        'Administrator** supplies catalogue and stock updates and fulfilment decisions, and '
        'receives sales analytics, the order queue and low-stock alerts. No other party '
        'interacts with the system: because the payment gateway is simulated inside the '
        'application, there is no external payment processor on the diagram. A production '
        'deployment would add one, and Section 12.2 describes what that would change.')

    r.h2('5.2  Data Flow Diagram — Level 1')
    r.p('The single process of the context diagram decomposes into seven processes. '
        + r.ref_figure('Level 1 data flow diagram') +
        ' places the four data stores between the customer-facing processes on the left and the '
        'administrative processes on the right, which keeps the flow lines short and makes the '
        'separation of the two access paths visible.')

    r.figure('fig-5-2-dfd-level-1.png',
             'Level 1 data flow diagram — seven processes and four data stores',
             width_inches=5.7)

    r.table(
        ['Process', 'Responsibility', 'Stores accessed'],
        [['1.0 Manage Identity', 'Registration, credential verification, token issue, profile '
                                 'and password maintenance.', 'D1 Users (read / write)'],
         ['2.0 Browse Catalogue', 'Parses search and filter parameters, executes the catalogue '
                                  'query, paginates the result.',
          'D2 Categories (read), D3 Products (read)'],
         ['3.0 Maintain Cart', 'Holds the cart in the browser, validates quantities against '
                               'live stock and price.', 'D3 Products (read)'],
         ['4.0 Process Checkout', 'Re-prices the cart, reserves stock, authorises payment, '
                                  'persists the order.',
          'D3 Products (read / write), D4 Orders (write)'],
         ['5.0 Maintain Catalogue', 'Administrator creation and amendment of products and '
                                    'categories, and stock adjustment.',
          'D2 Categories (write), D3 Products (write)'],
         ['6.0 Fulfil Orders', 'Advances order status within the state machine; restores stock '
                               'on cancellation.',
          'D4 Orders (read / write), D3 Products (write)'],
         ['7.0 Report Analytics', 'Aggregates revenue, order counts, best sellers and low '
                                  'stock.',
          'D1 Users (read), D3 Products (read), D4 Orders (read)']],
        caption='Level 1 processes and the stores they access',
        widths=[1.1, 2.1, 1.1], font_size=8.5)

    r.h2('5.3  Data Flow Diagrams — Level 2')
    r.p('Two processes are decomposed further: process 4.0, because it carries the system’s '
        'most important correctness requirements, and process 2.0, because it is where '
        'untrusted input meets the database.')

    r.h3('5.3.1  Explosion of process 4.0 — Process Checkout')
    r.figure('fig-5-3-dfd-level-2-checkout.png',
             'Level 2 explosion of the checkout process',
             width_inches=5.7)

    r.p('The ordering of these six sub-processes is the design, not an implementation detail. '
        'Process 4.2 re-prices the cart from the database, so the figure the customer is asked '
        'to authorise is the store’s figure and not the browser’s. Process 4.3 '
        'reserves stock **before** 4.4 authorises payment, so a customer is never charged for '
        'an item that sold out in the interval. If 4.4 declines, process 4.6 returns the '
        'reserved units to the catalogue as a compensating action, leaving stock exactly as it '
        'was. Test case TC-I-40 asserts precisely this: after a declined payment, the stock '
        'count is unchanged and no order document exists.')

    r.table(
        ['Sub-process', 'Input', 'Processing', 'Output'],
        [['4.1 Validate Cart', 'Raw cart lines from the client',
          'Checks each product reference is a valid identifier and each quantity a whole '
          'number within the cap; merges duplicate lines for the same product so that '
          'splitting a line cannot bypass the cap.',
          'Normalised line list, or a 422 error'],
         ['4.2 Re-price from DB', 'Normalised lines',
          'Reads the current price and stock of every referenced product; rejects any product '
          'that is withdrawn or short of stock; computes subtotal, delivery charge, tax and '
          'total.', 'Priced lines and authoritative totals'],
         ['4.3 Reserve Stock', 'Priced lines',
          'For each line, performs a conditional atomic decrement. On failure, releases every '
          'reservation already taken in this request.',
          'Confirmation, or a 409 naming the item'],
         ['4.4 Authorise Payment', 'Card details and payable amount',
          'Validates the card structurally (Luhn checksum, expiry, CVV) and simulates an '
          'authorisation; retains only the last four digits.',
          'Transaction reference, or a decline'],
         ['4.5 Persist Order', 'Priced lines, address, payment result',
          'Generates a unique invoice number and writes the order document with a snapshot of '
          'every line.', 'Order record and invoice number'],
         ['4.6 Release Stock', 'Priced lines',
          'Compensating action: increments stock back by the reserved quantity.',
          'Stock restored to its prior value']],
        caption='Sub-processes of the checkout engine',
        widths=[0.85, 0.9, 2.05, 0.9], font_size=8.5)

    r.h3('5.3.2  Explosion of process 2.0 — Browse Catalogue')
    r.figure('fig-5-4-dfd-level-2-catalogue.png',
             'Level 2 explosion of the catalogue browsing process',
             width_inches=5.7)

    r.p('Parsing (2.1) and filter construction (2.2) are separate sub-processes because that '
        'is where the security boundary lies. Every value arriving in the query string is '
        'coerced to the type the filter expects — an identifier is accepted only if it parses '
        'as a valid ObjectId, a price bound only if it parses as an integer, a sort key only '
        'if it appears in a whitelist. A string is never handed to MongoDB unchanged, which '
        'is what prevents an attacker from smuggling an operator object such as '
        '`{"$ne": null}` through a query parameter. Test case TC-U-24 exercises exactly that '
        'attempt and asserts that the resulting filter contains neither value.')

    r.h2('5.4  Entity–Relationship Model')
    r.p(r.ref_figure('Entity–relationship diagram') +
        ' presents the conceptual data model. MongoDB has no foreign-key constraints, '
        'so the relationships shown are maintained by application code rather than by the '
        'engine; the model is nonetheless a faithful description of how the data is related.')

    r.figure('fig-5-5-er-diagram.png',
             'Entity–relationship diagram. ORDER_ITEM is a weak entity embedded within ORDER.',
             width_inches=5.7)

    r.table(
        ['Relationship', 'Cardinality', 'Implementation', 'Rationale'],
        [['USER places ORDER', '1 : M', '`order.user` holds the user’s ObjectId.',
          'A customer may place many orders; every order belongs to exactly one customer.'],
         ['ORDER contains ORDER_ITEM', '1 : M',
          'Embedded array `order.items` inside the order document.',
          'Order lines are never queried independently of their order and are written once, so '
          'embedding avoids a join on the most frequent order read.'],
         ['ORDER_ITEM refers to PRODUCT', 'M : 1',
          '`items[].product` holds the product’s ObjectId, alongside a snapshot of the '
          'title and unit price.',
          'The reference allows navigation back to the catalogue entry; the snapshot means a '
          'later price change cannot rewrite a historical invoice.'],
         ['CATEGORY classifies PRODUCT', '1 : M', '`product.category` holds the '
                                                  'category’s ObjectId.',
          'Referencing rather than embedding means renaming a category updates every listing '
          'at once.']],
        caption='Relationships and how each is implemented',
        widths=[1.1, 0.55, 1.5, 1.75], font_size=8.5)

    r.h3('5.4.1  Why order lines are embedded but categories are referenced')
    r.p('The two decisions look inconsistent and are worth justifying together, because they '
        'follow from the same rule applied to different access patterns.')
    r.p('Order lines are **embedded**. They are written once, at checkout, and are afterwards '
        'read only as part of their order — nobody asks "show me every order line for product '
        'X" outside the analytics pipeline, which handles it with an unwind stage. Embedding '
        'makes the common read a single document fetch and makes the order record '
        'self-contained, which matters for a financial document.')
    r.p('Categories are **referenced**. A category is read on nearly every catalogue request '
        'and is displayed by name, but it changes rarely and is shared by many products. '
        'Embedding the category into each product would mean that renaming one category '
        'required rewriting every product document that used it. Referencing makes the rename '
        'a single write.')
    r.p('The rule behind both is the same: embed data that is written with its parent and read '
        'with its parent; reference data that is shared and changes independently.')

    r.h2('5.5  Use Case Model')
    r.figure('fig-5-6-use-case.png',
             'Use case diagram showing seven customer use cases and six administrative use cases',
             width_inches=5.7)

    r.p(r.ref_table('Use case description — Place an Order') +
        ' gives the detailed description of the two use cases that carry the most '
        'logic. The remainder follow the same pattern and are not reproduced individually.')

    r.table(
        ['Field', 'UC-06  Place an Order'],
        [['Actor', 'Customer (authenticated)'],
         ['Precondition', 'The customer is signed in and the cart contains at least one item.'],
         ['Main flow',
          '1. The customer opens the checkout page.\n'
          '2. The system re-prices the cart from the database and displays the authoritative '
          'total.\n'
          '3. The customer enters or confirms the delivery address.\n'
          '4. The customer selects card payment or cash on delivery.\n'
          '5. For a card payment, the customer enters the card details.\n'
          '6. The customer submits the order.\n'
          '7. The system validates the address and the card structurally.\n'
          '8. The system re-prices the cart again and reserves stock atomically for every '
          'line.\n'
          '9. The system authorises the payment.\n'
          '10. The system writes the order with a unique invoice number.\n'
          '11. The system empties the cart and shows the confirmation.'],
         ['Alternative — out of stock',
          'At step 8, if any line cannot be reserved, every reservation already taken is '
          'released, a 409 response names the item concerned, and the cart is left intact.'],
         ['Alternative — payment declined',
          'At step 9, if authorisation fails, the reserved stock is released, a 422 response '
          'explains the decline, and no order is written.'],
         ['Alternative — cash on delivery',
          'Steps 5 and 9 are skipped. The order is created with status PENDING and payment '
          'status PENDING, and is marked paid when it reaches DELIVERED.'],
         ['Postcondition',
          'An order exists with a unique invoice number; stock is reduced by exactly the '
          'quantities ordered; the cart is empty.'],
         ['Requirements covered', 'FR-13 to FR-20'],
         ['Test cases', 'TC-I-36 to TC-I-45, TC-S-01, TC-S-03']],
        caption='Use case description — Place an Order',
        widths=[0.9, 3.4], font_size=8.5)

    r.table(
        ['Field', 'UC-11  Progress Order Status'],
        [['Actor', 'Store administrator'],
         ['Precondition', 'The administrator is signed in and an order exists.'],
         ['Main flow',
          '1. The administrator opens the order queue, optionally filtered by status.\n'
          '2. The system displays each order with only the status transitions that are legal '
          'from its current state.\n'
          '3. The administrator selects a transition.\n'
          '4. The system validates the transition against the order state machine.\n'
          '5. The system records the new status and appends an entry to the status history.'],
         ['Alternative — cancellation',
          'If the chosen transition is CANCELLED, the system first returns every reserved unit '
          'to the catalogue and marks a paid order as refunded.'],
         ['Alternative — cash on delivery reaching DELIVERED',
          'The payment status is set to PAID and the settlement time recorded.'],
         ['Exception — illegal transition',
          'If a transition that is not permitted from the current state is requested — for '
          'example moving a DELIVERED order back to SHIPPED — the system rejects it with a 409 '
          'response naming the permitted next states.'],
         ['Postcondition', 'The order carries the new status and an audit trail entry.'],
         ['Requirements covered', 'FR-22, FR-23'],
         ['Test cases', 'TC-I-51 to TC-I-55, TC-S-01']],
        caption='Use case description — Progress Order Status',
        widths=[0.9, 3.4], font_size=8.5)

    r.h2('5.6  Data Dictionary')
    r.p('The data dictionary records every field of every collection: its type, its '
        'constraints and its purpose. The types given are the Mongoose schema types, which '
        'map onto BSON types in storage.')

    r.h3('5.6.1  Collection: users')
    r.table(
        ['Field', 'Type', 'Constraints', 'Description'],
        [['_id', 'ObjectId', 'Primary key, auto-generated', 'Unique account identifier.'],
         ['name', 'String', 'Required, 2–80 characters, trimmed', 'Display name.'],
         ['email', 'String', 'Required, unique index, lower-cased, pattern-checked',
          'Sign-in identifier. Normalising to lower case at write time is what makes the '
          'unique index genuinely case-insensitive.'],
         ['password', 'String', 'Required, minimum 8 characters, `select: false`',
          'bcrypt hash at work factor 12. Never selected by a query unless explicitly '
          'requested, and stripped again during JSON serialisation.'],
         ['role', 'String', 'Enumeration {customer, admin}, default customer',
          'Authorisation discriminator. Never writable through the registration endpoint.'],
         ['address', 'Sub-document', 'Optional', 'Default delivery address: line1, line2, city, '
                                                 'state, pincode (6 digits), phone (10 digits '
                                                 'beginning 6–9).'],
         ['isActive', 'Boolean', 'Default true',
          'Cleared to deactivate an account; checked on every authenticated request.'],
         ['lastLoginAt', 'Date', 'Nullable', 'Time of the most recent successful sign-in.'],
         ['createdAt / updatedAt', 'Date', 'Maintained automatically', 'Audit timestamps.']],
        caption='Data dictionary — users collection',
        widths=[0.8, 0.6, 1.2, 2.1], font_size=8.5)

    r.h3('5.6.2  Collection: categories')
    r.table(
        ['Field', 'Type', 'Constraints', 'Description'],
        [['_id', 'ObjectId', 'Primary key', 'Unique category identifier.'],
         ['name', 'String', 'Required, unique index, 2–60 characters', 'Display name.'],
         ['slug', 'String', 'Unique index, derived from name',
          'URL-safe form used in links; regenerated whenever the name changes.'],
         ['description', 'String', 'Optional, maximum 300 characters', 'Short description.'],
         ['isActive', 'Boolean', 'Default true', 'Withdraws a category from the navigation.'],
         ['createdAt / updatedAt', 'Date', 'Maintained automatically', 'Audit timestamps.']],
        caption='Data dictionary — categories collection',
        widths=[0.8, 0.6, 1.2, 2.1], font_size=8.5)

    r.h3('5.6.3  Collection: products')
    r.table(
        ['Field', 'Type', 'Constraints', 'Description'],
        [['_id', 'ObjectId', 'Primary key', 'Unique product identifier.'],
         ['title', 'String', 'Required, 3–140 characters, text-indexed (weight 10)',
          'Product name; the highest-weighted field in keyword search.'],
         ['description', 'String', 'Required, 10–4000 characters, text-indexed (weight 1)',
          'Full description.'],
         ['brand', 'String', 'Optional, maximum 60 characters, text-indexed (weight 5)',
          'Manufacturer or brand.'],
         ['price', 'Number', 'Required, 1–10,000,000, rounded to a whole number',
          'Selling price in whole rupees. Rounding at write time prevents binary '
          'floating-point drift accumulating across order arithmetic.'],
         ['mrp', 'Number', 'Optional, ≥ 1', 'Maximum retail price; used to derive the displayed '
                                            'discount.'],
         ['category', 'ObjectId', 'Required, references categories, indexed',
          'Owning category.'],
         ['stockCount', 'Number', 'Required, ≥ 0, whole number, default 0',
          'Units available. The field on which the atomic conditional decrement operates.'],
         ['imageUrl', 'String', 'Optional, http(s) URL or root-relative path',
          'Product illustration.'],
         ['rating / ratingCount', 'Number', '0–5 / ≥ 0', 'Displayed customer rating. Not '
                                                         'writable through the API.'],
         ['isActive', 'Boolean', 'Default true, indexed',
          'Cleared by a soft delete so historical orders keep a valid reference.'],
         ['createdAt / updatedAt', 'Date', 'Maintained automatically', 'Audit timestamps.']],
        caption='Data dictionary — products collection',
        widths=[0.8, 0.6, 1.25, 2.05], font_size=8.5)

    r.h3('5.6.4  Collection: orders')
    r.table(
        ['Field', 'Type', 'Constraints', 'Description'],
        [['_id', 'ObjectId', 'Primary key', 'Unique order identifier.'],
         ['invoiceNo', 'String', 'Required, unique index, upper-cased',
          'Format INV-YYYYMMDD-XXXXXX, where the suffix is six cryptographically random hex '
          'characters so invoice numbers cannot be enumerated.'],
         ['user', 'ObjectId', 'Required, references users', 'Purchasing customer.'],
         ['items', 'Array of sub-documents', 'At least one element',
          'Order lines: product reference, title snapshot, unitPrice snapshot, quantity '
          '(1–10) and lineTotal.'],
         ['itemsTotal', 'Number', 'Required, ≥ 0', 'Sum of the line totals, in rupees.'],
         ['shippingFee', 'Number', 'Required, ≥ 0', 'Nil at or above ₹500, otherwise ₹49.'],
         ['taxAmount', 'Number', 'Required, ≥ 0', 'Tax at 18%, rounded to whole rupees so the '
                                                  'invoice balances.'],
         ['totalPrice', 'Number', 'Required, ≥ 0', 'Amount payable.'],
         ['shippingAddress', 'Sub-document', 'Required',
          'Delivery address snapshot taken at the time of the order.'],
         ['payment', 'Sub-document', 'Required',
          'method {CARD, COD}; status {PENDING, PAID, FAILED, REFUNDED}; transactionId; '
          'cardLast4; paidAt. No card number or CVV is present.'],
         ['status', 'String', 'Enumeration of five states, indexed',
          'PENDING, CONFIRMED, SHIPPED, DELIVERED or CANCELLED.'],
         ['statusHistory', 'Array', '—', 'Audit trail of every status change with its time and '
                                         'an optional note.'],
         ['placedAt / cancelledAt', 'Date', '—', 'Order and cancellation times.']],
        caption='Data dictionary — orders collection',
        widths=[0.85, 0.7, 1.05, 2.1], font_size=8.5)
