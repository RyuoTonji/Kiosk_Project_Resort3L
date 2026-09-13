import Database from 'better-sqlite3';

export function runMigrations(db: Database.Database): void {
  // Set WAL (Write-Ahead Logging) mode for concurrent read/write performance and crash safety
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // 1. Menu Items Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL, -- Integer centavos (e.g. ₱85.00 = 8500)
      image_url TEXT,
      base_ingredients_json TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
    CREATE INDEX IF NOT EXISTS idx_menu_items_active ON menu_items(active);
  `);

  // 2. Kiosk Orders Table
  db.exec(`
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

    CREATE INDEX IF NOT EXISTS idx_kiosk_orders_sync ON kiosk_orders(sync_status);
    CREATE INDEX IF NOT EXISTS idx_kiosk_orders_number ON kiosk_orders(order_number);
  `);

  // 3. Kiosk Settings Table (Persistent Counters & Config)
  db.exec(`
    CREATE TABLE IF NOT EXISTS kiosk_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Initialize Default Settings if not present
  const initSetting = db.prepare(`
    INSERT OR IGNORE INTO kiosk_settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
  `);

  initSetting.run('current_order_number', '42');
  initSetting.run('kiosk_id', 'KIOSK-TERMINAL-01');
  initSetting.run('store_name', 'EXPRESS ORDER TERMINAL');

  seedDefaultMenu(db);
}

