// All backend communication lives here.
// VITE_API_URL is set automatically in Railway — falls back to same-origin for local dev.
const BASE = import.meta.env.VITE_API_URL || '';

async function req(method, path, body, isForm = false) {
  const opts = { method, headers: {} };
  if (body && !isForm) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  } else if (body && isForm) {
    opts.body = body; // FormData — browser sets Content-Type automatically
  }
  const r = await fetch(`${BASE}/api${path}`, opts);
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(err.error || r.statusText);
  }
  return r.json();
}

// ── Transactions ──────────────────────────────────────────────────────────────
export const api = {
  // Transactions
  getTransactions:    ()       => req('GET',    '/transactions'),
  addTransactions:    (txs)    => req('POST',   '/transactions/bulk', { transactions: txs }),
  deleteTransaction:  (id)     => req('DELETE', `/transactions/${id}`),
  updateTxCategory:   (id, cat)=> req('PATCH',  `/transactions/${id}`, { category: cat }),
  clearTransactions:  ()       => req('DELETE', '/transactions'),

  // Documents
  getDocuments:       ()       => req('GET',    '/documents'),
  addDocument:        (doc)    => req('POST',   '/documents', doc),
  deleteDocument:     (id)     => req('DELETE', `/documents/${id}`),

  // Grocery receipts
  getGroceryReceipts: ()       => req('GET',    '/grocery-receipts'),
  addGroceryReceipt:  (r)      => req('POST',   '/grocery-receipts', r),
  deleteGroceryReceipt:(id)    => req('DELETE', `/grocery-receipts/${id}`),

  // Child expenses
  getChildExpenses:   ()       => req('GET',    '/child-expenses'),
  addChildExpense:    (e)      => req('POST',   '/child-expenses', e),
  deleteChildExpense: (id)     => req('DELETE', `/child-expenses/${id}`),

  // Settings (budgets, subs, investments, income, child name)
  getSetting:         (key)    => req('GET',    `/settings/${key}`),
  setSetting:         (key, v) => req('PUT',    `/settings/${key}`, { value: v }),

  // OCR — sends file directly to backend, key stays server-side
  ocrBill: async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return req('POST', '/ocr/bill', fd, true);
  },
  ocrGrocery: async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return req('POST', '/ocr/grocery', fd, true);
  },
};
