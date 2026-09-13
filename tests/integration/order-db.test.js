const assert = require('assert');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

console.log('[Running SQLite Database Integration & Transaction Safety Test Suite]');

const testDbFile = path.join(__dirname, 'test_integration.sqlite');
if (fs.existsSync(testDbFile)) {
  fs.unlinkSync(testDbFile);
}

const db = new Database(testDbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS kiosk_orders (
    id TEXT PRIMARY KEY,
    order_number INTEGER NOT NULL,
    dining_mode TEXT NOT NULL DEFAULT 'dine-in',
    payment_method TEXT NOT NULL DEFAULT 'cashier-counter',
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

db.prepare(`INSERT INTO kiosk_settings (key, value, updated_at) VALUES ('current_order_number', '101', datetime('now'))`).run();

function createOrderAtomic(dto) {
  const tx = db.transaction(() => {
    const currentNum = parseInt(db.prepare(`SELECT value FROM kiosk_settings WHERE key = 'current_order_number'`).get().value, 10);
    const assignedNum = currentNum;
    const nextNum = currentNum + 1;
    const orderId = randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO kiosk_orders (
        id, order_number, dining_mode, payment_method,
        subtotal, vat, total_amount, items_recipe_json,
        sync_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(
      orderId, assignedNum, dto.diningMode, dto.paymentMethod,
      dto.subtotal, dto.vat, dto.totalAmount, JSON.stringify(dto.items), now
    );

    db.prepare(`UPDATE kiosk_settings SET value = ?, updated_at = ? WHERE key = 'current_order_number'`).run(nextNum.toString(), now);

    return { id: orderId, orderNumber: assignedNum };
  });

  return tx();
}

// Test 1: Sequential Order Numbering
{
  const order1 = createOrderAtomic({ diningMode: 'dine-in', paymentMethod: 'counter', subtotal: 8900, vat: 1068, totalAmount: 9968, items: [] });
  assert.strictEqual(order1.orderNumber, 101);

  const order2 = createOrderAtomic({ diningMode: 'take-out', paymentMethod: 'counter', subtotal: 5000, vat: 600, totalAmount: 5600, items: [] });
  assert.strictEqual(order2.orderNumber, 102);

  const order3 = createOrderAtomic({ diningMode: 'dine-in', paymentMethod: 'counter', subtotal: 15500, vat: 1860, totalAmount: 17360, items: [] });
  assert.strictEqual(order3.orderNumber, 103);

  const nextSeq = parseInt(db.prepare(`SELECT value FROM kiosk_settings WHERE key = 'current_order_number'`).get().value, 10);
  assert.strictEqual(nextSeq, 104);

  console.log('  ✓ Test 1 Passed: Atomic sequential order numbers (101 -> 102 -> 103, next: 104)');
}

// Test 2: Transaction Rollback on Error
{
  const countBefore = db.prepare(`SELECT COUNT(*) as count FROM kiosk_orders`).get().count;
  const seqBefore = db.prepare(`SELECT value FROM kiosk_settings WHERE key = 'current_order_number'`).get().value;

  try {
    const failingTx = db.transaction(() => {
      // Step A: update counter
      db.prepare(`UPDATE kiosk_settings SET value = '999' WHERE key = 'current_order_number'`).run();
      // Step B: force error (violates null constraint on id or bad SQL)
      db.prepare(`INSERT INTO kiosk_orders (id, order_number) VALUES (NULL, 104)`).run();
    });
    failingTx();
    assert.fail('Should have thrown an error');
  } catch (err) {
    // Expected
  }

  const countAfter = db.prepare(`SELECT COUNT(*) as count FROM kiosk_orders`).get().count;
  const seqAfter = db.prepare(`SELECT value FROM kiosk_settings WHERE key = 'current_order_number'`).get().value;

  assert.strictEqual(countAfter, countBefore, 'Order count must remain untouched after rollback');
  assert.strictEqual(seqAfter, seqBefore, 'Counter setting must remain unchanged after rollback');
  console.log('  ✓ Test 2 Passed: SQLite transaction cleanly rolled back on error');
}

// Clean up
db.close();
if (fs.existsSync(testDbFile)) {
  fs.unlinkSync(testDbFile);
}

console.log('All database integration tests passed successfully!\n');
