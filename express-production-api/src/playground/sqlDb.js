const path = require('path');
const fs = require('fs');
// Node's built-in SQLite - zero native compilation, ships with the Node
// binary itself. Chosen specifically to avoid a node-gyp/Python toolchain
// dependency for a demo feature (better-sqlite3 needs a native build; this
// doesn't). Experimental as of Node 22, but stable enough for read-only demo
// queries against a small seeded dataset.
const { DatabaseSync } = require('node:sqlite');
const logger = require('../config/logger');

const DB_PATH = path.join(__dirname, '../../data/playground.sqlite');

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    city TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
  CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
  CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
`;

// Small, fixed, well-known dataset - deliberately normalized (orders and
// order_items are separate tables joined by foreign key) so a query
// answering "what did this customer order, with product names" REQUIRES a
// JOIN - that's the concrete SQL-vs-NoSQL contrast the paired Mongo
// playground (embedded documents, no join needed) is built to demonstrate.
function seed(db) {
  const insertCustomer = db.prepare('INSERT INTO customers (id, name, email, city) VALUES (?, ?, ?, ?)');
  const insertProduct = db.prepare('INSERT INTO products (id, name, category, price, stock) VALUES (?, ?, ?, ?, ?)');
  const insertOrder = db.prepare('INSERT INTO orders (id, customer_id, status, created_at) VALUES (?, ?, ?, ?)');
  const insertItem = db.prepare(
    'INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)'
  );

  const customers = [
    [1, 'Ava Chen', 'ava@example.com', 'Seattle'],
    [2, 'Marcus Bell', 'marcus@example.com', 'Austin'],
    [3, 'Priya Nair', 'priya@example.com', 'Boston'],
  ];
  const products = [
    [1, 'Mechanical Keyboard', 'Electronics', 89.99, 42],
    [2, 'Ultrawide Monitor', 'Electronics', 459.99, 15],
    [3, 'USB-C Dock', 'Electronics', 64.99, 100],
    [4, 'Ergonomic Chair', 'Furniture', 329.99, 8],
    [5, 'Webcam 4K', 'Electronics', 129.99, 60],
  ];
  const orders = [
    [1, 1, 'delivered', '2026-06-02T10:00:00Z'],
    [2, 1, 'processing', '2026-07-15T14:30:00Z'],
    [3, 2, 'delivered', '2026-06-20T09:15:00Z'],
    [4, 3, 'shipped', '2026-07-10T16:45:00Z'],
  ];
  const items = [
    [1, 1, 1, 1, 89.99],
    [2, 1, 3, 2, 64.99],
    [3, 2, 2, 1, 459.99],
    [4, 3, 4, 1, 329.99],
    [5, 3, 5, 1, 129.99],
    [6, 4, 1, 2, 89.99],
    [7, 4, 3, 1, 64.99],
  ];

  for (const c of customers) insertCustomer.run(...c);
  for (const p of products) insertProduct.run(...p);
  for (const o of orders) insertOrder.run(...o);
  for (const i of items) insertItem.run(...i);
}

function ensureSchemaAndSeed() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec(SCHEMA_SQL);

  const { count } = db.prepare('SELECT COUNT(*) AS count FROM customers').get();
  if (count === 0) {
    seed(db);
    logger.info('playground.sql_seeded');
  }
  db.close();
}

// A single long-lived READ-ONLY connection for query execution - opened
// separately from the read-write connection used only at boot for schema
// setup/seeding. `readOnly: true` is enforced by SQLite itself, not just
// application logic: an INSERT/UPDATE/DELETE against this handle throws
// "attempt to write a readonly database" regardless of what the calling
// route validated, so a bug in the route-level guard can't turn into an
// actual write.
let readOnlyDb = null;
function getReadOnlyDb() {
  if (!readOnlyDb) {
    readOnlyDb = new DatabaseSync(DB_PATH, { readOnly: true });
  }
  return readOnlyDb;
}

module.exports = { ensureSchemaAndSeed, getReadOnlyDb, DB_PATH };
