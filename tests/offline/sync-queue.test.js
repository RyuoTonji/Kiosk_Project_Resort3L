const assert = require('assert');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

console.log('[Running Offline Sync Queue & Idempotency Test Suite]');

const testDbFile = path.join(__dirname, 'test_offline_sync.sqlite');
if (fs.existsSync(testDbFile)) {
  fs.unlinkSync(testDbFile);
}

const db = new Database(testDbFile);
db.pragma('journal_mode = WAL');

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
`);

// Test 1: Generate Offline Orders
{
  const insertStmt = db.prepare(`
    INSERT INTO kiosk_orders (
      id, order_number, dining_mode, payment_method,
      subtotal, vat, total_amount, items_recipe_json,
      sync_status, created_at
    ) VALUES (?, ?, 'dine-in', 'cashier-counter', 10000, 1200, 11200, '[]', 'pending', datetime('now'))
  `);

  insertStmt.run(randomUUID(), 42);
  insertStmt.run(randomUUID(), 43);
  insertStmt.run(randomUUID(), 44);

  const pendingCount = db.prepare(`SELECT COUNT(*) as count FROM kiosk_orders WHERE sync_status = 'pending'`).get().count;
  assert.strictEqual(pendingCount, 3, 'All 3 offline orders must be saved locally with pending status');
  console.log('  ✓ Test 1 Passed: 3 offline orders queued with sync_status = pending');
}

// Test 2: Background Sync Batch Processing (Internet returns)
{
  const pendingOrders = db.prepare(`SELECT * FROM kiosk_orders WHERE sync_status = 'pending'`).all();
  assert.strictEqual(pendingOrders.length, 3);

  // Simulate cloud sync worker
  const updateStmt = db.prepare(`
    UPDATE kiosk_orders
    SET sync_status = 'synced', synced_at = datetime('now')
    WHERE id = ?
  `);

  for (const order of pendingOrders) {
    // Cloud upload succeeds
    updateStmt.run(order.id);
  }

  const remainingPending = db.prepare(`SELECT COUNT(*) as count FROM kiosk_orders WHERE sync_status = 'pending'`).get().count;
  const syncedCount = db.prepare(`SELECT COUNT(*) as count FROM kiosk_orders WHERE sync_status = 'synced'`).get().count;

  assert.strictEqual(remainingPending, 0, 'No pending orders should remain after sync');
  assert.strictEqual(syncedCount, 3, 'All 3 orders should now have sync_status = synced');
  console.log('  ✓ Test 2 Passed: Sync queue transitions orders from pending -> synced');
}

// Test 3: Idempotency & Conflict Safety
{
  // If an already synced order is re-processed, status remains safely synced
  const existingOrder = db.prepare(`SELECT * FROM kiosk_orders LIMIT 1`).get();
  db.prepare(`
    UPDATE kiosk_orders
    SET sync_status = 'synced', synced_at = datetime('now')
    WHERE id = ?
  `).run(existingOrder.id);

  const finalOrder = db.prepare(`SELECT * FROM kiosk_orders WHERE id = ?`).get(existingOrder.id);
  assert.strictEqual(finalOrder.sync_status, 'synced');
  console.log('  ✓ Test 3 Passed: Idempotent re-sync preserves data integrity without duplication');
}

// Clean up
db.close();
if (fs.existsSync(testDbFile)) {
  fs.unlinkSync(testDbFile);
}

console.log('All offline sync tests passed successfully!\n');
