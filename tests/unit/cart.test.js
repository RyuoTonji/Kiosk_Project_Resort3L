const assert = require('assert');

console.log('[Running Cart Operations Test Suite]');

class CartManager {
  constructor() {
    this.items = [];
  }

  addItem(menuItemId, name, unitPrice, recipe = {}, modifiersSummary = []) {
    const recipeKey = JSON.stringify(recipe);
    const existing = this.items.find(
      (i) => i.menuItemId === menuItemId && JSON.stringify(i.recipe) === recipeKey
    );

    if (existing) {
      existing.quantity += 1;
      return existing;
    } else {
      const newItem = {
        cartItemId: 'item_' + Math.random().toString(36).substring(2, 8),
        menuItemId,
        name,
        quantity: 1,
        unitPrice,
        recipe,
        modifiersSummary
      };
      this.items.push(newItem);
      return newItem;
    }
  }

  incrementQuantity(index) {
    if (this.items[index]) {
      this.items[index].quantity += 1;
    }
  }

  decrementQuantity(index) {
    if (this.items[index]) {
      if (this.items[index].quantity > 1) {
        this.items[index].quantity -= 1;
      } else {
        this.items.splice(index, 1);
      }
    }
  }

  removeItem(index) {
    this.items.splice(index, 1);
  }

  getTotalCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}

// Test 1: Add default item and increment
{
  const cart = new CartManager();
  cart.addItem('chk-001', '1-pc Chicken', 8900);
  assert.strictEqual(cart.items.length, 1);
  assert.strictEqual(cart.getTotalCount(), 1);

  cart.addItem('chk-001', '1-pc Chicken', 8900);
  assert.strictEqual(cart.items.length, 1, 'Same recipe should stack into single line');
  assert.strictEqual(cart.items[0].quantity, 2);
  console.log('  ✓ Test 1 Passed: Item addition and quantity stacking');
}

// Test 2: Multiple customized variants of same product
{
  const cart = new CartManager();
  // Variant A: Burger with Extra Cheese
  cart.addItem('brg-001', 'Classic Burger', 6500, { cheese: true, pickles: true }, ['+ Extra Cheese']);
  // Variant B: Burger with NO Pickles
  cart.addItem('brg-001', 'Classic Burger', 5000, { cheese: false, pickles: false }, ['No Pickles']);

  assert.strictEqual(cart.items.length, 2, 'Distinct customizations must exist as separate lines');
  assert.strictEqual(cart.getTotalCount(), 2);
  assert.strictEqual(cart.items[0].unitPrice, 6500);
  assert.strictEqual(cart.items[1].unitPrice, 5000);
  console.log('  ✓ Test 2 Passed: Multiple customized variants maintained independently');
}

// Test 3: Decrement and Removal
{
  const cart = new CartManager();
  cart.addItem('side-001', 'Fries', 4500);
  cart.addItem('side-001', 'Fries', 4500);
  assert.strictEqual(cart.items[0].quantity, 2);

  cart.decrementQuantity(0);
  assert.strictEqual(cart.items[0].quantity, 1);

  cart.decrementQuantity(0);
  assert.strictEqual(cart.items.length, 0, 'Decrementing quantity from 1 should remove line');
  console.log('  ✓ Test 3 Passed: Decrementing and line removal');
}

console.log('All cart unit tests passed successfully!\n');
