require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..')));

const now = () => new Date().toISOString();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already exists' });
  }

  const id = randomUUID();
  const passwordHash = bcrypt.hashSync(password, 10);
  db.prepare(
    'INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, name, email, passwordHash, now());

  return res.status(201).json({ id, name, email });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, {
    expiresIn: '12h',
  });

  return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.get('/api/accounts', authMiddleware, (_req, res) => {
  const accounts = db
    .prepare(
      'SELECT id, code, name, type, parent_id FROM accounts ORDER BY code ASC'
    )
    .all();
  return res.json(accounts);
});

app.post('/api/accounts', authMiddleware, (req, res) => {
  const { code, name, type, parent_id } = req.body || {};
  if (!code || !name || !type) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const id = randomUUID();
  try {
    db.prepare(
      'INSERT INTO accounts (id, code, name, type, parent_id, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, code, name, type, parent_id || null, req.user.id, now());
  } catch (error) {
    return res.status(400).json({ error: 'Account code already exists' });
  }
  return res.status(201).json({ id, code, name, type, parent_id: parent_id || null });
});

app.put('/api/accounts/:id', authMiddleware, (req, res) => {
  const { code, name, type, parent_id } = req.body || {};
  if (!code || !name || !type) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    db.prepare(
      'UPDATE accounts SET code = ?, name = ?, type = ?, parent_id = ? WHERE id = ?'
    ).run(code, name, type, parent_id || null, req.params.id);
  } catch (error) {
    return res.status(400).json({ error: 'Failed to update account' });
  }
  return res.json({ id: req.params.id, code, name, type, parent_id: parent_id || null });
});

app.delete('/api/accounts/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM accounts WHERE id = ?').run(req.params.id);
  return res.status(204).send();
});

app.get('/api/customers', authMiddleware, (_req, res) => {
  const customers = db.prepare('SELECT * FROM customers ORDER BY name ASC').all();
  return res.json(customers);
});

