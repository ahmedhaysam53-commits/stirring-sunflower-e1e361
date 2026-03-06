const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data.db');
const MIGRATIONS_PATH = path.join(__dirname, 'migrations', 'init.sql');

const db = new Database(DB_PATH);

db.pragma('foreign_keys = ON');

const init = () => {
  const sql = fs.readFileSync(MIGRATIONS_PATH, 'utf-8');
  db.exec(sql);
};

init();

module.exports = db;
