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
    INSERT OR REPLACE INTO kiosk_settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
  `);

  initSetting.run('current_order_number', '42');
  initSetting.run('kiosk_id', '3LS-BEACH-KIOSK-01');
  initSetting.run('store_name', "3L's Beach Resort");

  seedDefaultMenu(db);
}

function seedDefaultMenu(db: Database.Database): void {
  // Clear and reseed 3L's Beach Resort menu items
  db.exec(`DELETE FROM menu_items;`);

  const insertStmt = db.prepare(`
    INSERT INTO menu_items (id, name, category, price, image_url, base_ingredients_json, active, updated_at)
    VALUES (@id, @name, @category, @price, @image_url, @base_ingredients_json, 1, datetime('now'))
  `);

  const seedItems = [
    // --- REFRESHMENTS & SHAKES ---
    {
      id: 'ref-001',
      name: 'Fresh Coconut Water (Buko Shell)',
      category: 'refreshments',
      price: 9500,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'buko-water', name: 'Fresh Young Coconut Water', included: true, required: true, price_delta: 0 },
        { id: 'buko-meat', name: 'Tender Coconut Meat', included: true, required: true, price_delta: 0 },
        { id: 'ice', name: 'Chilled on Ice', included: true, required: false, price_delta: 0 },
        { id: 'condensed', name: 'Sweet Milk Drizzle', included: false, required: false, price_delta: 1500 }
      ])
    },
    {
      id: 'ref-002',
      name: 'Tropical Ripe Mango Shake',
      category: 'refreshments',
      price: 12000,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'mango', name: 'Guimaras Sweet Mango Purée', included: true, required: true, price_delta: 0 },
        { id: 'crushed-ice', name: 'Blended Shaved Ice', included: true, required: true, price_delta: 0 },
        { id: 'milk', name: 'Sweetened Evaporated Milk', included: true, required: false, price_delta: 0 },
        { id: 'tapioca', name: 'Chewy Tapioca Pearls', included: false, required: false, price_delta: 2000 },
        { id: 'upsize', name: 'Upsize to 24oz Giant Cup', included: false, required: false, price_delta: 3500 }
      ])
    },
    {
      id: 'ref-003',
      name: 'Halo-Halo Supreme Special',
      category: 'refreshments',
      price: 16500,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'ube-icecream', name: 'Ube Ice Cream Scoop', included: true, required: true, price_delta: 0 },
        { id: 'leche-flan', name: 'Creamy Leche Flan Slice', included: true, required: true, price_delta: 0 },
        { id: 'sweet-beans', name: 'Sweetened Beans & Nata', included: true, required: true, price_delta: 0 },
        { id: 'shaved-ice', name: 'Fine Milky Shaved Ice', included: true, required: true, price_delta: 0 },
        { id: 'extra-ube', name: 'Double Ube Scoop', included: false, required: false, price_delta: 3000 },
        { id: 'extra-flan', name: 'Extra Leche Flan Slice', included: false, required: false, price_delta: 2500 }
      ])
    },
    {
      id: 'ref-004',
      name: 'Iced Calamansi Honey Cooler',
      category: 'refreshments',
      price: 8500,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'calamansi', name: 'Freshly Squeezed Calamansi', included: true, required: true, price_delta: 0 },
        { id: 'honey', name: 'Wild Forest Honey', included: true, required: false, price_delta: 0 },
        { id: 'mint', name: 'Fresh Garden Mint Leaves', included: true, required: false, price_delta: 0 },
        { id: 'chia', name: 'Organic Chia Seeds', included: false, required: false, price_delta: 1500 }
      ])
    },
    {
      id: 'ref-005',
      name: 'Pineapple Sunset Mocktail',
      category: 'refreshments',
      price: 13500,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'pineapple', name: 'Fresh Pineapple Juice', included: true, required: true, price_delta: 0 },
        { id: 'grenadine', name: 'Ruby Sunset Grenadine', included: true, required: true, price_delta: 0 },
        { id: 'sparkling', name: 'Sparkling Soda Water', included: true, required: true, price_delta: 0 },
        { id: 'cherry', name: 'Maraschino Cherry & Umbrella', included: true, required: false, price_delta: 0 }
      ])
    },

    // --- BEACHSIDE MEALS ---
    {
      id: 'meal-001',
      name: 'Charcoal-Grilled Pork Liempo with Rice',
      category: 'meals',
      price: 22000,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'liempo', name: 'Marinated Pork Belly Cut', included: true, required: true, price_delta: 0 },
        { id: 'garlic-rice', name: 'Garlic Butter Rice', included: true, required: true, price_delta: 0 },
        { id: 'atsara', name: 'Pickled Papaya Atsara', included: true, required: false, price_delta: 0 },
        { id: 'spicy-toyo', name: 'Spicy Soy-Calamansi Dip', included: true, required: false, price_delta: 0 },
        { id: 'extra-rice', name: 'Extra Garlic Rice', included: false, required: false, price_delta: 3000 }
      ])
    },
    {
      id: 'meal-002',
      name: 'Garlic Butter Sizzling Shrimp',
      category: 'meals',
      price: 28000,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'prawns', name: 'Fresh Pacific Prawns (8 pcs)', included: true, required: true, price_delta: 0 },
        { id: 'butter-sauce', name: 'Garlic Butter Reduction', included: true, required: true, price_delta: 0 },
        { id: 'steamed-rice', name: 'Jasmine Rice Cup', included: true, required: true, price_delta: 0 },
        { id: 'chili-flakes', name: 'Roasted Chili Flakes', included: true, required: false, price_delta: 0 },
        { id: 'extra-prawns', name: 'Add 4 More Jumbo Prawns', included: false, required: false, price_delta: 12000 }
      ])
    },
    {
      id: 'meal-003',
      name: 'Bacolod Chicken Inasal Quarter',
      category: 'meals',
      price: 19500,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'inasal-leg', name: 'Lemongrass Grilled Chicken Leg', included: true, required: true, price_delta: 0 },
        { id: 'chicken-oil', name: 'Golden Annatto Chicken Oil', included: true, required: false, price_delta: 0 },
        { id: 'steamed-rice', name: 'Garlic Steamed Rice', included: true, required: true, price_delta: 0 },
        { id: 'calamansi-dip', name: 'Sinamak Vinegar Dip', included: true, required: false, price_delta: 0 }
      ])
    },
    {
      id: 'meal-004',
      name: 'Fresh Yellowfin Tuna Poke Bowl',
      category: 'meals',
      price: 26000,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'tuna-cubes', name: 'Sashimi Grade Yellowfin Tuna', included: true, required: true, price_delta: 0 },
        { id: 'seaweed', name: 'Japanese Wakame Seaweed', included: true, required: true, price_delta: 0 },
        { id: 'mango-cubes', name: 'Ripe Mango Cubes', included: true, required: false, price_delta: 0 },
        { id: 'sesame-rice', name: 'Seasoned Sushi Rice', included: true, required: true, price_delta: 0 },
        { id: 'spicy-mayo', name: 'Spicy Sriracha Japanese Mayo', included: true, required: false, price_delta: 0 }
      ])
    },

    // --- BEACH SNACKS & APPETIZERS ---
    {
      id: 'snk-001',
      name: 'Crispy Calamares with Garlic Aioli',
      category: 'snacks',
      price: 17500,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'calamari', name: 'Golden Crispy Squid Rings', included: true, required: true, price_delta: 0 },
        { id: 'aioli', name: 'Roasted Garlic Tartar Dip', included: true, required: true, price_delta: 0 },
        { id: 'lemon-wedge', name: 'Fresh Lemon Wedge', included: true, required: false, price_delta: 0 },
        { id: 'extra-aioli', name: 'Extra Garlic Aioli Cup', included: false, required: false, price_delta: 2000 }
      ])
    },
    {
      id: 'snk-002',
      name: 'Beachside Loaded Beef Nachos',
      category: 'snacks',
      price: 19000,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'tortilla-chips', name: 'Crispy Corn Tortilla Chips', included: true, required: true, price_delta: 0 },
        { id: 'melted-cheese', name: 'Warm Cheddar Cheese Sauce', included: true, required: true, price_delta: 0 },
        { id: 'taco-beef', name: 'Seasoned Ground Beef', included: true, required: true, price_delta: 0 },
        { id: 'jalapenos', name: 'Pickled Sliced Jalapeños', included: true, required: false, price_delta: 0 },
        { id: 'sour-cream', name: 'Cool Creamy Sour Dip', included: true, required: false, price_delta: 0 },
        { id: 'extra-cheese', name: 'Double Melted Cheese', included: false, required: false, price_delta: 3000 }
      ])
    },
    {
      id: 'snk-003',
      name: 'Crispy Banana Turon with Caramel & Ice Cream',
      category: 'snacks',
      price: 11000,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'turon-rolls', name: '3x Caramelized Banana Rolls', included: true, required: true, price_delta: 0 },
        { id: 'vanilla-icecream', name: 'Vanilla Ice Cream Scoop', included: true, required: false, price_delta: 0 },
        { id: 'jackfruit', name: 'Sweet Jackfruit Strips', included: true, required: false, price_delta: 0 }
      ])
    },
    {
      id: 'snk-004',
      name: 'Grilled Sweet Butter Corn on the Cob',
      category: 'snacks',
      price: 6500,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'corn', name: 'Charcoal Grilled Sweet Corn', included: true, required: true, price_delta: 0 },
        { id: 'butter', name: 'Salted Butter Glaze', included: true, required: true, price_delta: 0 },
        { id: 'parmesan', name: 'Grated Parmesan Powder', included: false, required: false, price_delta: 1500 }
      ])
    },

    // --- RESORT GEAR & ACTIVITIES ---
    {
      id: 'act-001',
      name: 'Snorkeling Mask & Dry Fin Set (2 Hours)',
      category: 'activities',
      price: 25000,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'mask', name: 'Anti-Fog Panoramic Mask', included: true, required: true, price_delta: 0 },
        { id: 'snorkel', name: 'Dry Top Snorkel Tube', included: true, required: true, price_delta: 0 },
        { id: 'fins', name: 'Adjustable Swimming Fins', included: true, required: true, price_delta: 0 },
        { id: 'lifevest', name: 'Safety Life Vest Included', included: true, required: true, price_delta: 0 }
      ])
    },
    {
      id: 'act-002',
      name: 'Single Ocean Kayak Rental (1 Hour)',
      category: 'activities',
      price: 35000,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'kayak', name: 'Heavy-Duty Ocean Kayak', included: true, required: true, price_delta: 0 },
        { id: 'paddle', name: 'Ergonomic Dual Paddle', included: true, required: true, price_delta: 0 },
        { id: 'lifevest', name: 'USCG Approved Life Vest', included: true, required: true, price_delta: 0 }
      ])
    },
    {
      id: 'act-003',
      name: "3L's Beach Resort Microfiber Quick-Dry Towel",
      category: 'activities',
      price: 29000,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'towel', name: 'Large Microfiber Beach Towel', included: true, required: true, price_delta: 0 },
        { id: 'pouch', name: 'Waterproof Zipper Carrying Bag', included: true, required: true, price_delta: 0 }
      ])
    },
    {
      id: 'act-004',
      name: 'Universal Waterproof Floating Phone Pouch',
      category: 'activities',
      price: 15000,
      image_url: null,
      base_ingredients_json: JSON.stringify([
        { id: 'phone-pouch', name: 'Touch-Responsive Waterproof Pouch', included: true, required: true, price_delta: 0 },
        { id: 'lanyard', name: 'Heavy-Duty Neck Lanyard', included: true, required: true, price_delta: 0 }
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