app.post('/api/customers', authMiddleware, (req, res) => {
  const { name, phone, email } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name required' });
  const id = randomUUID();
  db.prepare(
    'INSERT INTO customers (id, name, phone, email, balance, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, phone || null, email || null, 0, req.user.id, now());
  return res.status(201).json({ id, name, phone, email, balance: 0 });
});

app.get('/api/suppliers', authMiddleware, (_req, res) => {
  const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY name ASC').all();
  return res.json(suppliers);
});

app.post('/api/suppliers', authMiddleware, (req, res) => {
  const { name, phone, email } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name required' });
  const id = randomUUID();
  db.prepare(
    'INSERT INTO suppliers (id, name, phone, email, balance, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, phone || null, email || null, 0, req.user.id, now());
  return res.status(201).json({ id, name, phone, email, balance: 0 });
});

app.get('/api/journals', authMiddleware, (_req, res) => {
  const entries = db
    .prepare(
      'SELECT id, entry_date, description, created_at FROM journal_entries ORDER BY entry_date DESC'
    )
    .all();
  return res.json(entries);
});

app.post('/api/journals', authMiddleware, (req, res) => {
  const { entry_date, description, lines } = req.body || {};
  if (!entry_date || !Array.isArray(lines) || lines.length === 0) {
    return res.status(400).json({ error: 'Invalid journal entry' });
  }

  const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  if (totalDebit !== totalCredit) {
    return res.status(400).json({ error: 'Debits and credits must balance' });
  }

  const entryId = randomUUID();
  const insertEntry = db.prepare(
    'INSERT INTO journal_entries (id, entry_date, description, created_by, created_at) VALUES (?, ?, ?, ?, ?)'
  );
  const insertLine = db.prepare(
    'INSERT INTO journal_lines (id, entry_id, account_id, debit, credit, memo) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const transaction = db.transaction(() => {
    insertEntry.run(entryId, entry_date, description || null, req.user.id, now());
    lines.forEach((line) => {
      insertLine.run(
        randomUUID(),
        entryId,
        line.account_id,
        Number(line.debit || 0),
        Number(line.credit || 0),
        line.memo || null
      );
    });
  });

  transaction();
  return res.status(201).json({ id: entryId });
});

app.get('/api/receipts', authMiddleware, (_req, res) => {
  const receipts = db
    .prepare(
      'SELECT r.id, r.receipt_date, r.amount, r.description, c.name as customer FROM receipts r LEFT JOIN customers c ON c.id = r.customer_id ORDER BY r.receipt_date DESC'
    )
    .all();
  return res.json(receipts);
});

app.post('/api/receipts', authMiddleware, (req, res) => {
  const { receipt_date, customer_id, amount, description } = req.body || {};
  if (!receipt_date || !amount) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const id = randomUUID();
  db.prepare(
    'INSERT INTO receipts (id, receipt_date, customer_id, amount, description, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, receipt_date, customer_id || null, Number(amount), description || null, req.user.id, now());
  return res.status(201).json({ id });
});

app.get('/api/payments', authMiddleware, (_req, res) => {
  const payments = db
    .prepare(
      'SELECT p.id, p.payment_date, p.amount, p.description, s.name as supplier FROM payments p LEFT JOIN suppliers s ON s.id = p.supplier_id ORDER BY p.payment_date DESC'
    )
    .all();
  return res.json(payments);
});

app.post('/api/payments', authMiddleware, (req, res) => {
  const { payment_date, supplier_id, amount, description } = req.body || {};
  if (!payment_date || !amount) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const id = randomUUID();
  db.prepare(
    'INSERT INTO payments (id, payment_date, supplier_id, amount, description, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, payment_date, supplier_id || null, Number(amount), description || null, req.user.id, now());
  return res.status(201).json({ id });
});

app.get('/api/reports/trial-balance', authMiddleware, (_req, res) => {
  const rows = db
    .prepare(
      `SELECT a.code, a.name, a.type,
         SUM(jl.debit) as total_debit,
         SUM(jl.credit) as total_credit,
         SUM(jl.debit - jl.credit) as balance
       FROM accounts a
       LEFT JOIN journal_lines jl ON jl.account_id = a.id
       GROUP BY a.id
       ORDER BY a.code ASC`
    )
    .all();
  return res.json(rows);
});

app.get('/api/reports/income-statement', authMiddleware, (_req, res) => {
  const revenue = db
    .prepare(
      `SELECT SUM(jl.credit - jl.debit) as total
       FROM accounts a
       LEFT JOIN journal_lines jl ON jl.account_id = a.id
       WHERE a.type = 'revenue'`
    )
    .get();
  const expense = db
    .prepare(
      `SELECT SUM(jl.debit - jl.credit) as total
       FROM accounts a
       LEFT JOIN journal_lines jl ON jl.account_id = a.id
       WHERE a.type = 'expense'`
    )
    .get();
  return res.json({ revenue: revenue.total || 0, expense: expense.total || 0 });
});

app.get('/api/reports/balance-sheet', authMiddleware, (_req, res) => {
  const assets = db
    .prepare(
      `SELECT SUM(jl.debit - jl.credit) as total
       FROM accounts a
       LEFT JOIN journal_lines jl ON jl.account_id = a.id
       WHERE a.type = 'asset'`
    )
    .get();
  const liabilities = db
    .prepare(
      `SELECT SUM(jl.credit - jl.debit) as total
       FROM accounts a
       LEFT JOIN journal_lines jl ON jl.account_id = a.id
       WHERE a.type = 'liability'`
    )
    .get();
  const equity = db
    .prepare(
      `SELECT SUM(jl.credit - jl.debit) as total
       FROM accounts a
       LEFT JOIN journal_lines jl ON jl.account_id = a.id
       WHERE a.type = 'equity'`
    )
    .get();
  return res.json({ assets: assets.total || 0, liabilities: liabilities.total || 0, equity: equity.total || 0 });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
