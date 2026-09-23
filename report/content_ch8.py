"""Chapter 8: Testing."""
import json
import pathlib
import re

EV = pathlib.Path.home() / 'Desktop/ignou-bca-project/report/evidence'


def load_cases():
    cases = json.loads((EV / 'testcases.json').read_text())
    for c in cases:
        # Tidy the sentence that jest printed into a test-case description.
        name = c['name'].strip()
        c['desc'] = name[0].upper() + name[1:]
    return cases


def coverage_rows():
    rows = []
    text = (EV / 'test-coverage.txt').read_text()
    for line in text.split('\n'):
        m = re.match(r'^\s*(\S[\w./-]*)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|', line)
        if m and m.group(1) not in ('File',):
            rows.append([m.group(1), m.group(2), m.group(3), m.group(4), m.group(5)])
    return rows


def build(r):
    cases = load_cases()
    unit = [c for c in cases if c['id'].startswith('TC-U')]
    integ = [c for c in cases if c['id'].startswith('TC-I')]

    r.h1('8.  TESTING')

    r.h2('8.1  Testing Strategy')
    r.p('Testing was carried out at three levels, in the sequence the incremental process '
        'model implies: each increment was unit tested as it was written, integration tested '
        'once its endpoints existed, and finally exercised as part of a whole user journey in '
        'system testing. A total of **127 automated test cases** were written, all of which '
        'pass. They run in approximately 31 seconds and can be re-executed at any time with '
        '`npm test`.')

    r.table(
        ['Level', 'What is under test', 'What is stubbed', 'Cases'],
        [['Unit', 'A single function or schema in isolation — the Luhn validator, the '
                  'query-string parser, the cart normaliser, the calendar helpers, the '
                  'Mongoose schemas and their hooks.',
          'Nothing is mocked. The tests that touch the database use a real MongoDB instance; '
          'the rest are pure functions and need nothing.', '55'],
         ['Integration', 'A complete request path — router, validation chain, middleware, '
                         'controller, service, model and database — driven over real HTTP by '
                         'Supertest.',
          'Nothing. The Express application is mounted in-process against an in-memory '
          'MongoDB server.', '67'],
         ['System', 'Whole user journeys performed in the order a real visitor performs them, '
                    'each step using only data returned by the previous step.',
          'Nothing.', '5']],
        caption='The three levels of testing',
        widths=[0.6, 1.9, 1.5, 0.35], font_size=8.5)

    r.h3('8.1.1  The test environment')
    r.p('All three levels run against `mongodb-memory-server`, which downloads and starts a '
        'genuine MongoDB binary on a random port with its data files in a temporary directory. '
        'This choice is worth explaining, because mocking the database driver would have been '
        'faster to set up.')
    r.p('A mocked driver tests only that the application called the functions the author '
        'expected it to call. It cannot tell you whether a unique index actually rejects a '
        'duplicate, whether a text index actually ranks a title match above a description '
        'match, or whether a conditional atomic update actually serialises two concurrent '
        'writers. Those are precisely the behaviours this system depends on, and all three are '
        'asserted directly — by TC-U-40, TC-I-18 and TC-U-36 respectively. A mock would have '
        'passed all three while the real system failed.')
    r.p('Every collection is emptied between test cases, so each case starts from a known '
        'state and the order in which cases run cannot affect the outcome. Indexes are built '
        'once before the suite begins; without that step the first unique-constraint test '
        'would pass merely because the index did not yet exist. Every case in '
        + r.ref_table('Unit test cases (all 55') + ' and '
        + r.ref_table('Integration test cases (all 67') +
        ' passes; the run summary is given in Section 8.5.')

    # ---------------- 8.2 Unit tests ---------------------------------------
    r.h2('8.2  Unit Test Case Design and Results')
    r.p('Unit tests concentrate on the pure logic where a defect is cheapest to find and most '
        'expensive to miss. ' + r.ref_table('Unit test cases (all 55') +
        ' gives the design of every unit test case and its outcome.')

    rows = [[c['id'], c['desc']] for c in unit]
    r.table(['Case ID', 'Test case design and expected behaviour'], rows,
            caption='Unit test cases (all 55 cases pass — see Section 8.5 for the run summary)',
            widths=[0.5, 3.8], font_size=8.0)

    r.h3('8.2.1  Unit test highlights')
    r.p('Three unit cases deserve particular mention, because each tests a property that would '
        'be difficult to establish any other way.')
    r.p('**TC-U-36 — no overselling under concurrency.** The test creates a product with one '
        'unit in stock, then fires ten simultaneous reservation attempts and awaits them all. '
        'It asserts that exactly one succeeded, nine were rejected, and the final stock count '
        'is zero. This is the only practical way to demonstrate that the conditional atomic '
        'update closes the race window; no amount of sequential testing would reveal a defect '
        'here.')
    r.p('**TC-U-09 — no card data is retained.** The test authorises a payment and then '
        'asserts not only that the returned object carries the correct last four digits, but '
        'that the full card number and the CVV appear nowhere in the serialised result. '
        'Asserting the absence of data is unusual but is exactly the right shape of assertion '
        'for a confidentiality requirement.')
    r.p('**TC-U-54 — the current day is inside the reporting window.** This case was written '
        'in response to the defect described in Section 8.6.1. It fixes the clock at 23:00 '
        'Indian Standard Time — at which moment the UTC date is still the previous day — and '
        'asserts that the fourteen-day window nonetheless ends on the local date. The original '
        'implementation failed this assertion.')

    # ---------------- 8.3 Integration tests --------------------------------
    r.h2('8.3  Integration Test Case Design and Results')
    r.p('Integration tests exercise complete request paths over real HTTP. Nothing is stubbed: '
        'a request passes through the same routers, validators, middleware, controllers, '
        'services and models that serve a production request, and reaches a real database.')

    rows = [[c['id'], c['desc']] for c in integ]
    r.table(['Case ID', 'Test case design and expected behaviour'], rows,
            caption='Integration test cases (all 67 cases pass — see Section 8.5 for the run '
                    'summary)',
            widths=[0.5, 3.8], font_size=8.0)

    r.h3('8.3.1  Integration test highlights')
    r.p('**TC-I-38 — client-supplied prices are ignored.** The test posts an order in which '
        'the client has set `unitPrice` to 1 and `totalPrice` to 1 for goods worth ₹2,000. The '
        'order is accepted — those fields are simply not read — and the stored order shows an '
        'item total of ₹2,000 and a payable total of ₹2,360. This is the single most important '
        'commercial assertion in the suite.')
    r.p('**TC-I-40 — a declined payment leaves no trace.** Stock is captured before the '
        'attempt, a card that the simulated gateway declines is submitted, and the test '
        'asserts that the response is a 422, that the stock count is exactly what it was '
        'before, and that no order document exists. This proves the compensating action in '
        'Section 6.3.2 actually runs.')
    r.p('**TC-I-47 — a customer cannot read another customer’s order.** A second account '
        'requests an order belonging to the first and receives 404, not 403. Returning 403 '
        'would confirm that the identifier corresponds to a real order, which is itself an '
        'information disclosure.')
    r.p('**TC-I-62 — deactivation takes effect immediately.** The test establishes that a '
        'customer’s token works, has an administrator deactivate the account, and then '
        'asserts that the same token — still cryptographically valid and unexpired — is '
        'refused on the very next request. This is the evidence for the design decision '
        'defended in Section 4.6.3.')

    # ---------------- 8.4 System tests --------------------------------------
    r.h2('8.4  System Test Case Design and Results')
    r.p('System tests ask a different question from integration tests. Where an integration '
        'test asks "does this endpoint behave correctly?", a system test asks "can a person '
        'actually complete this task from beginning to end?" Each step uses only data returned '
        'by the previous step, so a break anywhere in the chain fails the case.')

    r.table(
        ['Case ID', 'Journey', 'Steps exercised', 'Result'],
        [['TC-S-01', 'Registration through to delivery',
          'Administrator creates a category and a product → visitor registers → searches the '
          'catalogue by keyword → opens the product page → requests a price quote → checks out '
          'with a card → stock falls by exactly the quantity bought → the order appears in the '
          'customer’s history → the administrator ships and delivers it → the sale is '
          'reflected in the dashboard totals.', 'Pass'],
         ['TC-S-02', 'Browse, filter and narrow a catalogue',
          'Category counts are correct → filter by category returns 3 of 4 → adding an '
          'in-stock filter returns 2 → adding a price floor returns exactly 1, and it is the '
          'expected product.', 'Pass'],
         ['TC-S-03', 'Cancel an order and buy again',
          'One unit in stock → first buyer takes it → second buyer is correctly refused with '
          '409 → first buyer cancels → second buyer now succeeds → final stock is zero → '
          'dashboard counts one sale, not two.', 'Pass'],
         ['TC-S-04', 'Administrator catalogue lifecycle',
          'Create a category and confirm its slug → create a product with zero stock → confirm '
          'it is hidden from an in-stock listing → restock it → confirm it appears → withdraw '
          'it → delete the now-empty category.', 'Pass'],
         ['TC-S-05', 'Session lifecycle across a password change',
          'Register → change password → old password is refused → new password works → the '
          'freshly issued token can complete a purchase.', 'Pass']],
        caption='System test cases and results (5 journeys, all passing)',
        widths=[0.5, 1.0, 2.5, 0.35], font_size=8.5)

    # ---------------- 8.5 Summary and coverage ------------------------------
    r.h2('8.5  Test Summary and Coverage')

    r.table(
        ['Level', 'Suites', 'Cases', 'Passed', 'Failed'],
        [['Unit', '5', '55', '55', '0'],
         ['Integration', '4', '67', '67', '0'],
         ['System', '1', '5', '5', '0'],
         ['**Total**', '**10**', '**127**', '**127**', '**0**']],
        caption='Test execution summary',
        widths=[1.2, 0.6, 0.6, 0.6, 0.6], font_size=8.5)

    r.p('Statement coverage of the server source is **86.2%**, with 88.4% of lines and 86.0% '
        'of functions covered. The non-functional requirement NFR-14 set a floor of 80% of '
        'statements, which is met. ' + r.ref_table('Code coverage by area') +
        ' gives the breakdown by directory.')

    rows = coverage_rows()
    keep = [row for row in rows
            if row[0] in ('All files', 'config', 'controllers', 'middleware', 'models',
                          'routes', 'services', 'utils')
            or row[0].startswith('src/')]
    display = []
    for row in keep:
        name = row[0].replace('src/', '')
        display.append([f'**{name}**' if name == 'All files' else name,
                        row[1], row[2], row[3], row[4]])
    r.table(['Area', '% Statements', '% Branches', '% Functions', '% Lines'],
            display,
            caption='Code coverage by area (server source)',
            widths=[1.4, 0.75, 0.75, 0.75, 0.75], font_size=8.5)

    r.p('The lower branch coverage figure is expected and worth explaining rather than hiding. '
        'A large share of the uncovered branches lie in the central error handler, which '
        'contains a translation arm for every class of database and driver fault the '
        'application might encounter. Several of those faults — a connection loss mid-write, '
        'for instance — cannot be provoked from a test without elaborate fault injection. The '
        'arms that can be provoked are tested; the remainder are simple, single-expression '
        'translations whose risk is low.')

    # ---------------- 8.6 Debugging -----------------------------------------
    r.h2('8.6  Debugging and Code Improvement')
    r.p('Four defects found during development are recorded here, with the symptom, the '
        'diagnosis, the correction and the regression test added to prevent recurrence. They '
        'are included because an honest account of what went wrong is more useful than a '
        'claim that nothing did.')

    r.h3('8.6.1  Defect D-01 — the dashboard reported its sales window one day out')
    r.table(
        ['Aspect', 'Detail'],
        [['Severity', 'Medium — silently wrong analytics, no visible failure'],
         ['Symptom', 'The fourteen-day revenue chart was labelled 09 September to 22 September '
                     'when the correct local window was 10 September to 23 September. Orders '
                     'placed on the current day did not appear on the chart at all.'],
         ['How it was found', 'By reading the rendered chart against the seeded data during '
                              'Increment VI, not by a failing test. No test existed for the '
                              'window boundaries.'],
         ['Diagnosis', 'The controller built its day keys with '
                       '`date.toISOString().slice(0, 10)`. `toISOString` converts to UTC first. '
                       'For a store in Asia/Kolkata (UTC+5:30), local midnight is 18:30 UTC on '
                       'the **previous** day, so every key came out one day early. Separately, '
                       'the MongoDB `$dateToString` grouping used its default UTC timezone, so '
                       'the two sides of the join were computed against different notions of '
                       '"day".'],
         ['Correction', 'A new module `utils/calendar.js` resolves calendar days in the '
                        "store’s own timezone using `Intl.DateTimeFormat` with the "
                        '`en-CA` locale, whose short date format is already ISO-ordered. The '
                        'same timezone is now passed to `$dateToString`, so the keys generated '
                        'in JavaScript and the buckets produced by MongoDB always agree. The '
                        'zone is configurable through `STORE_TIMEZONE`, defaulting to '
                        'Asia/Kolkata.'],
         ['Client-side correction', 'The dashboard was also parsing the returned '
                                    '`YYYY-MM-DD` string with `new Date()`, which treats it as '
                                    'UTC midnight and would therefore render the previous day '
                                    'for any viewer west of Greenwich. It now splits the parts '
                                    'and constructs a local date.'],
         ['Regression tests added', 'TC-U-49 to TC-U-55 for the calendar helpers, including '
                                    'TC-U-54 which fixes the clock at 23:00 IST and asserts '
                                    'the window still ends on the local date; and TC-I-64 and '
                                    'TC-I-65, the latter asserting that an order placed today '
                                    'lands in the final bucket. TC-I-65 fails against the '
                                    'original implementation.']],
        caption='Defect D-01 — timezone-dependent date bucketing',
        widths=[0.9, 3.4], font_size=8.5)

    r.p('This defect is the most instructive of the four. It produced no error, no warning and '
        'no failing request; the chart simply showed slightly the wrong thing, and only a '
        'reader who knew what the data should look like would notice. It is also a defect that '
        'would never appear for a developer working in UTC, which is a reminder that a test '
        'suite passing on one machine says nothing about its behaviour on another unless the '
        'environmental assumption is itself tested. TC-U-49 to TC-U-55 now pin that assumption '
        'down explicitly.')

    r.h3('8.6.2  Defect D-02 — a test card that could never reach the code path it tested')
    r.table(
        ['Aspect', 'Detail'],
        [['Severity', 'Low — a defect in the test suite, not in the product'],
         ['Symptom', 'TC-U-12, which asserts that a card ending in 0000 is declined by the '
                     'simulated issuer, failed with the message "The card details could not be '
                     'accepted" instead of "declined by the issuing bank".'],
         ['Diagnosis', 'The test used the card number 4111111111110000, which does not satisfy '
                       'the Luhn checksum. The payment service validates structure before it '
                       'evaluates the decline rule, so the card was rejected as malformed and '
                       'the decline path was never reached. The test would have passed against '
                       'an implementation with no Luhn check at all, which is the opposite of '
                       'what it was written to verify.'],
         ['Correction', 'A Luhn-valid number ending in 0000 was computed — 4111111111090000 — '
                        'and substituted in both the unit test and the shared fixtures.'],
         ['Lesson recorded', 'A test that fails for the wrong reason is only marginally better '
                             'than no test. The failure message is worth reading, not just the '
                             'red mark.']],
        caption='Defect D-02 — an invalid test fixture',
        widths=[0.9, 3.4], font_size=8.5)

    r.h3('8.6.3  Defect D-03 — the product form rejected the catalogue’s own images')
    r.table(
        ['Aspect', 'Detail'],
        [['Severity', 'Medium — an administrator could not save an edit to any seeded product'],
         ['Symptom', 'Opening any seeded product in the administration form and saving it '
                     'without changes returned 422, reporting that the image URL must be a '
                     'fully qualified address.'],
         ['Diagnosis', 'The route validated `imageUrl` with `isURL({require_protocol: true})`. '
                       'When the catalogue was moved from a remote image host to locally '
                       'bundled illustrations, the seeded values became root-relative paths of '
                       'the form `/products/kettle.svg`, which that rule rejects. The seed '
                       'script writes directly through the model and so bypassed the route '
                       'validation, which is why the inconsistency was not visible until an '
                       'administrator tried to edit a product.'],
         ['Correction', 'The rule now accepts either a fully qualified http(s) address or a '
                        'root-relative path, and continues to reject anything else — a bare '
                        'string, or a `javascript:` URL that would otherwise end up in an '
                        '`<img src>`.'],
         ['Regression tests added', 'TC-I-36a asserts that a bundled path is accepted; '
                                    'TC-I-36b asserts that `javascript:alert(1)` is rejected '
                                    'with a field-level error.']],
        caption='Defect D-03 — over-strict image validation',
        widths=[0.9, 3.4], font_size=8.5)

    r.h3('8.6.4  Defect D-04 — a misleading test name')
    r.p('A test case named "returns 400 for a malformed identifier" in fact asserted a 422, '
        'and passed. Both codes are defensible for a malformed path parameter — it can be read '
        'as a malformed request or as a semantically invalid value. The route-level validator '
        'runs first and returns 422 consistently with every other validation failure in the '
        'API; only a parameter that bypasses that validator reaches the cast-error handler and '
        'produces a 400. The implementation was correct and internally consistent; the test '
        'name was not. The name was corrected and the behaviour left unchanged, because '
        'consistency with the rest of the API is worth more than a finer distinction between '
        'two acceptable codes. Severity: very low, affecting only the documentation.')

    r.h3('8.6.5  Code improvements arising from testing')
    r.bullets([
        '**Business rules were consolidated into named constants.** Writing the pricing tests '
        'made it obvious that the free-shipping threshold, the shipping fee and the tax rate '
        'appeared as literals in more than one place. They now live in a single frozen '
        '`PRICING_RULES` object that the tests import, so a rule change cannot leave the tests '
        'asserting the old figure.',
        '**The cart normaliser began merging duplicate lines.** An early test posted the same '
        'product twice with a quantity of six on each line. Each line individually satisfied '
        'the cap of ten, so twelve units were accepted. The normaliser now merges lines for '
        'the same product before applying the cap, and TC-U-29 pins the behaviour down.',
        '**Product updates moved to an explicit field whitelist.** Writing TC-I-33 exposed '
        'that a partial update assigned from the request body wholesale, which would have let '
        'an administrator write `rating` and `ratingCount` directly. Only the fields intended '
        'to be client-writable are now copied.',
        '**The transaction-capability probe was added.** The first implementation of the '
        'checkout opened a MongoDB session unconditionally, which fails on a standalone '
        '`mongod`. Rather than dropping transactions entirely, the service now detects whether '
        'the deployment supports them and chooses its strategy accordingly, so a production '
        'replica set gets real transactions while development still works.',
    ])
