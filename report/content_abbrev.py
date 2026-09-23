"""List of abbreviations — a standard front-matter section in a bound report."""

ABBREVIATIONS = [
    ('API', 'Application Programming Interface'),
    ('BCA', 'Bachelor of Computer Applications'),
    ('BSON', 'Binary JSON — the storage format used by MongoDB'),
    ('COCOMO', 'Constructive Cost Model'),
    ('COD', 'Cash on Delivery'),
    ('CORS', 'Cross-Origin Resource Sharing'),
    ('CRUD', 'Create, Read, Update, Delete'),
    ('CSS', 'Cascading Style Sheets'),
    ('CVV', 'Card Verification Value'),
    ('DFD', 'Data Flow Diagram'),
    ('DOM', 'Document Object Model'),
    ('EAV', 'Entity–Attribute–Value'),
    ('ER', 'Entity–Relationship'),
    ('GST', 'Goods and Services Tax'),
    ('HSN', 'Harmonised System of Nomenclature'),
    ('HSTS', 'HTTP Strict Transport Security'),
    ('HTML', 'HyperText Markup Language'),
    ('HTTP / HTTPS', 'HyperText Transfer Protocol / HTTP Secure'),
    ('IGNOU', 'Indira Gandhi National Open University'),
    ('JSON', 'JavaScript Object Notation'),
    ('JWT', 'JSON Web Token'),
    ('KLOC', 'Thousand Lines of Code'),
    ('LTS', 'Long Term Support'),
    ('MERN', 'MongoDB, Express.js, React, Node.js'),
    ('MRP', 'Maximum Retail Price'),
    ('NFR', 'Non-Functional Requirement'),
    ('NoSQL', 'Not Only SQL — non-relational database'),
    ('ODM', 'Object Document Mapper'),
    ('PCI-DSS', 'Payment Card Industry Data Security Standard'),
    ('REST', 'Representational State Transfer'),
    ('RDBMS', 'Relational Database Management System'),
    ('SDLC', 'Software Development Life Cycle'),
    ('SKU', 'Stock Keeping Unit'),
    ('SPA', 'Single Page Application'),
    ('SRS', 'Software Requirements Specification'),
    ('SVG', 'Scalable Vector Graphics'),
    ('TLS', 'Transport Layer Security'),
    ('UI / UX', 'User Interface / User Experience'),
    ('URL', 'Uniform Resource Locator'),
    ('UTC', 'Coordinated Universal Time'),
    ('WCAG', 'Web Content Accessibility Guidelines'),
]


def build(r, ACCENT='#1f3b73'):
    r.page_break()
    r.centered('LIST OF ABBREVIATIONS', 15, bold=True, colour=ACCENT, space_after=6)
    r.rule()
    r.spacer(8)
    r.table(['Abbreviation', 'Expansion'],
            [[f'**{a}**', b] for a, b in ABBREVIATIONS],
            widths=[0.9, 3.4], font_size=10)
