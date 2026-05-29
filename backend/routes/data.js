const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// ── Transactions ─────────────────────────────────────────────────────────────
router.get('/transactions', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM transactions ORDER BY date DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/transactions', async (req, res) => {
  const { id, date, desc, amount, account, category } = req.body;
  try {
    await pool.query(
      'INSERT INTO transactions (id,date,desc,amount,account,category) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING',
      [id, date, desc, amount, account, category]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/transactions/bulk', async (req, res) => {
  const { transactions } = req.body;
  if (!Array.isArray(transactions) || !transactions.length) return res.json({ inserted: 0 });
  const client = await pool.connect();
  let inserted = 0;
  try {
    await client.query('BEGIN');
    for (const t of transactions) {
      const r = await client.query(
        'INSERT INTO transactions (id,date,desc,amount,account,category) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING',
        [t.id, t.date, t.desc, t.amount, t.account, t.category]
      );
      inserted += r.rowCount;
    }
    await client.query('COMMIT');
    res.json({ inserted });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

router.delete('/transactions/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM transactions WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/transactions/:id', async (req, res) => {
  const { category } = req.body;
  try {
    await pool.query('UPDATE transactions SET category=$1 WHERE id=$2', [category, req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/transactions', async (req, res) => {
  try {
    await pool.query('DELETE FROM transactions');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Documents ─────────────────────────────────────────────────────────────────
router.get('/documents', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM documents ORDER BY created_at DESC');
    res.json(r.rows.map(d => ({
      ...d,
      taxDeductible: d.tax_deductible,
      documentType: d.document_type,
      taxNote: d.tax_note,
    })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/documents', async (req, res) => {
  const { id, vendor, amount, currency, date, documentType, taxDeductible, taxNote, summary, category } = req.body;
  try {
    await pool.query(
      `INSERT INTO documents (id,vendor,amount,currency,date,document_type,tax_deductible,tax_note,summary,category)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
      [id, vendor, amount, currency || 'CHF', date, documentType, taxDeductible, taxNote, summary, category]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/documents/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM documents WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Grocery Receipts ──────────────────────────────────────────────────────────
router.get('/grocery-receipts', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM grocery_receipts ORDER BY created_at DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/grocery-receipts', async (req, res) => {
  const { id, store, date, total, currency, items } = req.body;
  try {
    await pool.query(
      'INSERT INTO grocery_receipts (id,store,date,total,currency,items) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING',
      [id, store, date, total, currency || 'CHF', JSON.stringify(items || [])]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/grocery-receipts/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM grocery_receipts WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Child Expenses ────────────────────────────────────────────────────────────
router.get('/child-expenses', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM child_expenses ORDER BY date DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/child-expenses', async (req, res) => {
  const { id, desc, amount, cat, date, note } = req.body;
  try {
    await pool.query(
      'INSERT INTO child_expenses (id,desc,amount,cat,date,note) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING',
      [id, desc, amount, cat, date, note]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/child-expenses/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM child_expenses WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Settings (budgets, subscriptions, investments, income, child name) ────────
router.get('/settings/:key', async (req, res) => {
  try {
    const r = await pool.query('SELECT value FROM settings WHERE key=$1', [req.params.key]);
    res.json(r.rows[0]?.value ?? null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/settings/:key', async (req, res) => {
  const { value } = req.body;
  try {
    await pool.query(
      `INSERT INTO settings (key,value,updated_at) VALUES($1,$2,NOW())
       ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW()`,
      [req.params.key, JSON.stringify(value)]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
