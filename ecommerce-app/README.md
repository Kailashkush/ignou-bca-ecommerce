# ShopSphere — E-Commerce Web Application

A full-stack online store built on the MERN stack for the IGNOU BCA project
(BCSP-064). See `../README.md` for setup, the submission checklist and how the
report maps to the guidelines.

## Architecture

```
React 18 SPA  ──HTTPS/JSON──▶  Node.js + Express REST API  ──▶  MongoDB
 (browser)                      (stateless, JWT-authenticated)   (4 collections)
```

The browser has no path to the database. Every request passes through the
Express middleware chain, so authentication, authorisation, input sanitisation
and rate limiting cannot be bypassed by a crafted client.

## What it does

**Customers** — register and sign in, browse a catalogue with full-text search
and filtering by category, price band and availability, build a cart that
survives a reload, check out with a card or cash on delivery, and track or
cancel their orders.

**Administrators** — maintain products and categories, adjust stock, progress
orders through a state machine, activate or deactivate customer accounts, and
read a sales dashboard with a fourteen-day revenue series, best sellers and
low-stock alerts.

## Three design decisions worth knowing about

1. **Every price is recomputed on the server.** The cart lives in the browser
   for responsiveness, but the submitted cart is treated as nothing more than a
   list of product ids and quantities. See `services/checkoutService.js`.

2. **Stock cannot be oversold.** The stock check and the decrement are a single
   atomic `findOneAndUpdate`, so two concurrent checkouts for the last unit
   cannot both succeed. Test `TC-U-36` fires ten simultaneous reservations at
   one unit of stock and asserts exactly one wins.

3. **No card data is kept.** The card number is validated in memory (Luhn +
   expiry), reduced to its last four digits for the invoice, and discarded.
   Tests `TC-U-09` and `TC-I-39` assert its absence.

## Layout

```
server/
  src/config/       Environment validation, DB connection, transaction probe
  src/models/       User, Category, Product, Order — schemas, indexes, hooks
  src/middleware/   auth, validation, rate limiting, central error handling
  src/services/     catalogService, checkoutService, paymentService
  src/controllers/  One per module
  src/routes/       Validation rules declared beside each route
  src/utils/        ApiError, token, invoice, calendar, slugify, asyncHandler
  tests/            unit (55) · integration (67) · system (5)
client/
  src/api/          Axios instance with token and error interceptors
  src/context/      Auth, Cart, Toast providers
  src/components/   Reusable presentational components
  src/pages/        22 screens, including pages/admin/
  src/styles/       Design tokens, fluid grid, responsive rules
```

## Commands

```bash
# server
npm run dev        # nodemon on :5000
npm run seed       # rebuild the demonstration dataset
npm test           # 127 tests against an in-memory MongoDB
npm run test:coverage

# client
npm run dev        # Vite on :5173, proxying /api to :5000
npm run build      # production bundle into dist/
```

## Environment

Copy `server/.env.example` to `server/.env` and set `JWT_SECRET`. The server
refuses to start in production with the development fallback secret.
