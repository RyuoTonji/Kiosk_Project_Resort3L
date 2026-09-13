/**
 * 3L's Beach Resort — Cart Engine
 * Handles cart item instantiation, modifier price calculation, VAT, and immutable helpers.
 */

/**
 * Generate a unique ID for cart line items.
 * @returns {string}
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'item_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

/**
 * Compute the total modifier price delta for an array of selected modifiers.
 * @param {Array} modifiers
 * @returns {number} centavos
 */
export function calculateModifierTotal(modifiers = []) {
  return modifiers.reduce((acc, mod) => {
    if (mod.selected && mod.priceDelta > 0) {
      return acc + mod.priceDelta;
    }
    return acc;
  }, 0);
}

/**
 * Create a new standardized cart item object.
 * @param {Object} menuItem
 * @param {Array} selectedModifiers
 * @param {number} quantity
 * @returns {Object}
 */
export function createCartItem(menuItem, selectedModifiers = [], quantity = 1) {
  const modifierTotal = calculateModifierTotal(selectedModifiers);
  const basePrice = menuItem.price || 0;
  const unitPrice = basePrice + modifierTotal;

  return {
    cartItemId: generateId(),
    menuItemId: menuItem.id,
    name: menuItem.name,
    category: menuItem.category,
    emoji: menuItem.emoji || '🌴',
    basePrice,
    modifiers: selectedModifiers.map((m) => ({
      id: m.id,
      name: m.name,
      priceDelta: m.priceDelta || 0,
      selected: !!m.selected,
      type: m.type || 'boolean'
    })),
    modifierTotal,
    unitPrice,
    quantity: Math.max(1, quantity)
  };
}

/**
 * Create a deterministic key for modifiers to compare if two cart items have identical configurations.
 * @param {Array} modifiers
 * @returns {string}
 */
export function getModifierConfigKey(modifiers = []) {
  const selectedSorted = modifiers
    .filter((m) => m.selected)
    .map((m) => m.id)
    .sort()
    .join('|');
  return selectedSorted;
}

/**
 * Calculate totals for the entire cart.
 * Philippine VAT standard: Prices are VAT-inclusive (12%).
 * @param {Array} cart
 * @returns {{ count: number, grandTotal: number, subtotal: number, vat: number }}
 */
export function calculateCartTotals(cart = []) {
  let count = 0;
  let grandTotal = 0;

  for (const item of cart) {
    count += item.quantity;
    grandTotal += (item.unitPrice * item.quantity);
  }

  // Philippine 12% VAT extraction from inclusive total
  // Net Subtotal = Total / 1.12, VAT = Total - Net Subtotal
  const subtotal = Math.round(grandTotal / 1.12);
  const vat = grandTotal - subtotal;

  return {
    count,
    grandTotal,
    subtotal,
    vat
  };
}
