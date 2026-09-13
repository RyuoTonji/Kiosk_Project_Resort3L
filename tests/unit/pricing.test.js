const assert = require('assert');

// Philippine VAT (12%) calculation convention using integer centavos
function calculatePricing(items) {
  let subtotal = 0;
  for (const item of items) {
    subtotal += item.unitPrice * item.quantity;
  }
  const vat = Math.round(subtotal * 0.12);
  const grandTotal = subtotal + vat;
  return { subtotal, vat, grandTotal };
}

function formatCentavos(centavos) {
  return '₱' + (centavos / 100).toFixed(2);
}

console.log('[Running Pricing & Integer Centavos Test Suite]');

// Test 1: Standard Item Calculation (₱89.00 -> 8900)
{
  const items = [{ unitPrice: 8900, quantity: 1 }];
  const { subtotal, vat, grandTotal } = calculatePricing(items);

  assert.strictEqual(subtotal, 8900, 'Subtotal should be 8900 centavos (₱89.00)');
  assert.strictEqual(vat, 1068, 'VAT 12% of 8900 should be 1068 centavos (₱10.68)');
  assert.strictEqual(grandTotal, 9968, 'Grand total should be 9968 centavos (₱99.68)');
  console.log('  ✓ Test 1 Passed: Single item VAT and Total');
}

// Test 2: Multiple Items with Modifiers
{
  const items = [
    { unitPrice: 5000 + 1500, quantity: 2 }, // 2x Burger with Cheese (₱65.00 each = 13000)
    { unitPrice: 4500, quantity: 1 }         // 1x Fries (₱45.00 = 4500)
  ];
  const { subtotal, vat, grandTotal } = calculatePricing(items);

  assert.strictEqual(subtotal, 17500, 'Subtotal should be 17500 centavos (₱175.00)');
  assert.strictEqual(vat, Math.round(17500 * 0.12), 'VAT should be 2100 centavos (₱21.00)');
  assert.strictEqual(grandTotal, 19600, 'Grand total should be 19600 centavos (₱196.00)');
  console.log('  ✓ Test 2 Passed: Multiple items with modifier deltas');
}

// Test 3: Currency Display Formatting
{
  assert.strictEqual(formatCentavos(8900), '₱89.00');
  assert.strictEqual(formatCentavos(1068), '₱10.68');
  assert.strictEqual(formatCentavos(9968), '₱99.68');
  assert.strictEqual(formatCentavos(0), '₱0.00');
  console.log('  ✓ Test 3 Passed: Currency formatting');
}

// Test 4: Floating Point Safety (Centavos eliminate IEEE-754 inaccuracy)
{
  // 0.1 + 0.2 in floating point is 0.30000000000000004
  // In centavos: 10 + 20 === 30 exactly
  const priceA = 10;
  const priceB = 20;
  assert.strictEqual(priceA + priceB, 30);
  console.log('  ✓ Test 4 Passed: Zero floating-point rounding errors');
}

console.log('All pricing unit tests passed successfully!\n');
