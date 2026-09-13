/**
 * CartManager (Model Layer)
 * Encapsulates the cart state, unique recipe customization instances,
 * quantity adjustments, and integer centavo Philippine VAT (12%) calculations.
 */
export class CartManager {
  /**
   * Initialize empty cart instance.
   */
  constructor() {
    /**
     * Array of active cart items.
     * @type {Array<{
     *   cartItemId: string,
     *   menuItemId: string,
     *   name: string,
     *   quantity: number,
     *   unitPrice: number,
     *   modifiersTotal: number,
     *   recipe: Record<string, boolean>,
     *   modifiersSummary: string[]
     * }>}
     */
    this.items = [];
    this.listeners = [];
  }

  /**
   * Subscribe a listener callback triggered on any cart mutation.
   * @param {Function} listener
   */
  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.push(listener);
    }
  }

  /**
   * Notify all registered subscribers of state change.
   */
  notify() {
    const totals = this.calculateTotals();
    for (const listener of this.listeners) {
      try {
        listener(this.items, totals);
      } catch (err) {
        console.error('[CartManager] Error in change listener:', err);
      }
    }
  }

  /**
   * Add a customized item to the cart. If identical recipe already exists, increment quantity.
   * @param {Object} menuItem - Source menu item
   * @param {Record<string, boolean>} recipe - Custom ingredients state map
   * @param {number} unitPrice - Total unit price in centavos
   * @param {number} modifiersTotal - Sum of modifier deltas in centavos
   * @param {string[]} modifiersSummary - Human-readable summary of additions/removals
   */
  addItem(menuItem, recipe, unitPrice, modifiersTotal, modifiersSummary = []) {
    const recipeKey = JSON.stringify(recipe);
    const existing = this.items.find(
      (item) => item.menuItemId === menuItem.id && JSON.stringify(item.recipe) === recipeKey
    );

    if (existing) {
      existing.quantity += 1;
    } else {
      this.items.push({
        cartItemId: 'item_' + Math.random().toString(36).substring(2, 10),
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: 1,
        unitPrice: unitPrice,
        modifiersTotal: modifiersTotal,
        recipe: { ...recipe },
        modifiersSummary: [...modifiersSummary]
      });
    }

    this.notify();
  }

  /**
   * Update an existing cart item at a given index with new recipe customization.
   * @param {number} index
   * @param {Record<string, boolean>} recipe
   * @param {number} unitPrice
   * @param {number} modifiersTotal
   * @param {string[]} modifiersSummary
   */
  updateItem(index, recipe, unitPrice, modifiersTotal, modifiersSummary = []) {
    if (this.items[index]) {
      this.items[index].recipe = { ...recipe };
      this.items[index].unitPrice = unitPrice;
      this.items[index].modifiersTotal = modifiersTotal;
      this.items[index].modifiersSummary = [...modifiersSummary];
      this.notify();
    }
  }

  /**
   * Increment quantity of an item at the specified index.
   * @param {number} index
   */
  incrementQuantity(index) {
    if (this.items[index]) {
      this.items[index].quantity += 1;
      this.notify();
    }
  }

  /**
   * Decrement quantity of an item at the specified index. Removes item if quantity reaches 0.
   * @param {number} index
   */
  decrementQuantity(index) {
    if (this.items[index]) {
      if (this.items[index].quantity > 1) {
        this.items[index].quantity -= 1;
      } else {
        this.items.splice(index, 1);
      }
      this.notify();
    }
  }

  /**
   * Remove item from cart at the specified index.
   * @param {number} index
   */
  removeItem(index) {
    if (this.items[index]) {
      this.items.splice(index, 1);
      this.notify();
    }
  }

  /**
   * Clear all items from the cart.
   */
  clear() {
    this.items = [];
    this.notify();
  }

  /**
   * Get total quantity of all items in cart.
   * @returns {number}
   */
  getTotalCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Calculate precise financial metrics in integer centavos.
   * Philippine VAT is 12% calculated as Math.round(subtotal * 0.12).
   * @returns {{ subtotal: number, vat: number, grandTotal: number, count: number }}
   */
  calculateTotals() {
    let subtotal = 0;
    for (const item of this.items) {
      subtotal += item.unitPrice * item.quantity;
    }
    const vat = Math.round(subtotal * 0.12);
    const grandTotal = subtotal + vat;
    const count = this.getTotalCount();

    return { subtotal, vat, grandTotal, count };
  }

  /**
   * Return defensive copy of cart items.
   * @returns {Array}
   */
  getItems() {
    return [...this.items];
  }
}
