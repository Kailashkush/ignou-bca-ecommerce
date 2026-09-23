# BCA Project (BCSP-064) — E-Commerce Web Application

**Student:** Kailash Kumar Jha · **Enrolment No.:** 2400767095
**Title:** *Development of an E-Commerce Web Application for Online Shopping*
**Guide:** Shankar Jha, Backend Lead, Wizcart Technologies LLC

> The project title must be **identical** on the proposal proforma, the synopsis and
> the report. Per Section VI.7 of the guidelines, a report whose title differs from
> the approved proposal is rejected and returned. Do not reword it.

---

## 1. What is in this directory

```
ignou-bca-project/
├── ecommerce-app/          The working application (the deliverable software)
│   ├── server/             Node.js + Express + MongoDB REST API
│   └── client/             React 18 single-page application
├── report/                 The project report and everything that builds it
│   ├── BCA_Project_BCSP064_Kailash_Kumar_Jha_PRINT_READY.pdf  ← PRINT THIS
│   ├── BCA_Project_Report_BCSP064_Kailash_Kumar_Jha.docx      ← editable copy
│   ├── diagrams/           9 diagrams as editable SVG + rendered PNG
│   ├── screenshots/        28 screen captures from the running application
│   ├── evidence/           Raw test-run and coverage output
│   └── *.py                The generator (edit these, then rebuild)
├── synopsis/
│   └── BCA_Project_Synopsis_BCSP064_Kailash_Kumar_Jha.docx ← THE SYNOPSIS
└── forms/
    └── BCSP064_Submission_Forms_Signature_Pages.docx       ← SIGNATURE PAGES
```

---

## 2. Running the application

### Prerequisites
* Node.js 18 LTS or later (developed on 22.23)
* MongoDB 6 or later, running locally (developed on MongoDB 7 Community Server)

### Start MongoDB
```bash
# macOS (Homebrew)
brew services start mongodb-community
# or run it directly
mongod --dbpath /path/to/data --port 27017
```

### Start the API
```bash
cd ecommerce-app/server
npm install
cp .env.example .env          # then set JWT_SECRET to a long random string
npm run seed                  # loads 6 categories, 34 products, 6 users, 40 orders
npm run dev                   # http://localhost:5000
```

Generate a strong secret with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Start the client
```bash
cd ecommerce-app/client
npm install
npm run dev                   # http://localhost:5173
```

### Demonstration accounts (created by `npm run seed`)

| Role          | Email                     | Password        |
|---------------|---------------------------|-----------------|
| Administrator | `admin@shopsphere.test`   | `Admin@12345`   |
| Customer      | `ananya@example.com`      | `Customer@123`  |
| Customer      | `rohit@example.com`       | `Customer@123`  |

### Test cards for the simulated gateway

| Card number           | Behaviour                                |
|-----------------------|------------------------------------------|
| `4539 5787 6362 1486` | Authorised                               |
| `4111 1111 1109 0000` | Declined by the "issuing bank"           |
| any number ending `0000` | Declined (as long as it passes Luhn)  |

No real payment is taken and no card number is stored. See Section 10.6 of the report.

---

## 3. Running the tests

```bash
cd ecommerce-app/server
npm test                  # all 127 cases (~31 s)
npm run test:unit         # 55 unit cases
npm run test:integration  # 67 integration cases
npm run test:system       # 5 system journeys
npm run test:coverage     # with a coverage report
```

The suite starts its own in-memory MongoDB instance, so it never touches your
development database and needs no setup beyond `npm install`.

---

## 4. Rebuilding the documents

The `.docx` files are generated, not hand-edited. To change wording, edit the
Python content modules and rebuild — this keeps the report, the synopsis and the
forms consistent with each other.

```bash
pip3 install python-docx pypdf reportlab pymupdf pillow

cd report    && python3 build_print.py      # the print-ready PDF  <- for printing
cd report    && python3 build_report.py     # the editable .docx
cd synopsis  && python3 build_synopsis.py   # the standalone synopsis
cd forms     && python3 build_forms.py      # the signature pages
```

`build_print.py` renders the same content through Chrome instead of Word. It
runs in four stages: render the body so pagination is known, read back which
page each heading landed on, render the front matter with those real page
numbers baked into the contents page, then stamp the folios (roman for the
front matter, arabic for the body) and merge. That is why the PDF has a genuine
table of contents and an exact page count, and why it looks identical on any
machine.

Cross-references in the prose are symbolic: the source says
`r.ref_table('Complete API endpoint specification')`, not `Table 24`. Both
builders resolve them from a first pass, so inserting a table in Chapter 3 can
never leave a stale "see Table 24" in Chapter 6 — an unresolvable reference is
a build error, not a silent mistake.

Regenerating the diagrams (only needed if you change one):
```bash
cd report/diagrams
python3 gen_dfd.py && python3 gen_dfd2.py && python3 gen_er.py
python3 gen_misc.py && python3 gen_misc2.py
# then render the SVGs to PNG (requires Node + puppeteer)
```

### If you edit the .docx instead of reprinting the PDF
The Word file's table of contents is a field and is empty until Word fills it:

1. Open the `.docx` in Microsoft Word.
2. Click anywhere in the table of contents.
3. Press **F9** (macOS: **Cmd-Option-Shift-U**) → *Update entire table*.

In LibreOffice Writer: **Tools → Update → Indexes and Tables**. The PDF needs
none of this — its contents page already carries real page numbers.

### Page count — measured, not estimated

