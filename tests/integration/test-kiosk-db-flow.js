const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

const testDbPath = path.join(__dirname, 'test_kiosk.sqlite');
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

const db = new Database(testDbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    image_url TEXT,
    base_ingredients_json TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS kiosk_orders (
    id TEXT PRIMARY KEY,
    order_number INTEGER NOT NULL,
    dining_mode TEXT NOT NULL DEFAULT 'dine-in',
    payment_method TEXT NOT NULL DEFAULT 'card',
    subtotal INTEGER NOT NULL,
    vat INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    items_recipe_json TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    synced_at TEXT
  );

  CREATE TABLE IF NOT EXISTS kiosk_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

db.prepare(`INSERT INTO kiosk_settings (key, value, updated_at) VALUES ('current_order_number', '42', datetime('now'))`).run();

// Test 1: Settings Check
const setting = db.prepare(`SELECT value FROM kiosk_settings WHERE key = 'current_order_number'`).get();
console.log('✓ Initial Order Counter:', setting.value);
if (setting.value !== '42') throw new Error('Setting failed');

// Test 2: Order Atomic Transaction
const createOrderTx = db.transaction((orderData) => {
  const currentNum = parseInt(db.prepare(`SELECT value FROM kiosk_settings WHERE key = 'current_order_number'`).get().value, 10);
  const nextNum = currentNum + 1;
  const id = randomUUID();

  db.prepare(`
    INSERT INTO kiosk_orders (id, order_number, dining_mode, payment_method, subtotal, vat, total_amount, items_recipe_json, sync_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
  `).run(id, currentNum, orderData.diningMode, orderData.paymentMethod, orderData.subtotal, orderData.vat, orderData.totalAmount, JSON.stringify(orderData.items));

  db.prepare(`UPDATE kiosk_settings SET value = ?, updated_at = datetime('now') WHERE key = 'current_order_number'`).run(nextNum.toString());

  return { id, orderNumber: currentNum };
});

const result1 = createOrderTx({
  diningMode: 'dine-in',
  paymentMethod: 'card',
  subtotal: 10000,
  vat: 1200,
  totalAmount: 11200,
  items: [{ name: 'Burger', quantity: 1 }]
});

console.log('✓ Order 1 Created:', result1);
if (result1.orderNumber !== 42) throw new Error('Order number mismatch');

const result2 = createOrderTx({
  diningMode: 'take-out',
  paymentMethod: 'cash',
  subtotal: 5000,
  vat: 600,
  totalAmount: 5600,
  items: [{ name: 'Fries', quantity: 1 }]
});

console.log('✓ Order 2 Created:', result2);
if (result2.orderNumber !== 43) throw new Error('Order counter did not increment sequentially');

const nextSetting = db.prepare(`SELECT value FROM kiosk_settings WHERE key = 'current_order_number'`).get();
console.log('✓ Next Counter Value in DB:', nextSetting.value);
if (nextSetting.value !== '44') throw new Error('Next order counter mismatch');

db.close();
fs.unlinkSync(testDbPath);
console.log('✓ All integration checks passed successfully!');
