require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');
const dataRoutes = require('./routes/data');
const ocrRoutes  = require('./routes/ocr');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
app.use('/api', dataRoutes);
app.use('/api/ocr', ocrRoutes);

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  try {
    await initDB();
    app.listen(PORT, () => console.log(`✅ MoneyLens backend running on port ${PORT}`));
  } catch (e) {
    console.error('Failed to start:', e.message);
    process.exit(1);
  }
}

start();