| Part | Pages | Numbering |
|---|---|---|
| Front matter (title → abbreviations) | 29 | roman, i – xxix |
| **Report body (chapters 1–14)** | **81** | arabic, 1 – 81 |
| Appendix A (source code) | 136 | arabic, 82 – 217 |
| **Total** | **246** | |

The 81-page body is what IGNOU's "about 50 to 80 pages, excluding programme
code" rule measures, and 81 is inside the permitted +10% (88). Front matter and
the appendix are excluded by the guidelines.

### Where to trim if you need a shorter body
* `report/content_ch9_13.py` — reduce the `width_inches` values in Chapter 9.
* `report/content_ch8.py` — the two per-case tables are the largest single block.
* `report/print.css` — heading spacing and table font sizes.

---

## 5. Submission checklist (BCSP-064)

### Stage 1 — Project proposal
Send to **The Regional Director, Regional Centre RCD1**, during 1 April–30 June
or 1 October–31 December:

- [ ] **Proforma of Project Proposal**, all items filled, signed **and dated** by
      both student and guide — `forms/…Signature_Pages.docx`, page 3
- [ ] **Bio-data of the guide**, signed and dated by the guide — same file, page 4
- [ ] **Project synopsis** (12–15 pages), signed by both — `synopsis/…docx` (14 pages)
- [ ] A self-addressed envelope with postage stamps affixed
- [ ] Keep a photocopy of the complete proposal for your own records

Approval is communicated within four weeks.

### Stage 2 — Project report
Send during 1 July–30 September (for proposals approved Apr–Jun) or
1 January–31 March (for proposals approved Oct–Dec):

- [ ] **One hard-bound original copy** — spiral binding is **not** permitted
      (print `report/BCA_Project_BCSP064_Kailash_Kumar_Jha_PRINT_READY.pdf`
      single-sided on A4; it already carries the 35 mm binding margin)
- [ ] Original **approved** proposal proforma bound into the report
- [ ] **Project synopsis** bound in, signed by guide and student
- [ ] **Guide's bio-data** bound in, with signature
- [ ] **Certificate of Originality** — `forms/…Signature_Pages.docx`, page 2
- [ ] Every signature accompanied by its date
- [ ] A **Contents** page, and every page numbered — both already in the report
- [ ] All printouts original, not photocopied
- [ ] **Remuneration bill**, signed by the guide, in a **separate envelope**
- [ ] Mark the envelope **"BCA PROJECT REPORT (BCSP-064)"**
- [ ] Send by **registered insured post**
- [ ] **Keep a second copy for yourself** — you must carry it to the viva

### Marks
Project report 150, viva-voce 50. A minimum of 40% is required **separately** in
each: 60/150 and 20/50.

---

## 6. How the report maps to the guidelines

Section V of the BCSP-064 guidelines lists what the report must contain. Each
required item and where it is answered:

| Required item | Where |
|---|---|
| Introduction | Chapter 1 |
| Objectives | Chapter 2 |
| Tools / Environment Used | Chapter 4 |
| Analysis Document — SRS | Section 3.5 (28 functional, 15 non-functional requirements) |
| Analysis Document — ER diagram | Section 5.4, Figure 7 |
| Analysis Document — DFDs (to level 2) | Sections 5.1–5.3, Figures 3–6 |
| Analysis Document — Data dictionary | Section 5.6 |
| Design — Modularisation | Section 6.1, Figure 8 |
| Design — Data integrity & constraints | Section 6.2.4 |
| Design — Database design | Section 6.2 |
| Design — Procedural design | Section 6.3 (3 algorithms + state machine) |
| Design — User interface design | Section 6.4 |
| Programme code (complete, indented, commented) | Appendix A — 87 files (82 source + 5 configuration), 9,187 lines |
| Testing — unit test case design + report | Sections 8.2, 8.5 |
| Testing — integration test case design + report | Sections 8.3, 8.5 |
| Testing — system test case design + report | Sections 8.4, 8.5 |
| Testing — debugging and code improvement | Section 8.6 (4 defects, with fixes and regression tests) |
| Input and Output Screens | Chapter 9 (27 captures from the running application) |
| Implementation of Security (incl. credential transmission) | Chapter 10, especially 10.4 |
| Limitations of the Project | Chapter 11 |
| Future Application of the Project | Chapter 12 |
| Bibliography | Chapter 14 (22 references) |
| Certificate of Originality | Front matter, and `forms/` |
| Contents page, all pages numbered | Front matter; footer on every page |

Section III lists what the **synopsis** must contain:

| Required item | Where in the synopsis |
|---|---|
| 1. Title of the Project | Section 1 |
| 2. Introduction and Objectives | Section 2 |
| 3. Project Category | Section 3 |
| 4. Analysis (DFDs to level 2, ER, database design) | Section 4 |
| 5. Modules and description | Section 5.1 |
| 5. Data structures | Section 5.2 |
| 5. Database design | Section 4.6 |
| 5. Process logic for each module | Section 5.3 |
| 5. Testing details | Section 5.4 |
| 5. Reports generation | Section 5.5 |
| 6. Tools / platform, hardware and software requirements | Section 6 |
| 7. Industry / client declaration | Section 7 |
| 8. Future scope and enhancement | Section 8 |

---

## 7. Notes on the technology choice

Section VII of the guidelines lists permitted tools. This project uses:

* **MongoDB** — listed under "Backend for Mobile Apps" in the permitted list
* **React** — listed under "Languages"
* **Node.js / Express / JavaScript** — internet technologies, permitted

It uses **none** of the prohibited combinations: not Visual Basic with MS-Access
as front and back end, and not C or C++ for a database project.