function seedDefaultMenu(db: Database.Database): void {
  const countRow = db.prepare(`SELECT COUNT(*) as count FROM menu_items`).get() as { count: number };
  if (countRow && countRow.count > 0) {
    return; // Already seeded
  }

  const insertStmt = db.prepare(`
    INSERT INTO menu_items (id, name, category, price, image_url, base_ingredients_json, active, updated_at)
    VALUES (@id, @name, @category, @price, @image_url, @base_ingredients_json, 1, datetime('now'))
  `);

  const seedItems = [
    // --- CHICKEN ---
    {
      id: 'chk-001',
      name: '1-pc Fried Chicken with Rice',
      category: 'chicken',
      price: 8900,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'chicken', name: 'Fried Chicken Piece', included: true, required: true, price_delta: 0 },
        { id: 'rice', name: 'Steamed Rice', included: true, required: true, price_delta: 0 },
        { id: 'gravy', name: 'Signature Gravy', included: true, required: false, price_delta: 0 },
        { id: 'extra-gravy', name: 'Extra Gravy Tub', included: false, required: false, price_delta: 1500 },
        { id: 'extra-rice', name: 'Extra Steamed Rice', included: false, required: false, price_delta: 2500 }
      ])
    },
    {
      id: 'chk-002',
      name: '2-pc Fried Chicken with Drink',
      category: 'chicken',
      price: 17500,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'chicken-2', name: '2x Fried Chicken Pieces', included: true, required: true, price_delta: 0 },
        { id: 'rice', name: 'Steamed Rice', included: true, required: true, price_delta: 0 },
        { id: 'gravy', name: 'Signature Gravy', included: true, required: false, price_delta: 0 },
        { id: 'drink', name: 'Regular Soda', included: true, required: false, price_delta: 0 },
        { id: 'spicy', name: 'Make it Spicy Powder', included: false, required: false, price_delta: 1000 }
      ])
    },
    {
      id: 'chk-003',
      name: '6-pc Chicken Feast Bucket',
      category: 'chicken',
      price: 46900,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'chicken-6', name: '6-pc Fried Chicken Pieces', included: true, required: true, price_delta: 0 },
        { id: 'gravy-large', name: 'Large Gravy Bowl', included: true, required: true, price_delta: 0 },
        { id: 'extra-gravy', name: 'Extra Gravy Tub', included: false, required: false, price_delta: 1500 }
      ])
    },

    // --- BURGERS ---
    {
      id: 'brg-001',
      name: 'Classic Grilled Beef Burger',
      category: 'burgers',
      price: 5000,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'beef-patty', name: '100% Pure Beef Patty', included: true, required: true, price_delta: 0 },
        { id: 'bun', name: 'Toasted Sesame Bun', included: true, required: true, price_delta: 0 },
        { id: 'special-sauce', name: 'House Burger Sauce', included: true, required: false, price_delta: 0 },
        { id: 'pickles', name: 'Dill Pickles', included: true, required: false, price_delta: 0 },
        { id: 'extra-cheese', name: 'Add Melted Cheddar', included: false, required: false, price_delta: 1500 },
        { id: 'extra-patty', name: 'Add Extra Beef Patty', included: false, required: false, price_delta: 4000 }
      ])
    },
    {
      id: 'brg-002',
      name: 'Cheesy Bacon Deluxe Burger',
      category: 'burgers',
      price: 9500,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'beef-patty', name: '100% Pure Beef Patty', included: true, required: true, price_delta: 0 },
        { id: 'bun', name: 'Toasted Brioche Bun', included: true, required: true, price_delta: 0 },
        { id: 'cheese', name: 'Cheddar Cheese Slice', included: true, required: true, price_delta: 0 },
        { id: 'bacon', name: 'Crispy Smoked Bacon', included: true, required: false, price_delta: 0 },
        { id: 'lettuce', name: 'Fresh Crisp Lettuce', included: true, required: false, price_delta: 0 },
        { id: 'extra-cheese', name: 'Extra Cheddar Slice', included: false, required: false, price_delta: 1500 }
      ])
    },
    {
      id: 'brg-003',
      name: 'Double Cheeseburger',
      category: 'burgers',
      price: 12500,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'patty-double', name: '2x Beef Patties', included: true, required: true, price_delta: 0 },
        { id: 'bun', name: 'Toasted Bun', included: true, required: true, price_delta: 0 },
        { id: 'double-cheese', name: '2x Cheddar Cheese', included: true, required: true, price_delta: 0 },
        { id: 'special-sauce', name: 'Special Sauce', included: true, required: false, price_delta: 0 },
        { id: 'onions', name: 'Caramelized Onions', included: true, required: false, price_delta: 0 }
      ])
    },

    // --- SPAGHETTI ---
    {
      id: 'spg-001',
      name: 'Sweet-Style Spaghetti with Hotdog',
      category: 'spaghetti',
      price: 7500,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'noodles', name: 'Spaghetti Pasta', included: true, required: true, price_delta: 0 },
        { id: 'sauce', name: 'Sweet Tomato Meat Sauce', included: true, required: true, price_delta: 0 },
        { id: 'hotdogs', name: 'Sliced Red Hotdogs', included: true, required: false, price_delta: 0 },
        { id: 'cheese', name: 'Grated Cheddar Cheese', included: true, required: false, price_delta: 0 },
        { id: 'extra-cheese', name: 'Double Grated Cheese', included: false, required: false, price_delta: 1500 }
      ])
    },
    {
      id: 'spg-002',
      name: 'Spaghetti & Chicken Combo',
      category: 'spaghetti',
      price: 15500,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'noodles', name: 'Spaghetti Pasta', included: true, required: true, price_delta: 0 },
        { id: 'sauce', name: 'Sweet Tomato Meat Sauce', included: true, required: true, price_delta: 0 },
        { id: 'chicken', name: '1-pc Fried Chicken Piece', included: true, required: true, price_delta: 0 },
        { id: 'gravy', name: 'Gravy Tub', included: true, required: false, price_delta: 0 }
      ])
    },

    // --- SIDES ---
    {
      id: 'side-001',
      name: 'Crispy Golden Fries (Regular)',
      category: 'sides',
      price: 4500,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'fries', name: 'Crispy French Fries', included: true, required: true, price_delta: 0 },
        { id: 'salt', name: 'Sea Salt', included: true, required: false, price_delta: 0 },
        { id: 'cheese-powder', name: 'Cheese Flavor Powder', included: false, required: false, price_delta: 1000 },
        { id: 'bbq-powder', name: 'BBQ Flavor Powder', included: false, required: false, price_delta: 1000 }
      ])
    },
    {
      id: 'side-002',
      name: 'Crispy Golden Fries (Large)',
      category: 'sides',
      price: 7500,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'fries-lg', name: 'Large French Fries', included: true, required: true, price_delta: 0 },
        { id: 'salt', name: 'Sea Salt', included: true, required: false, price_delta: 0 }
      ])
    },
    {
      id: 'side-003',
      name: 'Extra Steamed White Rice',
      category: 'sides',
      price: 2500,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'steamed-rice', name: 'Steamed Jasmine Rice Cup', included: true, required: true, price_delta: 0 }
      ])
    },

    // --- DESSERTS ---
    {
      id: 'des-001',
      name: 'Peach Mango Crispy Turnover Pie',
      category: 'desserts',
      price: 4500,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'pie', name: 'Crispy Fried Turnover Crust', included: true, required: true, price_delta: 0 },
        { id: 'filling', name: 'Real Philippine Mango & Peach', included: true, required: true, price_delta: 0 }
      ])
    },
    {
      id: 'des-002',
      name: 'Chocolate Fudge Sundae',
      category: 'desserts',
      price: 4000,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'icecream', name: 'Vanilla Soft Serve', included: true, required: true, price_delta: 0 },
        { id: 'fudge', name: 'Warm Chocolate Fudge', included: true, required: false, price_delta: 0 },
        { id: 'extra-fudge', name: 'Extra Chocolate Fudge Layer', included: false, required: false, price_delta: 1500 }
      ])
    },

    // --- BEVERAGES ---
    {
      id: 'bev-001',
      name: 'Regular Soft Drink',
      category: 'beverages',
      price: 3500,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'soda', name: 'Carbonated Soda', included: true, required: true, price_delta: 0 },
        { id: 'ice', name: 'Crushed Ice', included: true, required: false, price_delta: 0 }
      ])
    },
    {
      id: 'bev-002',
      name: 'Large Iced Lemon Tea',
      category: 'beverages',
      price: 4500,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'tea', name: 'Brewed Lemon Iced Tea', included: true, required: true, price_delta: 0 },
        { id: 'ice', name: 'Crushed Ice', included: true, required: false, price_delta: 0 }
      ])
    },
    {
      id: 'bev-003',
      name: 'Bottled Pure Mineral Water (500ml)',
      category: 'beverages',
      price: 3000,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'water', name: 'Purified Mineral Water Bottle', included: true, required: true, price_delta: 0 }
      ])
    }
  ];

  const transaction = db.transaction((items) => {
    for (const item of items) {
      insertStmt.run(item);
    }
  });

  transaction(seedItems);
}
