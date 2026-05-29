const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Create all tables on first run
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        date TEXT,
        description TEXT,
        amount NUMERIC,
        account TEXT,
        category TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        vendor TEXT,
        amount NUMERIC,
        currency TEXT DEFAULT 'CHF',
        date TEXT,
        document_type TEXT,
        tax_deductible BOOLEAN DEFAULT FALSE,
        tax_note TEXT,
        summary TEXT,
        category TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS grocery_receipts (
        id TEXT PRIMARY KEY,
        store TEXT,
        date TEXT,
        total NUMERIC,
        currency TEXT DEFAULT 'CHF',
        items JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS child_expenses (
        id TEXT PRIMARY KEY,
        description TEXT,
        amount NUMERIC,
        cat TEXT,
        date TEXT,
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value JSONB,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Database tables ready');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
