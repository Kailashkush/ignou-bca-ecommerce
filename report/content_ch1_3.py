"""Chapters 1–3: Introduction, Objectives, System Analysis."""


def build(r):
    # ==================== 1. INTRODUCTION =================================
    r.h1('1.  INTRODUCTION')

    r.h2('1.1  Background')
    r.p('Retail in India has moved decisively online over the past decade. For a small or '
        'medium-sized retailer, however, the move is not simply a matter of deciding to sell '
        'on the internet. The retailer must choose between a hosted platform that charges a '
        'recurring fee and a share of every transaction, and a self-hosted system that must '
        'be built and maintained. The first option is quick but expensive over time and '
        'restrictive in what can be customised; the second demands engineering effort that a '
        'small business rarely has in-house.')
    r.p('This project takes the second route and asks what it actually costs, in engineering '
        'terms, to build a competent online store. The answer turns out to be less about '
        'the volume of code and more about getting a handful of things right: knowing who the '
        'user is, never trusting a price that arrives from a browser, and making sure two '
        'customers cannot buy the same last unit.')
    r.p('The result is ShopSphere, a working e-commerce web application built on the MERN '
        'stack — MongoDB, Express.js, React and Node.js. It supports a public catalogue with '
        'search and filtering, registered customer accounts, a persistent shopping cart, a '
        'checkout with a simulated payment gateway, order tracking, and a back-office '
        'dashboard through which a store administrator maintains the catalogue and fulfils '
        'orders.')

    r.h2('1.2  The Problem in Concrete Terms')
    r.p('Three specific technical problems recur in small-scale e-commerce systems, and this '
        'project treats each of them as a first-class design concern rather than an '
        'afterthought.')

    r.h3('1.2.1  The client cannot be trusted')
    r.p('A shopping cart normally lives in the browser so that adding an item feels instant. '
        'But whatever lives in the browser can be edited by the person using it. A system that '
        'accepts the cart total sent by the client will, sooner or later, sell a television '
        'for one rupee. The design adopted here keeps the cart in the browser for '
        'responsiveness but treats the submitted cart as nothing more than a list of product '
        'identifiers and quantities; every price, every subtotal, the shipping charge, the tax '
        'and the final payable amount are recomputed on the server from the database before '
        'an order is accepted.')

    r.h3('1.2.2  Two customers, one last unit')
    r.p('If the last unit of a product is in stock and two customers check out at the same '
        'instant, the obvious implementation — read the stock, compare it with the quantity '
        'wanted, then write the reduced figure back — contains a window between the read and '
        'the write in which both requests see stock available. Both succeed, and the store has '
        'sold something it does not have. This is a classic race condition, and it does not '
        'appear during manual testing because it needs two requests to arrive within '
        'milliseconds of each other. The system resolves it by making the check and the '
        'decrement a single atomic database operation, described in detail in Section 6.4.2 '
        'and demonstrated by test case TC-U-36.')

    r.h3('1.2.3  Credentials and card data')
    r.p('Amateur implementations frequently store passwords in a form from which the original '
        'can be recovered, and some store card numbers "for convenience". Both are serious '
        'failures. In this system passwords are stored only as bcrypt hashes with a work '
        'factor of twelve, and the card number supplied at checkout is validated in memory, '
        'reduced to its last four digits for the invoice, and then discarded. Test cases '
        'TC-U-09 and TC-I-39 assert that neither the card number nor the CVV appears anywhere '
        'in the stored order document.')

    r.h2('1.3  Structure of This Report')
    r.p('The report follows the software development life cycle. Chapter 2 states the '
        'objectives and fixes the scope. Chapter 3 covers system analysis: the identification '
        'of need, the feasibility study, the process model adopted, the schedule, the software '
        'requirements specification and the hardware and software requirements. Chapter 4 '
        'describes the tools and environment. Chapters 5 and 6 present the analysis and design '
        'documents respectively — data flow diagrams to the second level, the '
        'entity-relationship model, the data dictionary, modularisation, database design, '
        'procedural design and interface design. Chapter 7 covers the implementation and the '
        'coding standards applied. Chapter 8 presents the test case designs and results for '
        'unit, integration and system testing, together with an account of the defects found '
        'and corrected. Chapter 9 reproduces the input and output screens. Chapter 10 sets out '
        'the security measures implemented. Chapters 11 to 13 state the limitations, the '
        'scope for future work, and the conclusion. The complete source code is reproduced in '
        'Appendix A.')

    # ==================== 2. OBJECTIVES ===================================
    r.h1('2.  OBJECTIVES OF THE PROJECT')

    r.h2('2.1  Primary Objectives')
    r.p('The project sets out to deliver a working, tested e-commerce application that meets '
        'the following objectives. Each is stated so that it can be verified rather than '
        'merely asserted, and the final column of ' + r.ref_table('Project objectives and the evidence') +
        ' names the evidence in this report that establishes it.')

    r.table(
        ['#', 'Objective', 'How it is verified'],
        [['O1', 'Build a responsive customer interface that remains usable on a desktop '
                'monitor, a tablet and a mobile phone without a separate mobile site.',
          'Screens in Chapter 9 captured at 1440 px, 834 px and 390 px widths (Figures '
          + r.ref_figure('Home page at 390 px').split()[1] + '–'
          + r.ref_figure('Catalogue at 834 px').split()[1] + ').'],
         ['O2', 'Implement stateless authentication using JSON Web Tokens, with passwords '
                'stored only as one-way hashes.',
          'Section 10.2; test cases TC-U-37 to TC-U-42, TC-I-01 to TC-I-16.'],
         ['O3', 'Provide catalogue search, category filtering, price-band filtering, sorting '
                'and pagination backed by database indexes rather than collection scans.',
          'Section 6.2.3; test cases TC-U-14 to TC-U-24, TC-I-17 to TC-I-24.'],
         ['O4', 'Guarantee that concurrent checkouts cannot oversell stock.',
          'Section 6.4.2; test cases TC-U-36 and TC-I-45.'],
         ['O5', 'Recompute every monetary amount on the server so that a tampered client '
                'cannot alter what it pays.',
          'Section 6.4.1; test case TC-I-38.'],
         ['O6', 'Enforce role-based access control so that customer accounts cannot reach '
                'administrative functions or other customers’ orders.',
          'Section 10.3; test cases TC-I-29, TC-I-30, TC-I-47, TC-I-50, TC-I-59.'],
         ['O7', 'Provide a back-office dashboard with sales analytics, catalogue maintenance, '
                'order fulfilment and customer administration.',
          'Chapter 9, Figures '
          + r.ref_figure('Administrator dashboard').split()[1] + '–'
          + r.ref_figure('Customer administration').split()[1]
          + '; test cases TC-I-56 to TC-I-65.'],
         ['O8', 'Document every phase of the development life cycle in accordance with the '
                'BCSP-064 guidelines.',
          'This report in its entirety.']],
        caption='Project objectives and the evidence for each',
        widths=[0.3, 2.0, 1.9], font_size=8.5)

    r.h2('2.2  Scope — What the System Does')
    r.p('The scope was fixed deliberately narrow so that the features chosen could be '
        'implemented properly and tested, rather than a longer list implemented superficially. '
        'The system provides:')
    r.bullets([
        '**Account management** — registration with a password policy, sign-in, sign-out, '
        'profile and default-address maintenance, and password change.',
        '**Catalogue browsing** — a paginated product listing with full-text keyword search, '
        'filtering by category, price band and stock availability, and five sort orders.',
        '**Product detail** — full description, live stock position, discount calculation '
        'against the maximum retail price, and related items from the same category.',
        '**Shopping cart** — add, change quantity and remove, with the cart surviving a page '
        'reload, and per-item and per-order quantity caps enforced on both client and server.',
        '**Checkout** — server-side re-pricing, delivery address capture with validation, a '
        'simulated card gateway and a cash-on-delivery option, and invoice generation.',
        '**Order tracking** — order history, full order detail with a status timeline, and '
        'customer-initiated cancellation while the order has not yet shipped.',
        '**Store administration** — a sales dashboard with a fourteen-day revenue series, '
        'best-selling products and low-stock alerts; product and category maintenance; stock '
        'adjustment; order status progression; and customer account activation.',
    ])

    r.h2('2.3  Scope — What the System Deliberately Does Not Do')
    r.p('Stating the exclusions explicitly is as important as stating the inclusions, because '
        'it prevents the report from implying capabilities the software does not have.')
    r.bullets([
        '**No live payment processing.** The gateway is simulated. It reproduces the contract '
        'of a real gateway — validate, authorise, return a reference — but no money moves and '
        'no acquirer is contacted. This is a requirement of the academic brief, not an '
        'oversight, and the reasoning is set out in Section 6.4.3.',
        '**No multi-vendor marketplace.** There is a single store with a single administrative '
        'role. Seller onboarding, commission handling and per-vendor payouts are out of scope.',
        '**No shipping-carrier integration.** Order status is advanced manually by the '
        'administrator; there is no pickup booking or live consignment tracking.',
        '**No product reviews or ratings submission.** Ratings are displayed from seeded data '
        'but customers cannot submit them.',
        '**No email or SMS notification.** Order confirmation is shown on screen and in the '
        'order history; nothing is despatched.',
        '**No recommendation engine.** "Related products" is a same-category query, not a '
        'learned recommendation.',
    ])

    # ==================== 3. SYSTEM ANALYSIS ==============================
    r.h1('3.  SYSTEM ANALYSIS')

    r.h2('3.1  Identification of Need and Preliminary Investigation')
    r.p('The investigation began by examining how a small retailer currently operates without '
        'a web presence, and where the manual process breaks down.')

    r.table(
        ['Aspect of the manual process', 'Observed difficulty', 'How the proposed system addresses it'],
        [['Trading hours', 'Sales are possible only while the shop is open; enquiries outside '
                           'those hours are lost.',
          'The catalogue and checkout are available continuously.'],
         ['Stock records', 'Stock is tracked in a register or a spreadsheet and is updated '
                           'after the fact, so the figure is frequently wrong.',
          'Stock is decremented atomically at the moment an order is accepted, so the '
          'catalogue figure and the physical figure stay in step.'],
         ['Price changes', 'A price change must be applied to every label and price list by hand.',
          'A single update in the administration screen changes the price everywhere at once, '
          'while orders already placed keep the price they were sold at.'],
         ['Order records', 'Orders are recorded on paper; finding a past order means searching '
                           'through a file.',
          'Every order carries a unique invoice number and is retrievable by the customer and '
          'by the administrator.'],
         ['Sales visibility', 'The owner knows the day’s takings but not which products '
                              'are selling or which are about to run out.',
          'The dashboard reports revenue over fourteen days, best-selling products by units '
          'and revenue, and products at or below a low-stock threshold.'],
         ['Geographic reach', 'Customers must be physically present.',
          'Any customer with a browser can order; delivery is to a validated Indian address.']],
        caption='Difficulties with the manual process and the corresponding system response',
        widths=[1.1, 1.6, 1.7], font_size=8.5)

    r.p('The investigation also considered the alternative of adopting an existing hosted '
        'platform. ' + r.ref_table('Comparison of implementation options') +
        ' sets out that comparison.')

    r.table(
        ['Option', 'Strengths', 'Weaknesses for this class of user'],
        [['Hosted SaaS platform (Shopify, BigCommerce and similar)',
          'Operational within days; hosting, updates and security patching handled by the '
          'vendor; a large ecosystem of add-ons.',
          'A recurring subscription plus a percentage of each transaction; limited control '
          'over the source; the store is difficult to migrate away from later.'],
         ['Open-source monolith (Magento, PrestaShop and similar)',
          'No licence fee; a large feature set available immediately.',
          'Heavy resource requirements; customisation usually means working against the '
          'framework; each third-party plugin widens the attack surface.'],
         ['Purpose-built decoupled application (this project)',
          'No licence or transaction fee; complete control over behaviour and data; a small '
          'surface area that one developer can reason about; modest hosting requirements.',
          'Requires engineering effort up front; the operator is responsible for hosting, '
          'backups and security updates.']],
        caption='Comparison of implementation options',
        widths=[1.0, 1.7, 1.7], font_size=8.5)

    r.p('The conclusion of the preliminary investigation was that a purpose-built decoupled '
        'application is justified where the retailer has access to development effort — which '
        'is the situation of an academic project — and where long-run transaction fees would '
        'otherwise accumulate. That conclusion sets the direction for the rest of this report.')

    # ---------- 3.2 Feasibility -------------------------------------------
    r.h2('3.2  Feasibility Study')
    r.p('Feasibility was assessed along four dimensions before implementation began.')

    r.h3('3.2.1  Technical feasibility')
    r.p('The stack chosen is JavaScript end to end. The same language runs in the browser, on '
        'the server and in the test suite, and the data representation — JSON objects on the '
        'wire, BSON documents in the database — needs no translation layer between tiers. For '
        'a single developer this materially reduces the cognitive load of moving between '
        'tiers, which is the largest practical risk in a solo full-stack project.')
    r.p('Node.js handles concurrent requests on a single-threaded event loop with non-blocking '
        'input and output, which suits an application whose work is dominated by waiting for '
        'the database rather than by computation. React’s component model and virtual DOM '
        'keep interface updates localised. MongoDB’s document model accommodates products '
        'whose attributes differ by category without the sparse columns or entity-attribute-'
        'value tables that the same requirement forces on a strictly relational schema. Every '
        'component is mature, documented and widely deployed; none of them is experimental.')
    r.p('The one genuine technical risk identified in advance was concurrency control during '
        'checkout, because MongoDB guarantees atomicity at the level of a single document but '
        'multi-document transactions require a replica set, which a standalone development '
        'installation is not. The resolution — a conditional atomic update with a compensating '
        'action, upgrading to a real transaction when the deployment supports one — is set out '
        'in Section 6.4.2. The risk was therefore assessed as manageable, and the project was '
        'judged technically feasible.')

    r.h3('3.2.2  Economic feasibility')
    r.p('Every component of the development environment is free and open source: Node.js, '
        'React, Express, MongoDB Community Server, Mongoose, Jest, Vite, Git and Visual Studio '
        'Code. The only development cost is the student’s time. '
        + r.ref_table('Indicative cost comparison') + ' sets out the '
        'position for a hypothetical first year of live operation, which is the relevant '
        'comparison for a retailer weighing this against a subscription platform.')

    r.table(
        ['Item', 'Self-hosted (this project)', 'Hosted SaaS platform'],
        [['Software licences', 'Nil — all components are open source',
          'Nil, but bundled into the subscription'],
         ['Subscription', 'Nil', 'Approximately ₹2,000 – ₹8,000 per month'],
         ['Transaction commission', 'Nil (payment-gateway charges apply in both cases)',
          '0.5% – 2% of each order in addition to gateway charges'],
         ['Application hosting', 'Approximately ₹500 – ₹900 per month on an entry-level '
                                 'cloud instance', 'Included'],
         ['Database hosting', 'Nil on the same instance, or approximately ₹0 on a free-tier '
                              'managed cluster at this scale', 'Included'],
         ['Domain and TLS certificate', 'Approximately ₹900 per year; TLS free via '
                                        "Let’s Encrypt", 'Domain billed separately'],
         ['Development effort', 'Borne once, up front', 'Minimal'],
         ['Indicative first-year cash cost', '**≈ ₹8,000 – ₹12,000**',
          '**≈ ₹24,000 – ₹96,000 plus commission**']],
        caption='Indicative cost comparison for the first year of operation',
        widths=[1.2, 1.6, 1.6], font_size=8.5)

    r.p('The figures above are indicative rather than quoted, and are included to show the '
        'shape of the trade-off rather than to give a precise budget. The conclusion is that '
        'the self-hosted route trades a one-off engineering cost for a materially lower '
        'recurring cost, and is economically feasible for the intended user.')

    r.h3('3.2.3  Operational feasibility')
    r.p('The people who must operate the system are the store administrator and the customers. '
        'The administrator needs no database knowledge: products, categories, stock and order '
        'status are all maintained through forms and buttons, and the state machine governing '
        'order status means the interface only ever offers a transition the server will '
        'accept, so an administrator cannot reach an invalid state by clicking the wrong '
        'thing. Customers need no training; the catalogue, cart and checkout follow the '
        'conventions already established by the large retail sites they use.')
    r.p('Operationally the decoupled design also helps maintenance: because the browser '
        'application communicates with the server only over a documented set of REST '
        'endpoints, the interface can be restyled or rebuilt without touching the server, and '
        'the server can be refactored without breaking the interface so long as the endpoint '
        'contract holds.')

    r.h3('3.2.4  Behavioural feasibility')
    r.p('Behavioural feasibility asks whether the people affected will actually adopt the '
        'system. The principal resistance expected from a small retailer is a reluctance to '
        'trust an unfamiliar process with money and stock. Three design decisions address '
        'that directly: the stock figure shown in the catalogue is the real figure, because '
        'it is decremented at the moment of sale rather than in a later reconciliation; every '
        'order carries an invoice number and a full status history, so any query can be '
        'answered from the record; and the dashboard presents the day-to-day numbers the owner '
        'already tracks, in a form they already recognise. For customers, the familiar '
        'interaction pattern and the visible stock position lower the barrier to a first '
        'purchase.')

    # ---------- 3.3 Process model -----------------------------------------
    r.h2('3.3  Software Engineering Paradigm Applied')
    r.p('The **incremental process model** was adopted. The requirements were understood well '
        'enough at the outset to be specified, which rules out a purely exploratory approach, '
        'but a single waterfall pass would have deferred all testing to the end — a poor fit '
        'for a solo project with a fixed submission date, because any serious defect found '
        'late would leave no time to correct it.')
    r.p('Under the incremental model the system was delivered as a sequence of working '
        'increments, each one analysed, designed, coded and tested before the next began:')

    r.table(
        ['Increment', 'Scope delivered', 'Verified by'],
        [['I — Foundation', 'Project skeleton, environment configuration, database connection, '
                            'central error handling, User model.',
          'Application starts; TC-U-37 to TC-U-42.'],
         ['II — Identity', 'Registration, sign-in, JWT issue and verification, role-based '
                           'route protection, profile and password change.',
          'TC-I-01 to TC-I-16.'],
         ['III — Catalogue', 'Category and Product models with indexes, listing with search, '
                             'filter, sort and pagination, product detail, administrator CRUD.',
          'TC-U-14 to TC-U-24; TC-I-17 to TC-I-35.'],
         ['IV — Cart and checkout', 'Cart context, server-side re-pricing, atomic stock '
                                    'reservation, simulated payment, order persistence, '
                                    'invoice generation.',
          'TC-U-25 to TC-U-36; TC-I-36 to TC-I-45.'],
         ['V — Fulfilment', 'Order history, order detail, cancellation, administrator status '
                            'progression governed by the state machine.',
          'TC-I-46 to TC-I-55.'],
         ['VI — Administration', 'Dashboard aggregations, customer administration, low-stock '
                                 'alerts.', 'TC-I-56 to TC-I-65.'],
         ['VII — Hardening', 'System testing of complete journeys, defect correction, '
                             'documentation.', 'TC-S-01 to TC-S-05.']],
        caption='Increments delivered, in order',
        widths=[0.9, 2.2, 1.2], font_size=8.5)

    r.p('The choice paid for itself in Increment VI. The defect described in Section 8.6.1 — '
        'the dashboard reporting its fourteen-day sales window one day out and silently '
        'excluding the current day — was found because the increment was tested as soon as it '
        'was built, while the reasoning behind the date arithmetic was still fresh. Under a '
        'waterfall schedule the same defect would have surfaced during final testing, if at '
        'all, since the symptom is a subtly wrong chart rather than a visible failure.')

    # ---------- 3.4 Planning -----------------------------------------------
    r.h2('3.4  Project Planning and Scheduling')
    r.p('The work was planned over nineteen weeks, undertaken part-time alongside the '
        'remaining coursework of the semester. ' + r.ref_figure('Project schedule showing the nineteen-week') +
        ' shows the schedule. Testing overlaps '
        'implementation deliberately, in keeping with the incremental model: each increment '
        'was tested as it was completed rather than at the end of the project.')

    r.figure('fig-3-1-gantt.png',
             'Project schedule showing the nineteen-week plan, with testing overlapping implementation',
             width_inches=6.2)

    r.h3('3.4.1  Effort estimation')
    r.p('An estimate was prepared using the Basic COCOMO model for an organic project, which '
        'is the appropriate mode for a small team working on a familiar problem in a stable '
        'environment. The model gives effort as E = a × (KLOC)^b person-months, with '
        'a = 2.4 and b = 1.05 for organic projects, and duration as D = c × E^d months with '
        'c = 2.5 and d = 0.38.')

    r.table(
        ['Quantity', 'Value', 'Basis'],
        [['Delivered source lines (server/src and client/src, excluding blank and '
          'comment-only lines)',
          '5,530', 'Measured from the final code base'],
         ['KLOC', '5.53', ''],
         ['Effort, E = 2.4 × 5.53^1.05', '**≈ 14.5 person-months**',
          'Basic COCOMO, organic mode'],
         ['Duration, D = 2.5 × 14.5^0.38', '**≈ 6.9 months**', 'Basic COCOMO, organic mode'],
         ['Implied average staffing, E ÷ D', '≈ 2.1 persons', ''],
         ['Actual effort expended', 'Approximately 4.5 person-months', 'One student, part-time '
                                                                       'over nineteen weeks']],
        caption='Basic COCOMO estimate compared with the effort actually expended',
        widths=[1.9, 1.2, 1.5], font_size=8.5)

    r.p('The actual effort is well below the COCOMO figure, and it is worth being honest about '
        'why rather than presenting the gap as an achievement. COCOMO was calibrated against '
        'industrial projects that carry costs this one does not: requirements negotiation with '
        'a real client, formal review gates, integration with existing systems, user '
        'acceptance testing, deployment and handover documentation. It also assumes a team, '
        'and therefore the communication overhead a team incurs. A single developer working to '
        'a specification they wrote themselves avoids nearly all of that. The estimate is '
        'included because the BCSP-064 guidelines call for cost estimation, and because the '
        'gap is itself instructive: it shows how much of the cost of industrial software lies '
        'outside the act of writing code.')

    # ---------- 3.5 SRS -----------------------------------------------------
    r.h2('3.5  Software Requirements Specification')

    r.h3('3.5.1  User classes')
    r.table(
        ['User class', 'Characteristics', 'Privileges'],
        [['Visitor (unauthenticated)',
          'Any person with a browser; no account; may be evaluating the store before '
          'registering.',
          'Browse and search the catalogue, view product detail, build a cart. Cannot check '
          'out, and cannot see any order.'],
         ['Customer (authenticated)',
          'Registered account holder; general computer literacy assumed, no technical '
          'knowledge required.',
          'Everything a visitor may do, plus checkout, order history, order detail for their '
          'own orders only, order cancellation before despatch, and profile maintenance.'],
         ['Store administrator',
          'Store owner or an employee acting for them; comfortable with forms and tables but '
          'not with databases.',
          'Catalogue and category maintenance, stock adjustment, view and progress any order, '
          'customer account activation, and the analytics dashboard.']],
        caption='User classes and their privileges',
        widths=[1.0, 1.7, 1.8], font_size=8.5)

    r.h3('3.5.2  Functional requirements')
    r.p('Each requirement below is identified so that it can be traced to the test cases in '
        'Chapter 8.')

    r.table(
        ['ID', 'Requirement', 'Priority'],
        [['FR-01', 'The system shall allow a visitor to register with a name, a unique email '
                   'address and a password meeting the stated policy.', 'High'],
         ['FR-02', 'The system shall reject a registration whose email address is already in '
                   'use, irrespective of letter case.', 'High'],
         ['FR-03', 'The system shall authenticate a registered user and issue a signed access '
                   'token valid for seven days.', 'High'],
         ['FR-04', 'The system shall return an identical response for an unknown email address '
                   'and an incorrect password, so that registered addresses cannot be '
                   'enumerated.', 'High'],
         ['FR-05', 'The system shall allow a signed-in user to change their own password after '
                   'confirming the current one.', 'Medium'],
         ['FR-06', 'The system shall allow a signed-in user to maintain their name and a '
                   'default delivery address.', 'Medium'],
         ['FR-07', 'The system shall present a paginated catalogue of active products.', 'High'],
         ['FR-08', 'The system shall support full-text keyword search over product title, '
                   'brand and description, ranked by relevance.', 'High'],
         ['FR-09', 'The system shall support filtering by category, by price band and by stock '
                   'availability, in any combination.', 'High'],
         ['FR-10', 'The system shall support ordering results by recency, price ascending, '
                   'price descending, customer rating and name.', 'Medium'],
         ['FR-11', 'The system shall present full product detail including live stock position '
                   'and any discount against the maximum retail price.', 'High'],
         ['FR-12', 'The system shall suggest up to four related in-stock products from the same '
                   'category.', 'Low'],
         ['FR-13', 'The system shall maintain a shopping cart that survives a page reload.', 'High'],
         ['FR-14', 'The system shall cap the quantity per product and the number of distinct '
                   'products in a cart, and shall enforce both caps on the server.', 'Medium'],
         ['FR-15', 'The system shall recompute the item subtotal, delivery charge, tax and '
                   'payable total on the server from stored prices before accepting an order.',
          'High'],
         ['FR-16', 'The system shall decrement stock atomically and shall not permit an order '
                   'that would take stock below zero.', 'High'],
         ['FR-17', 'The system shall validate card details, simulate an authorisation, and '
                   'persist no card number or CVV.', 'High'],
         ['FR-18', 'The system shall return reserved stock to the catalogue if payment '
                   'authorisation fails.', 'High'],
         ['FR-19', 'The system shall offer cash on delivery as an alternative to card payment.',
          'Medium'],
         ['FR-20', 'The system shall generate a unique, non-sequential invoice number for '
                   'every order.', 'High'],
         ['FR-21', 'The system shall present a customer with their own order history and order '
                   'detail, and shall deny access to any other customer’s order.', 'High'],
         ['FR-22', 'The system shall permit a customer to cancel an order that has not yet '
                   'been despatched, returning the stock to the catalogue.', 'Medium'],
         ['FR-23', 'The system shall restrict order status changes to the transitions defined '
                   'by the order state machine.', 'High'],
         ['FR-24', 'The system shall allow an administrator to create, amend and withdraw '
                   'products and categories.', 'High'],
         ['FR-25', 'The system shall prevent deletion of a category that still contains active '
                   'products.', 'Medium'],
         ['FR-26', 'The system shall present an administrator with total revenue, order count, '
                   'units sold, average order value, a fourteen-day revenue series, '
                   'best-selling products and low-stock alerts.', 'High'],
         ['FR-27', 'The system shall allow an administrator to activate or deactivate a '
                   'customer account, with immediate effect on that account’s existing '
                   'sessions.', 'Medium'],
         ['FR-28', 'The system shall prevent an administrator from deactivating their own '
                   'account.', 'Low']],
        caption='Functional requirements',
        widths=[0.4, 3.4, 0.55], font_size=8.5)

    r.h3('3.5.3  Non-functional requirements')
    r.table(
        ['ID', 'Category', 'Requirement'],
        [['NFR-01', 'Performance', 'A catalogue listing request shall be served in under 200 ms '
                                   'on the reference hardware for a catalogue of up to 10,000 '
                                   'products, achieved by serving every filter from an index '
                                   'rather than a collection scan.'],
         ['NFR-02', 'Performance', 'The page size returned by the catalogue endpoint shall be '
                                   'capped server-side, so that a request for an unbounded '
                                   'page cannot be used to exhaust server memory.'],
         ['NFR-03', 'Security', 'Passwords shall be stored only as bcrypt hashes with a work '
                                'factor of not less than 12, and shall never appear in an API '
                                'response or a log.'],
         ['NFR-04', 'Security', 'All protected endpoints shall verify the caller’s token '
                                'and re-read the account from the database on every request.'],
         ['NFR-05', 'Security', 'The system shall neutralise MongoDB operator injection in the '
                                'request body, query string and route parameters.'],
         ['NFR-06', 'Security', 'Authentication endpoints shall be rate limited to ten failed '
                                'attempts per address per fifteen minutes.'],
         ['NFR-07', 'Security', 'Card numbers and CVVs shall not be written to the database or '
                                'to any log; only the last four digits shall be retained.'],
         ['NFR-08', 'Reliability', 'A failed checkout shall leave stock exactly as it was '
                                   'before the attempt.'],
         ['NFR-09', 'Reliability', 'Order records shall retain the price at which each item was '
                                   'sold, so that a later catalogue price change cannot alter '
                                   'a historical invoice.'],
         ['NFR-10', 'Usability', 'The interface shall be usable without horizontal scrolling at '
                                 'viewport widths from 360 px upwards.'],
         ['NFR-11', 'Usability', 'Every validation failure shall be reported with a message '
                                 'naming the field concerned, and all failures in one '
                                 'submission shall be reported together.'],
         ['NFR-12', 'Accessibility', 'Interactive controls shall be reachable and operable by '
                                     'keyboard, with a visible focus indicator, and the '
                                     'interface shall honour a reduced-motion preference.'],
         ['NFR-13', 'Maintainability', 'Business logic shall reside in service modules that can '
                                       'be unit tested without an HTTP layer.'],
         ['NFR-14', 'Maintainability', 'Automated test coverage of the server source shall not '
                                       'fall below 80% of statements.'],
         ['NFR-15', 'Portability', 'The system shall run unchanged on Windows, macOS and Linux '
                                   'with Node.js 18 or later and MongoDB 6 or later.']],
        caption='Non-functional requirements',
        widths=[0.5, 0.8, 3.0], font_size=8.5)

    r.h3('3.5.4  Assumptions and dependencies')
    r.bullets([
        'A single store with a single administrative role; the system is not a marketplace.',
        'Delivery addresses are Indian: pincodes are validated as exactly six digits and '
        'mobile numbers as ten digits beginning 6 to 9.',
        'Monetary amounts are whole rupees. Storing money in whole units avoids the '
        'accumulation of binary floating-point error across order arithmetic; the consequence '
        'is that prices cannot carry paise.',
        'A single flat rate of 18% is applied as tax. A production deployment would hold an '
        'HSN-wise rate against each product; the rate is isolated in one constant so that '
        'change is contained.',
        'The deployment is behind TLS. The application sets transport security headers but '
        'terminates TLS at the hosting layer, not in application code.',
        'The browser supports ES2020, CSS Grid and the Fetch API — met by all current versions '
        'of Chrome, Firefox, Safari and Edge.',
    ])

    # ---------- 3.6 Hardware and software -----------------------------------
    r.h2('3.6  Hardware and Software Requirements')

    r.h3('3.6.1  Development environment')
    r.table(
        ['Component', 'Specification used', 'Minimum recommended'],
        [['Processor', 'Apple M-series / Intel Core i5 equivalent', 'Dual-core, 2.0 GHz'],
         ['Memory', '8 GB', '4 GB'],
         ['Disk', '10 GB free (source, dependencies, database files)', '5 GB free'],
         ['Operating system', 'macOS 15 (Darwin 25.6)', 'Windows 10, macOS 12 or Ubuntu 20.04'],
         ['Runtime', 'Node.js 22.23.1, npm 10.9.8', 'Node.js 18 LTS'],
         ['Database', 'MongoDB Community Server 7 (standalone)', 'MongoDB 6'],
         ['Editor', 'Visual Studio Code', 'Any editor with JavaScript support'],
         ['API testing', 'Postman, curl', 'Either'],
         ['Version control', 'Git', 'Git'],
         ['Browser', 'Chrome / Safari with developer tools', 'Any modern browser']],
        caption='Development environment',
        widths=[1.1, 2.0, 1.4], font_size=8.5)

    r.h3('3.6.2  Deployment environment (server side)')
    r.table(
        ['Component', 'Requirement'],
        [['Processor', 'One virtual CPU is sufficient at the scale addressed'],
         ['Memory', '1 GB for the Node.js process; 2 GB if MongoDB runs on the same host'],
         ['Disk', '10 GB, growing with catalogue images and order history'],
         ['Operating system', 'Any Linux distribution with a supported Node.js build'],
         ['Runtime', 'Node.js 18 LTS or later'],
         ['Database', 'MongoDB 6 or later; a replica set is recommended so that the checkout '
                      'engine can use real multi-document transactions'],
         ['Network', 'A public IP address or a reverse proxy, with TLS terminated at the proxy'],
         ['Process management', 'A supervisor such as pm2 or a systemd unit, so the service '
                                'restarts after a failure']],
        caption='Server-side deployment requirements',
        widths=[1.1, 3.2], font_size=8.5)

    r.h3('3.6.3  Client environment')
    r.table(
        ['Component', 'Requirement'],
        [['Device', 'Desktop, laptop, tablet or smartphone'],
         ['Browser', 'Chrome 90+, Firefox 88+, Safari 14+ or Edge 90+'],
         ['JavaScript', 'Required — the application is a client-rendered single-page '
                        'application'],
         ['Local storage', 'Required for the access token and the cart to survive a page '
                           'reload; the application degrades to a per-session cart if storage '
                           'is unavailable'],
         ['Screen width', '360 px or wider'],
         ['Connection', 'Any; the initial bundle is approximately 200 KB compressed']],
        caption='Client-side requirements',
        widths=[1.1, 3.2], font_size=8.5)
