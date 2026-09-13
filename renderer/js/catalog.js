/**
 * 3L's Beach Resort — Product Catalog & Service Definitions
 * Prices stored in integer centavos (₱1.00 = 100 centavos).
 */

export const RESORT_CATEGORIES = [
  { id: 'refreshments', label: 'Refreshments', icon: '🥤', description: 'Fresh tropical shakes & island coolers' },
  { id: 'meals', label: 'Meals', icon: '🍽', description: 'Fresh seafood & grilled island specialties' },
  { id: 'snacks', label: 'Snacks', icon: '🍟', description: 'Crispy finger foods & sweet treats' },
  { id: 'souvenirs', label: 'Souvenirs', icon: '🎁', description: 'Resort merchandise & beach gear' }
];

export const RESORT_SERVICES = [
  {
    id: 'food-drinks',
    title: 'FOOD & DRINKS',
    subtitle: 'Restaurant, Shakes & Snacks',
    badge: 'FRESH & TROPICAL',
    icon: `<svg class="w-16 h-16 text-resort-ocean" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>`,
    tagline: 'Dine beachfront or pack for your cabana'
  },
  {
    id: 'resort-activities',
    title: 'RESORT ACTIVITIES',
    subtitle: 'Kayaks, Island Tours & Cabanas',
    badge: 'FUN & ADVENTURE',
    icon: `<svg class="w-16 h-16 text-resort-sun" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>`,
    tagline: 'Book water sports & beach equipment'
  }
];

