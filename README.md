# Ledgerdary 💰

A personal finance tracker — import bank transactions (CSV/Excel), OCR bills and grocery receipts with Claude, categorize spending, track subscriptions, investments, tax-deductible expenses, and family/child expenses in one dashboard.

## What it does

- **Multi-account tracking** — balances across accounts (bank, mobile payments, travel card, etc.), each with its own currency.
- **Statement import** — drag-and-drop CSV or Excel (`.xlsx`/`.xls`/`.ods`) bank statements; columns are auto-detected (date, description, amount) with German/English/Hebrew header matching, and transactions are auto-categorized by keyword.
- **Document OCR** — upload a bill/receipt/insurance/contract (PDF or image) and Claude extracts vendor, amount, date, category, and whether it's tax-deductible, with a short tax note.
- **Grocery receipt OCR** — upload a grocery receipt and Claude itemizes it (name, quantity, unit price, category) for food-spend breakdowns.
- **Spending dashboard** — monthly spend by category against budgets, lunch/dining and grocery tracking, charts (bar/pie/line via Recharts).
- **Tax summary** — aggregates tax-deductible documents and subscriptions.
- **Annual view** — subscriptions (monthly/yearly) rolled up to annual cost, investment holdings and gains.
- **Family / child expenses** — a dedicated ledger for child-related spending, combining manual entries with imported transactions tagged `Child/School` or `Child/Other`.

Built with a Switzerland/Israel household in mind (CHF/₪ currencies, German/Hebrew statement formats, Swiss tax terminology), but not hardcoded to any one country.

## Architecture

```
Ledgerdary/
├── backend/            Express API + Postgres persistence + Claude-powered OCR
│   ├── server.js       App entrypoint — serves the API and the built frontend
│   ├── db.js           Postgres pool + schema (transactions, documents,
│   │                   grocery_receipts, child_expenses, settings)
│   └── routes/
│       ├── data.js     CRUD for transactions/documents/grocery/child-expenses/settings
│       └── ocr.js      POST /api/ocr/bill, /api/ocr/grocery — Claude vision extraction
├── frontend/            React + Vite single-page app
│   └── src/
│       ├── App.jsx      All UI: tabs, dashboard, import, OCR flows, charts
│       ├── api.js       Thin fetch wrapper around the backend API
│       └── main.jsx      React root
├── Dockerfile           Single-container build: builds the frontend, copies
│                        the static bundle into backend/dist, serves both
│                        from one Express process on $PORT
└── railway.toml         Railway deploy config (Dockerfile builder, /health check)
```

**Stack:** React 18 + Vite (frontend), Express + `pg` (backend), PostgreSQL (storage), `@anthropic-ai/sdk` (document/receipt OCR via Claude), Recharts (charts), PapaParse + `xlsx` (statement parsing).

**Deployment model:** one service, one container. The Dockerfile builds the Vite frontend into static files, copies them into `backend/dist`, and the Express server (`backend/server.js`) serves both the REST API (under `/api`) and the frontend's static files — so there's no separate frontend host or `VITE_API_URL` to configure. `frontend/nixpacks.toml` exists for local Nixpacks-based previews but Railway is configured to build via `Dockerfile` (see `railway.toml`).

## Running locally

### Prerequisites
- Node.js 20+
- A PostgreSQL database (local or hosted)
- (Optional, for OCR) an Anthropic API key

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```
DATABASE_URL=postgres://user:password@localhost:5432/ledgerdary
ANTHROPIC_API_KEY=sk-ant-...   # required only for the OCR endpoints
PORT=3001                       # backend defaults to 3000, but the Vite dev
                                 # proxy below expects 3001 — set it explicitly
                                 # for local frontend+backend dev
```

```bash
npm run dev    # nodemon, or: npm start
```

The backend creates its tables automatically on first boot (`initDB()` in `db.js`) and serves the API at `/api`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173` and proxies `/api` requests to `http://localhost:3001` (see `frontend/vite.config.js`) — start the backend on port 3001 first, or adjust the proxy target.

## Running via Docker

```bash
docker build -t ledgerdary .
docker run -p 3000:3000 \
  -e DATABASE_URL=postgres://user:password@host:5432/ledgerdary \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  ledgerdary
```

This builds the frontend, bundles it with the backend into a single image, and serves everything from one process on `$PORT` (default `3000`). Visit `http://localhost:3000`.

## Deploying to Railway

The repo is pre-configured for Railway:

- `railway.toml` tells Railway to build with the root `Dockerfile` and health-check `/health`.
- Set the environment variables `DATABASE_URL` and `ANTHROPIC_API_KEY` on the Railway service (attach a Railway Postgres plugin for `DATABASE_URL`, or point it at any external Postgres instance).
- Railway sets `PORT` automatically; the app reads it via `process.env.PORT`.

Push to the branch Railway is watching and it will build and deploy the Dockerfile as a single service.

## API surface

All endpoints are namespaced under `/api` and implemented in `backend/routes/`:

| Resource | Endpoints |
|---|---|
| Transactions | `GET/POST(bulk)/PATCH/DELETE /api/transactions` |
| Documents | `GET/POST/DELETE /api/documents` |
| Grocery receipts | `GET/POST/DELETE /api/grocery-receipts` |
| Child expenses | `GET/POST/DELETE /api/child-expenses` |
| Settings (budgets, subs, investments, income, etc.) | `GET/PUT /api/settings/:key` |
| OCR | `POST /api/ocr/bill`, `POST /api/ocr/grocery` (multipart file upload) |

`GET /health` is used by Railway's health check.
