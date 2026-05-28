# 💰 MoneyLens

Personal finance tracker for CH / IL — Swiss taxes, Neon, SBB, Twint, Max Mastercard, child expenses, investments.

## Deploy to Railway (5 steps, no terminal needed)

### Step 1 — Push to GitHub
1. Create a new **private** repo at github.com/new → name it `moneylens`
2. Upload this entire folder (drag & drop "uploading an existing file")
3. Commit changes

### Step 2 — Create Railway project
1. Go to [railway.app](https://railway.app) → **New Project**
2. Click **Deploy from GitHub repo** → select `moneylens`
3. Railway will detect the project automatically

### Step 3 — Add PostgreSQL database
1. In your Railway project dashboard click **+ New**
2. Select **Database → PostgreSQL**
3. Railway creates the database and adds `DATABASE_URL` automatically

### Step 4 — Set environment variables
In Railway → your backend service → **Variables**, add:

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` (your key from console.anthropic.com) |
| `FRONTEND_URL` | `https://your-frontend.railway.app` (set after first deploy) |
| `NODE_ENV` | `production` |

In Railway → your frontend service → **Variables**, add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-backend.railway.app` (your backend URL) |

### Step 5 — Deploy
Click **Deploy** — Railway builds and deploys both services. Takes ~2 minutes.
Your app will be live at the frontend Railway URL.

---

## Local development

```bash
# Terminal 1 — backend
cd backend
npm install
cp ../.env.example .env   # fill in your values
node server.js

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## Project structure

```
moneylens/
├── frontend/          React app (Vite)
│   └── src/
│       ├── App.jsx    Main finance app UI
│       └── api.js     All backend communication
├── backend/           Node.js / Express API
│   ├── server.js      Entry point
│   ├── db.js          PostgreSQL connection + table setup
│   └── routes/
│       ├── data.js    CRUD for all finance data
│       └── ocr.js     Anthropic OCR proxy (key stays server-side)
├── railway.toml       Railway build config
└── .env.example       Environment variable template
```

## Data storage

All your data lives in **your own PostgreSQL database on Railway**:
- Transactions (imported from CSV)
- Documents (OCR'd bills, receipts, contracts)
- Grocery receipts with item breakdown
- Child expenses
- Settings (budgets, subscriptions, investments, income)

Nothing goes to Anthropic's storage except the files you upload for OCR scanning
(they're processed and discarded — only the extracted text is saved to your DB).

## Accounts supported
- 🇮🇱 Max Mastercard (Israeli account)
- 🟢 Neon (Swiss + investments)
- 💙 Twint
- 🚆 SBB transport
