"""Appendix A — complete source code listing."""
import pathlib

SRC = pathlib.Path.home() / 'Desktop/ignou-bca-project/ecommerce-app'

# Files listed in the order a reader should encounter them: configuration first,
# then data models, then the layers that sit above them.
SERVER_FILES = [
    ('package.json', 'Server dependencies and scripts'),
    ('.env.example', 'Environment configuration template'),
    ('src/config/env.js', 'Validated environment configuration'),
    ('src/config/db.js', 'Database connection and transaction-capability probe'),
    ('src/models/User.js', 'User schema, password hashing, credential comparison'),
    ('src/models/Category.js', 'Category schema with slug derivation'),
    ('src/models/Product.js', 'Product schema, text and compound indexes'),
    ('src/models/Order.js', 'Order schema, embedded lines, state-transition table'),
    ('src/utils/ApiError.js', 'Error type carrying an HTTP status'),
    ('src/utils/asyncHandler.js', 'Promise rejection forwarding'),
    ('src/utils/token.js', 'JSON Web Token signing and verification'),
    ('src/utils/invoice.js', 'Cryptographically random invoice numbers'),
    ('src/utils/calendar.js', 'Timezone-correct calendar-day helpers'),
    ('src/utils/slugify.js', 'URL-safe slug derivation'),
    ('src/middleware/auth.js', 'Authentication and role restriction'),
    ('src/middleware/validate.js', 'express-validator bridge'),
    ('src/middleware/rateLimiter.js', 'Request rate limiting'),
    ('src/middleware/errorHandler.js', 'Central error normalisation'),
    ('src/services/catalogService.js', 'Query-string to MongoDB filter construction'),
    ('src/services/checkoutService.js', 'Pricing, atomic reservation, compensation'),
    ('src/services/paymentService.js', 'Simulated payment gateway'),
    ('src/controllers/authController.js', 'Identity endpoints'),
    ('src/controllers/productController.js', 'Catalogue endpoints'),
    ('src/controllers/categoryController.js', 'Category endpoints'),
    ('src/controllers/orderController.js', 'Checkout and fulfilment endpoints'),
    ('src/controllers/adminController.js', 'Analytics and user administration'),
    ('src/routes/index.js', 'Router composition'),
    ('src/routes/authRoutes.js', '/api/auth routes and validation'),
    ('src/routes/categoryRoutes.js', '/api/categories routes and validation'),
    ('src/routes/productRoutes.js', '/api/products routes and validation'),
    ('src/routes/orderRoutes.js', '/api/orders routes and validation'),
    ('src/routes/adminRoutes.js', '/api/admin routes and validation'),
    ('src/app.js', 'Express application assembly'),
    ('src/server.js', 'Process entry point and graceful shutdown'),
    ('src/seed/catalogData.js', 'Demonstration catalogue data'),
    ('src/seed/seed.js', 'Database seeding script'),
]

TEST_FILES = [
    ('tests/setup.js', 'In-memory MongoDB lifecycle'),
    ('tests/helpers.js', 'Shared fixtures'),
    ('tests/unit/payment.test.js', 'Unit tests — payment service'),
    ('tests/unit/catalogService.test.js', 'Unit tests — catalogue query construction'),
    ('tests/unit/checkoutService.test.js', 'Unit tests — cart normalisation and pricing'),
    ('tests/unit/calendar.test.js', 'Unit tests — calendar helpers'),
    ('tests/unit/models.test.js', 'Unit tests — schemas and hooks'),
    ('tests/integration/auth.test.js', 'Integration tests — identity endpoints'),
    ('tests/integration/product.test.js', 'Integration tests — catalogue endpoints'),
    ('tests/integration/order.test.js', 'Integration tests — checkout and fulfilment'),
    ('tests/integration/admin.test.js', 'Integration tests — administration'),
    ('tests/system/customerJourney.test.js', 'System tests — complete user journeys'),
]