export const RESORT_CATALOG = [
  // --- REFRESHMENTS ---
  {
    id: 'drink-001',
    name: 'Signature Mango Shake',
    category: 'refreshments',
    price: 8500, // ₱85.00
    description: 'Blended sweet Carabao mangoes with crushed ice and creamy condensed milk.',
    customizable: true,
    emoji: '🥭',
    accentColor: '#FBBF24',
    modifiers: [
      { id: 'ice', name: 'Add Extra Crushed Ice', priceDelta: 0, included: true, type: 'boolean' },
      { id: 'sugar', name: 'Standard Sweetness', priceDelta: 0, included: true, type: 'boolean' },
      { id: 'toppings', name: 'Extra Tapioca Pearls & Jelly', priceDelta: 1500, included: false, type: 'paid' },
      { id: 'upsize', name: 'Upsize to Giant 24oz', priceDelta: 3000, included: false, type: 'upgrade' }
    ]
  },
  {
    id: 'drink-002',
    name: 'Fresh Island Buko',
    category: 'refreshments',
    price: 7500, // ₱75.00
    description: 'Chilled freshly opened young coconut straight from our palm grove.',
    customizable: true,
    emoji: '🥥',
    accentColor: '#10B981',
    modifiers: [
      { id: 'chilled', name: 'Served Ice-Cold', priceDelta: 0, included: true, type: 'boolean' },
      { id: 'straw', name: 'Eco Bamboo Straw', priceDelta: 0, included: true, type: 'boolean' }
    ]
  },
  {
    id: 'drink-003',
    name: 'Pineapple Mint Cooler',
    category: 'refreshments',
    price: 9000, // ₱90.00
    description: 'Refreshing muddled pineapple juice with garden mint and sparkling soda.',
    customizable: true,
    emoji: '🍍',
    accentColor: '#F59E0B',
    modifiers: [
      { id: 'extra-mint', name: 'Extra Fresh Mint Leaves', priceDelta: 1000, included: false, type: 'paid' },
      { id: 'upsize', name: 'Upsize to Giant 24oz', priceDelta: 3000, included: false, type: 'upgrade' }
    ]
  },
  {
    id: 'drink-004',
    name: 'Cold Brew Coconut Latte',
    category: 'refreshments',
    price: 11000, // ₱110.00
    description: 'Slow-steeped Arabica coffee blended with smooth coconut cream over ice.',
    customizable: true,
    emoji: '☕',
    accentColor: '#78350F',
    modifiers: [
      { id: 'extra-shot', name: 'Extra Espresso Shot', priceDelta: 3500, included: false, type: 'paid' },
      { id: 'less-sweet', name: 'Sugar-Free', priceDelta: 0, included: false, type: 'removal' }
    ]
  },
  {
    id: 'drink-005',
    name: 'Iced Hibiscus Beach Tea',
    category: 'refreshments',
    price: 6500, // ₱65.00
    description: 'Tart and floral iced ruby herbal tea sweetened with pure calamansi honey.',
    customizable: true,
    emoji: '🌺',
    accentColor: '#F43F5E',
    modifiers: [
      { id: 'chia', name: 'Add Organic Chia Seeds', priceDelta: 1500, included: false, type: 'paid' },
      { id: 'upsize', name: 'Upsize to Giant 24oz', priceDelta: 3000, included: false, type: 'upgrade' }
    ]
  },
  {
    id: 'drink-006',
    name: 'Tropical Watermelon Fizz',
    category: 'refreshments',
    price: 8500, // ₱85.00
    description: 'Crisp hand-pressed red watermelon juice with lime zest and club soda.',
    customizable: true,
    emoji: '🍉',
    accentColor: '#EF4444',
    modifiers: [
      { id: 'extra-lime', name: 'Extra Lime Wedges', priceDelta: 1000, included: false, type: 'paid' }
    ]
  },

  // --- MEALS ---
  {
    id: 'meal-001',
    name: 'Grilled Chicken Inasal',
    category: 'meals',
    price: 18500, // ₱185.00
    description: 'Marinated lemongrass quarter chicken grilled over beach charcoal with garlic rice.',
    customizable: true,
    emoji: '🍗',
    accentColor: '#D97706',
    modifiers: [
      { id: 'extra-garlic-rice', name: 'Extra Garlic Rice Cup', priceDelta: 3500, included: false, type: 'paid' },
      { id: 'extra-atchara', name: 'Extra Papaya Atchara Pickles', priceDelta: 1500, included: false, type: 'paid' },
      { id: 'spicy', name: 'Spicy Chili Suka Dip', priceDelta: 0, included: true, type: 'boolean' }
    ]
  },
  {
    id: 'meal-002',
    name: 'Garlic Butter Shrimp Feast',
    category: 'meals',
    price: 22500, // ₱225.00
    description: 'Fresh local sea prawns sautéed in golden garlic butter sauce with steamed rice.',
    customizable: true,
    emoji: '🍤',
    accentColor: '#F97316',
    modifiers: [
      { id: 'garlic-butter', name: 'Extra Garlic Butter Glaze', priceDelta: 2500, included: false, type: 'paid' },
      { id: 'upgrade-rice', name: 'Upgrade to Sinangag Garlic Rice', priceDelta: 2000, included: false, type: 'upgrade' }
    ]
  },
  {
    id: 'meal-003',
    name: 'Island BBQ Pork Skewers (3pcs)',
    category: 'meals',
    price: 16000, // ₱160.00
    description: 'Caramelized sweet-savory tender pork skewers glazed with banana BBQ marinade.',
    customizable: true,
    emoji: '🍢',
    accentColor: '#B45309',
    modifiers: [
      { id: 'extra-skewer', name: 'Add 1 More Skewer', priceDelta: 4500, included: false, type: 'paid' },
      { id: 'spicy-glaze', name: 'Spicy Habanero Glaze', priceDelta: 0, included: false, type: 'boolean' }
    ]
  },
  {
    id: 'meal-004',
    name: 'Crispy Lechon Kawali Meal',
    category: 'meals',
    price: 21000, // ₱210.00
    description: 'Deep-fried crispy pork belly cubes served with liver sauce, atchara, and hot rice.',
    customizable: true,
    emoji: '🍖',
    accentColor: '#78350F',
    modifiers: [
      { id: 'extra-sauce', name: 'Extra Spiced Mang Tomas Sauce', priceDelta: 1500, included: false, type: 'paid' },
      { id: 'extra-rice', name: 'Extra Steamed Jasmine Rice', priceDelta: 2500, included: false, type: 'paid' }
    ]
  },
  {
    id: 'meal-005',
    name: 'Grilled Yellowfin Tuna Belly',
    category: 'meals',
    price: 24000, // ₱240.00
    description: 'Thick cut fresh yellowfin tuna belly basted with calamansi-soy glaze.',
    customizable: true,
    emoji: '🐟',
    accentColor: '#0369A1',
    modifiers: [
      { id: 'wasabi', name: 'Add Calamansi Wasabi Mayo', priceDelta: 1500, included: false, type: 'paid' },
      { id: 'seaweed', name: 'Side of Seasoned Lato Seaweed', priceDelta: 3000, included: false, type: 'paid' }
    ]
  },
  {
    id: 'meal-006',
    name: 'Resort Beachside Burger',
    category: 'meals',
    price: 17500, // ₱175.00
    description: 'Quarter-pound grilled beef patty with cheddar, caramelized pineapple, and beach fries.',
    customizable: true,
    emoji: '🍔',
    accentColor: '#D97706',
    modifiers: [
      { id: 'bacon', name: 'Add Crispy Bacon Strips', priceDelta: 4000, included: false, type: 'paid' },
      { id: 'double-cheese', name: 'Extra Cheddar Cheese Slice', priceDelta: 2000, included: false, type: 'paid' },
      { id: 'no-onions', name: 'No Raw Onions', priceDelta: 0, included: false, type: 'removal' }
    ]
  },

  // --- SNACKS ---
  {
    id: 'snack-001',
    name: 'Crispy Calamari Rings',
    category: 'snacks',
    price: 14500, // ₱145.00
    description: 'Golden batter-crusted squid rings served with garlic aioli and calamansi.',
    customizable: true,
    emoji: '🦑',
    accentColor: '#F59E0B',
    modifiers: [
      { id: 'spicy-dip', name: 'Spicy Chili Sriracha Dip', priceDelta: 1500, included: false, type: 'paid' },
      { id: 'extra-lemon', name: 'Extra Calamansi Wedges', priceDelta: 0, included: true, type: 'boolean' }
    ]
  },
  {
    id: 'snack-002',
    name: 'Loaded Beach Potato Wedges',
    category: 'snacks',
    price: 11000, // ₱110.00
    description: 'Crisp seasoned potato wedges smothered in warm cheese sauce and bacon bits.',
    customizable: true,
    emoji: '🍟',
    accentColor: '#EAB308',
    modifiers: [
      { id: 'sour-cream', name: 'Add Sour Cream & Chives', priceDelta: 2000, included: false, type: 'paid' },
      { id: 'jalapenos', name: 'Add Pickled Jalapeños', priceDelta: 1500, included: false, type: 'paid' }
    ]
  },
  {
    id: 'snack-003',
    name: 'Banana Turon Caramel Bites',
    category: 'snacks',
    price: 6500, // ₱65.00
    description: 'Crispy spring rolls stuffed with Saba banana, jackfruit strips, and brown sugar drizzle.',
    customizable: true,
    emoji: '🍌',
    accentColor: '#F59E0B',
    modifiers: [
      { id: 'ice-cream', name: 'Add Scoop of Ube Ice Cream', priceDelta: 3500, included: false, type: 'paid' }
    ]
  },
  {
    id: 'snack-004',
    name: 'Halo-Halo Supreme Deluxe',
    category: 'snacks',
    price: 9500, // ₱95.00
    description: 'Shaved ice with ube halaya, leche flan, sweet beans, coconut strings, and evaporated milk.',
    customizable: true,
    emoji: '🍧',
    accentColor: '#9333EA',
    modifiers: [
      { id: 'extra-leche-flan', name: 'Extra Leche Flan Slice', priceDelta: 2500, included: false, type: 'paid' },
      { id: 'extra-ube', name: 'Extra Ube Halaya Dollop', priceDelta: 2000, included: false, type: 'paid' }
    ]
  },

  // --- SOUVENIRS ---
  {
    id: 'souv-001',
    name: "3L's Quick-Dry Beach Towel",
    category: 'souvenirs',
    price: 35000, // ₱350.00
    description: 'Sand-free, absorbent micro-fiber resort towel printed with 3L’s tropical crest.',
    customizable: false,
    emoji: '🏖',
    accentColor: '#0284C7',
    modifiers: []
  },
  {
    id: 'souv-002',
    name: 'Handmade Island Shell Necklace',
    category: 'souvenirs',
    price: 12000, // ₱120.00
    description: 'Polished natural puka shells crafted by local coastal artisans.',
    customizable: false,
    emoji: '🐚',
    accentColor: '#E2E8F0',
    modifiers: []
  },
  {
    id: 'souv-003',
    name: 'Woven Pandan Island Tote',
    category: 'souvenirs',
    price: 28000, // ₱280.00
    description: 'Durable handmade eco-friendly beach tote for sunscreen, towels, and sunglasses.',
    customizable: false,
    emoji: '👜',
    accentColor: '#D97706',
    modifiers: []
  },
  {
    id: 'souv-004',
    name: 'Waterproof Phone Kiosk Pouch',
    category: 'souvenirs',
    price: 9000, // ₱90.00
    description: 'IPX8 certified buoyant clear touchscreen pouch with lanyard for snorkeling.',
    customizable: false,
    emoji: '📱',
    accentColor: '#10B981',
    modifiers: []
  }
];
