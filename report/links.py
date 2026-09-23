"""
Where the project lives online.

These two URLs are rendered as QR codes on the "Project Resources" page of the
report, so an examiner can reach the source and the running application from
the printed copy. Change them here and rebuild; nothing else references them.

Set to None to omit that entry (and its QR code) entirely.
"""

GITHUB_URL = 'https://github.com/Kailashkush/ignou-bca-ecommerce'
LIVE_URL = None        # e.g. 'https://shopsphere-web.onrender.com'

# Shown beneath each code so the page is still usable without a phone.
GITHUB_LABEL = 'Complete source code, tests and build scripts'
LIVE_LABEL = 'Live demonstration — browse, register and place an order'

DEMO_ACCOUNTS = [
    ('Customer', 'ananya@example.com', 'Customer@123'),
    ('Administrator', 'admin@shopsphere.test', 'Admin@12345'),
]