CLIENT_FILES = [
    ('package.json', 'Client dependencies and scripts'),
    ('vite.config.js', 'Development server, proxy and build configuration'),
    ('index.html', 'Application shell'),
    ('src/main.jsx', 'Entry point and provider composition'),
    ('src/App.jsx', 'Route table'),
    ('src/api/client.js', 'Axios instance with interceptors'),
    ('src/api/endpoints.js', 'Endpoint wrappers'),
    ('src/utils/format.js', 'Currency, date and status formatting'),
    ('src/context/AuthContext.jsx', 'Authentication state'),
    ('src/context/CartContext.jsx', 'Shopping cart state'),
    ('src/context/ToastContext.jsx', 'Notification queue'),
    ('src/components/Navbar.jsx', 'Header with search, cart and account menu'),
    ('src/components/Footer.jsx', 'Site footer'),
    ('src/components/ProtectedRoute.jsx', 'Route guard'),
    ('src/components/Loader.jsx', 'Loading indicator and skeletons'),
    ('src/components/Alert.jsx', 'Error and message display'),
    ('src/components/Pagination.jsx', 'Page selector'),
    ('src/components/ProductCard.jsx', 'Catalogue tile'),
    ('src/components/QuantityStepper.jsx', 'Quantity control'),
    ('src/components/EmptyState.jsx', 'Empty-state placeholder'),
    ('src/pages/HomePage.jsx', 'Landing page'),
    ('src/pages/ProductListPage.jsx', 'Catalogue listing with filters'),
    ('src/pages/ProductDetailPage.jsx', 'Product detail'),
    ('src/pages/CartPage.jsx', 'Shopping cart'),
    ('src/pages/CheckoutPage.jsx', 'Checkout'),
    ('src/pages/OrderConfirmationPage.jsx', 'Order confirmation'),
    ('src/pages/OrderListPage.jsx', 'Order history'),
    ('src/pages/OrderDetailPage.jsx', 'Order detail with status timeline'),
    ('src/pages/LoginPage.jsx', 'Sign in'),
    ('src/pages/RegisterPage.jsx', 'Registration'),
    ('src/pages/ProfilePage.jsx', 'Account management'),
    ('src/pages/NotFoundPage.jsx', 'Page not found'),
    ('src/pages/admin/AdminLayout.jsx', 'Administration shell'),
    ('src/pages/admin/AdminDashboard.jsx', 'Analytics dashboard'),
    ('src/pages/admin/AdminProducts.jsx', 'Product maintenance'),
    ('src/pages/admin/AdminCategories.jsx', 'Category maintenance'),
    ('src/pages/admin/AdminOrders.jsx', 'Order fulfilment queue'),
    ('src/pages/admin/AdminUsers.jsx', 'Customer administration'),
    ('src/styles/global.css', 'Design tokens, fluid grid and responsive rules'),
]


def _listing(r, root, relative, description, index):
    path = root / relative
    if not path.exists():
        return 0
    text = path.read_text().rstrip('\n')
    lines = text.count('\n') + 1
    r.code(text,
           caption=f'A{index}.  {relative}  —  {description}  ({lines} lines)',
           size=7.2)
    return lines


def build(r):
    r.h1('APPENDIX A — COMPLETE SOURCE CODE')
    r.p('The complete source of the application is reproduced below. Listings are given in the '
        'order a reader should encounter them: configuration first, then the data models, then '
        'the layers built on top of them. Every file carries the comments present in the '
        'source; none has been abridged.')
    r.p('Per the BCSP-064 guidelines, the source code is excluded from the page count of the '
        'main report.')

    r.aux = True          # appendix listings are excluded from the index pages
    total = 0
    index = 0

    r.h2('A.1  Server — Node.js, Express and MongoDB')
    for relative, description in SERVER_FILES:
        index += 1
        total += _listing(r, SRC / 'server', relative, description, index)

    r.h2('A.2  Server — Automated Test Suite')
    for relative, description in TEST_FILES:
        index += 1
        total += _listing(r, SRC / 'server', relative, description, index)

    r.h2('A.3  Client — React Single-Page Application')
    for relative, description in CLIENT_FILES:
        index += 1
        total += _listing(r, SRC / 'client', relative, description, index)

    r.h2('A.4  Listing Summary')
    r.table(['Area', 'Files', 'Approximate lines'],
            [['Server source', str(len(SERVER_FILES)), '—'],
             ['Server tests', str(len(TEST_FILES)), '—'],
             ['Client source', str(len(CLIENT_FILES)), '—'],
             ['**Total reproduced**', f'**{index}**', f'**{total:,}**']],
            caption='Source code reproduced in this appendix',
            widths=[1.6, 0.8, 1.2], font_size=9.5)
    r.aux = False
    return total
