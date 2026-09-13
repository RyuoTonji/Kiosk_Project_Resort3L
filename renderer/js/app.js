// Production-Grade Offline Kiosk Controller (Poster Screen, Counter Payment & 5s Auto-Close Receipt)

// Pure SVG Barcode Generator Utility
function generateBarcodeSVG(codeText, width = 260, height = 65) {
  let pattern = '10100110110'; // Guard bars
  for (let i = 0; i < codeText.length; i++) {
    const charCode = codeText.charCodeAt(i);
    const bits = (charCode * 31 % 127).toString(2).padStart(7, '0');
    pattern += bits + '0';
  }
  pattern += '11010010101'; // Stop guard

  const barCount = pattern.length;
  const barWidth = width / barCount;

  let rects = '';
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '1') {
      const x = (i * barWidth).toFixed(2);
      rects += `<rect x="${x}" y="0" width="${barWidth.toFixed(2)}" height="${height}" fill="#000000" />`;
    }
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="block">
      <rect width="${width}" height="${height}" fill="#ffffff"/>
      ${rects}
    </svg>
  `;
}

// Format integer centavos to Philippine Peso (e.g. 8900 -> ₱89.00)
function formatCentavos(centavos) {
  return '₱' + (centavos / 100).toFixed(2);
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Kiosk] Initializing poster welcome and cashier counter payment kiosk flow...');

  // --- STATE ---
  let diningMode = 'dine-in';
  let activeCategory = 'all';
  let categories = [];
  let menuItems = [];
  let cart = []; // Array of ordered items
  let nextOrderNumber = 42;
  let isTrayExpanded = false;

  // Customizer modal state
  let modalMode = 'add'; // 'add' | 'edit'
  let activeEditingIndex = -1;
  let activeCustomizingItem = null;
  let activeCustomizingRecipe = {};

  let currentOrderResult = null;
  let lastReceiptText = '';
  let receiptTimerInterval = null;

  // --- UI DOM ELEMENTS ---
  const screenWelcome = document.getElementById('screen-welcome');
  const screenDining = document.getElementById('screen-dining');
  const screenMenu = document.getElementById('screen-menu');
  const screenConfirmed = document.getElementById('screen-confirmed');

  const optDineIn = document.getElementById('opt-dine-in');
  const optTakeOut = document.getElementById('opt-take-out');
  const btnDiningCancel = document.getElementById('btn-dining-cancel');

  const menuOrderNum = document.getElementById('menu-order-num');
  const menuDiningTag = document.getElementById('menu-dining-tag');
  const headerItemsCount = document.getElementById('header-items-count');
  const currentCategoryLabel = document.getElementById('current-category-label');
  const categoryButtonContainer = document.getElementById('category-button-container');
  const menuProductGrid = document.getElementById('menu-product-grid');

  // Bottom Tray Elements
  const trayHandleBar = document.getElementById('tray-handle-bar');
  const btnToggleTray = document.getElementById('btn-toggle-tray');
  const trayToggleIcon = document.getElementById('tray-toggle-icon');
  const traySummaryCount = document.getElementById('tray-summary-count');
  const trayQuickTotal = document.getElementById('tray-quick-total');
  const trayContentBody = document.getElementById('tray-content-body');
  const summaryItemsList = document.getElementById('summary-items-list');

  // Bottom Fixed Footer
  const btnMenuBack = document.getElementById('btn-menu-back');
  const totalSubtotal = document.getElementById('total-subtotal');
  const totalVat = document.getElementById('total-vat');
  const totalGrand = document.getElementById('total-grand');
  const btnProceedCheckout = document.getElementById('btn-proceed-checkout');

  // Customization Modal
  const modalCustomization = document.getElementById('modal-customization');
  const custModalBadge = document.getElementById('cust-modal-badge');
  const custItemName = document.getElementById('cust-item-name');
  const custUnitPrice = document.getElementById('cust-unit-price');
  const custIngredientsList = document.getElementById('cust-ingredients-list');
  const custBtnCancel = document.getElementById('cust-btn-cancel');
  const custBtnConfirm = document.getElementById('cust-btn-confirm');

  // Confirmation Screen
  const confirmTimestamp = document.getElementById('confirm-timestamp');
  const confirmOrderNumber = document.getElementById('confirm-order-number');
  const confirmDiningMode = document.getElementById('confirm-dining-mode');
  const barcodeContainer = document.getElementById('barcode-container');
  const barcodeLabel = document.getElementById('barcode-label');
  const confirmTimer = document.getElementById('confirm-timer');
  const btnFinishOrder = document.getElementById('btn-finish-order');

  // --- SCREEN SWITCHING ---
  function showScreen(screen) {
    [screenWelcome, screenDining, screenMenu, screenConfirmed].forEach((s) => {
      s.classList.add('hidden');
      s.classList.remove('active');
    });
    screen.classList.remove('hidden');
    screen.classList.add('active');
  }

  // --- INITIALIZE DATA FROM SQLITE ---
  async function loadInitialData() {
    if (!window.kioskAPI) {
      console.error('[Kiosk] window.kioskAPI missing!');
      return;
    }

    try {
      // 1. Next Order Sequence
      nextOrderNumber = await window.kioskAPI.getNextOrderNumber();
      const formattedNum = '#' + String(nextOrderNumber).padStart(3, '0');
      if (menuOrderNum) menuOrderNum.textContent = formattedNum;

      // 2. Categories
      categories = await window.kioskAPI.getCategories();
      renderCategories();

      // 3. Menu Items
      menuItems = await window.kioskAPI.getMenuItems();
      renderMenuItems();
    } catch (err) {
      console.error('[Kiosk] SQLite Load Error:', err);
    }
  }

  // --- RENDER CATEGORIES SIDEBAR ---
  function renderCategories() {
    if (!categoryButtonContainer) return;
    categoryButtonContainer.innerHTML = '';

    const allCats = ['all', ...categories];

    allCats.forEach((cat) => {
      const btn = document.createElement('button');
      const isActive = cat === activeCategory;
      btn.className = `w-full py-3 px-3 text-left text-[11px] font-black rounded-2xl border-2 uppercase touch-press transition-all shadow-xs ${
        isActive
          ? 'bg-sky-700 text-white border-sky-800 shadow-md ring-2 ring-amber-400'
          : 'bg-white text-slate-700 border-slate-200 hover:bg-sky-50 hover:border-sky-300'
      }`;
      btn.textContent = cat === 'all' ? '🌴 ALL ITEMS' : `• ${cat.toUpperCase()}`;
      btn.addEventListener('click', () => {
        activeCategory = cat;
        if (currentCategoryLabel) currentCategoryLabel.textContent = `${cat.toUpperCase()} ITEMS`;
        renderCategories();
        renderMenuItems();
      });
      categoryButtonContainer.appendChild(btn);
    });
  }

  // --- RENDER MENU PRODUCT GRID (CLICK ENTIRE CARD OR ADD BUTTON TO CUSTOMIZE) ---
  function renderMenuItems() {
    if (!menuProductGrid) return;
    menuProductGrid.innerHTML = '';

    const filtered = activeCategory === 'all'
      ? menuItems
      : menuItems.filter((i) => i.category.toLowerCase() === activeCategory.toLowerCase());

    filtered.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'bg-white border-2 border-slate-200 hover:border-sky-400 rounded-3xl p-3 flex flex-col justify-between shadow-kiosk-card hover:shadow-lg cursor-pointer touch-press transition-all group';

      const imageBox = `
        <div class="w-full aspect-square rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-amber-50/50 flex flex-col items-center justify-center text-center p-2 mb-2.5 group-hover:border-sky-400 transition-colors">
          <span class="text-2xl mb-1">🍽️</span>
          <span class="text-[9px] font-black font-mono text-sky-700 uppercase bg-sky-100 px-2 py-0.5 rounded-full">${item.category.toUpperCase()}</span>
        </div>
      `;

      card.innerHTML = `
        ${imageBox}
        <div class="flex-1 flex flex-col justify-between">
          <div>
            <div class="text-xs font-black uppercase text-slate-900 line-clamp-2 leading-snug">${item.name}</div>
            <div class="inline-block mt-1.5 px-2 py-0.5 bg-amber-400 text-slate-900 rounded-lg text-xs font-black font-mono shadow-xs">
              ${formatCentavos(item.price)}
            </div>
          </div>
          <div class="mt-3 pt-2 border-t border-slate-100">
            <button class="btn-card-add w-full py-2.5 bg-sky-700 hover:bg-sky-600 active:bg-sky-800 text-white text-xs font-black rounded-xl touch-press uppercase tracking-wider text-center shadow-xs">
              + ADD
            </button>
          </div>
        </div>
      `;

      // Clicking anywhere on the entire card or the + ADD button opens the customization modal!
      card.addEventListener('click', () => {
        openCustomizationModal(item, 'add');
      });

      menuProductGrid.appendChild(card);
    });
  }

  // --- OPEN CUSTOMIZATION MODAL (FOR NEW ITEM OR EDITING AN EXISTING LINE) ---
  function openCustomizationModal(item, mode = 'add', editIndex = -1) {
    modalMode = mode;
    activeEditingIndex = editIndex;
    activeCustomizingItem = item;

    let ingredients = [];
    try {
      ingredients = JSON.parse(item.base_ingredients_json);
    } catch (e) {
      console.error(e);
    }

    activeCustomizingRecipe = {};
    if (mode === 'edit' && editIndex >= 0 && cart[editIndex]) {
      activeCustomizingRecipe = { ...cart[editIndex].recipe };
    } else {
      ingredients.forEach((ing) => {
        activeCustomizingRecipe[ing.id] = ing.included;
      });
    }

    if (custItemName) custItemName.textContent = item.name.toUpperCase();
    if (custModalBadge) {
      custModalBadge.textContent = mode === 'edit' ? '[ EDIT ORDERED RECIPE ]' : '[ CUSTOMIZE RECIPE ]';
    }
    if (custBtnConfirm) {
      custBtnConfirm.textContent = mode === 'edit' ? 'UPDATE ORDER' : 'ADD ORDER';
    }

    function calculateModalPrice() {
      let modTotal = 0;
      const modSummary = [];

      ingredients.forEach((ing) => {
        const isChecked = !!activeCustomizingRecipe[ing.id];
        if (ing.price_delta > 0 && isChecked) {
          modTotal += ing.price_delta;
          modSummary.push(`+ ${ing.name} (${formatCentavos(ing.price_delta)})`);
        } else if (!ing.required && !isChecked && ing.included) {
          modSummary.push(`No ${ing.name}`);
        }
      });

      const currentUnit = item.price + modTotal;
      if (custUnitPrice) custUnitPrice.textContent = formatCentavos(currentUnit);

      return { modTotal, currentUnit, modSummary };
    }

    // Render Checklist in Modal
    if (custIngredientsList) {
      custIngredientsList.innerHTML = '';

      ingredients.forEach((ing) => {
        const label = document.createElement('label');
        label.className = 'flex items-center justify-between p-3 border-2 border-slate-200 bg-white hover:bg-sky-50 active:bg-sky-100 rounded-2xl cursor-pointer select-none touch-press transition-colors shadow-2xs';

        const priceBadge = ing.price_delta > 0
          ? `<span class="text-xs font-black font-mono text-sky-900 bg-amber-200 border border-amber-300 px-2 py-0.5 rounded-lg">+${formatCentavos(ing.price_delta)}</span>`
          : (ing.required ? '<span class="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">[ REQUIRED ]</span>' : '');

        label.innerHTML = `
          <div class="flex items-center gap-3">
            <input type="checkbox" ${activeCustomizingRecipe[ing.id] ? 'checked' : ''} ${ing.required ? 'disabled' : ''} class="w-5 h-5 border-2 border-sky-600 rounded-lg text-sky-600 focus:ring-0 cursor-pointer accent-sky-600">
            <span class="text-xs font-black uppercase text-slate-800">${ing.name}</span>
          </div>
          ${priceBadge}
        `;

        const checkbox = label.querySelector('input');
        checkbox.addEventListener('change', () => {
          activeCustomizingRecipe[ing.id] = checkbox.checked;
          calculateModalPrice();
        });

        custIngredientsList.appendChild(label);
      });
    }

    calculateModalPrice();
    modalCustomization.classList.remove('hidden');
  }

  // Close Customization Modal
  if (custBtnCancel) {
    custBtnCancel.addEventListener('click', () => {
      modalCustomization.classList.add('hidden');
      activeCustomizingItem = null;
    });
  }

  // Confirm Customization (Add New or Update Existing Line)
  if (custBtnConfirm) {
    custBtnConfirm.addEventListener('click', () => {
      if (!activeCustomizingItem) return;

      let ingredients = [];
      try {
        ingredients = JSON.parse(activeCustomizingItem.base_ingredients_json);
      } catch (e) {}

      let modTotal = 0;
      const modSummary = [];

      ingredients.forEach((ing) => {
        const isChecked = !!activeCustomizingRecipe[ing.id];
        if (ing.price_delta > 0 && isChecked) {
          modTotal += ing.price_delta;
          modSummary.push(`+ ${ing.name}`);
        } else if (!ing.required && !isChecked && ing.included) {
          modSummary.push(`No ${ing.name}`);
        }
      });

      const unitPrice = activeCustomizingItem.price + modTotal;

      if (modalMode === 'edit' && activeEditingIndex >= 0 && cart[activeEditingIndex]) {
        // Update existing line
        cart[activeEditingIndex].recipe = activeCustomizingRecipe;
        cart[activeEditingIndex].modifiersTotal = modTotal;
        cart[activeEditingIndex].unitPrice = unitPrice;
        cart[activeEditingIndex].modifiersSummary = modSummary;
      } else {
        // Add new item
        const recipeKey = JSON.stringify(activeCustomizingRecipe);
        const existing = cart.find(
          (c) => c.menuItemId === activeCustomizingItem.id && JSON.stringify(c.recipe) === recipeKey
        );

        if (existing) {
          existing.quantity += 1;
        } else {
          cart.push({
            cartItemId: 'item_' + Math.random().toString(36).substr(2, 9),
            menuItemId: activeCustomizingItem.id,
            name: activeCustomizingItem.name,
            quantity: 1,
            unitPrice: unitPrice,
            modifiersTotal: modTotal,
            recipe: activeCustomizingRecipe,
            modifiersSummary: modSummary
          });
        }
      }

      modalCustomization.classList.add('hidden');
      activeCustomizingItem = null;

      calculateTotals();
      renderSummaryList();
    });
  }

  // --- EXPANDABLE BOTTOM TRAY TOGGLE ---
  function toggleTray(forceExpand) {
    if (typeof forceExpand === 'boolean') {
      isTrayExpanded = forceExpand;
    } else {
      isTrayExpanded = !isTrayExpanded;
    }

    if (isTrayExpanded) {
      trayContentBody.classList.remove('hidden');
      trayToggleIcon.textContent = '▼';
    } else {
      trayContentBody.classList.add('hidden');
      trayToggleIcon.textContent = '▲';
    }
  }

  if (trayHandleBar) {
    trayHandleBar.addEventListener('click', () => {
      toggleTray();
    });
  }

  if (btnToggleTray) {
    btnToggleTray.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTray();
    });
  }

  // --- CART / ORDER SUMMARY FINANCIAL ARITHMETIC ---
  function calculateTotals() {
    let subtotal = 0;
    for (const item of cart) {
      subtotal += item.unitPrice * item.quantity;
    }
    const vat = Math.round(subtotal * 0.12);
    const grandTotal = subtotal + vat;
    const count = cart.reduce((sum, i) => sum + i.quantity, 0);

    // Update UI
    if (totalSubtotal) totalSubtotal.textContent = formatCentavos(subtotal);
    if (totalVat) totalVat.textContent = formatCentavos(vat);
    if (totalGrand) totalGrand.textContent = formatCentavos(grandTotal);
    if (trayQuickTotal) trayQuickTotal.textContent = formatCentavos(grandTotal);
    if (headerItemsCount) headerItemsCount.textContent = count;
    if (traySummaryCount) traySummaryCount.textContent = count;
    if (btnProceedCheckout) btnProceedCheckout.disabled = cart.length === 0;

    return { subtotal, vat, grandTotal, count };
  }

  // --- RENDER ORDER SUMMARY LIST (CLICK A LINE TO CUSTOMIZE IT) ---
  function renderSummaryList() {
    if (!summaryItemsList) return;
    summaryItemsList.innerHTML = '';

    if (cart.length === 0) {
      summaryItemsList.innerHTML = `
        <div class="text-center py-6 text-xs text-slate-400 font-bold uppercase">
          [ NO ITEMS ADDED YET - TAP ANY ITEM ABOVE ]
        </div>
      `;
      return;
    }

    cart.forEach((cartItem, idx) => {
      const row = document.createElement('div');
      row.className = 'p-3 border-2 border-slate-200 bg-white hover:border-sky-300 rounded-2xl flex items-center justify-between text-xs cursor-pointer select-none transition-colors shadow-2xs group';

      const modHtml = cartItem.modifiersSummary && cartItem.modifiersSummary.length > 0
        ? `<div class="text-[10px] text-sky-800 mt-0.5 font-bold font-mono">${cartItem.modifiersSummary.join(', ')}</div>`
        : '';

      row.innerHTML = `
        <div class="flex-1 pr-3 row-clickable">
          <div class="font-black text-slate-900 uppercase flex items-center gap-1.5">
            <span>${cartItem.name}</span>
            <span class="text-[10px] font-bold text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity underline">
              [ Tap line to edit ]
            </span>
          </div>
          <div class="text-[10px] font-mono font-bold text-slate-500">${formatCentavos(cartItem.unitPrice)} each</div>
          ${modHtml}
        </div>

        <div class="flex items-center gap-3 shrink-0" onclick="event.stopPropagation()">
          <div class="flex items-center border-2 border-slate-300 rounded-xl bg-slate-50 overflow-hidden shadow-2xs">
            <button class="btn-dec px-3 py-1.5 font-black text-slate-800 touch-press hover:bg-slate-200 active:bg-slate-300 text-xs">-</button>
            <span class="px-2.5 font-black font-mono text-xs text-slate-900">${cartItem.quantity}</span>
            <button class="btn-inc px-3 py-1.5 font-black text-slate-800 touch-press hover:bg-slate-200 active:bg-slate-300 text-xs">+</button>
          </div>
          <div class="w-16 text-right font-black font-mono text-xs text-sky-900">
            ${formatCentavos(cartItem.unitPrice * cartItem.quantity)}
          </div>
          <button class="btn-del text-red-500 hover:text-red-700 font-bold px-2 py-1 hover:bg-red-50 rounded-lg touch-press">[X]</button>
        </div>
      `;

      row.querySelector('.row-clickable').addEventListener('click', () => {
        const matchedMenuItem = menuItems.find((m) => m.id === cartItem.menuItemId);
        if (matchedMenuItem) {
          openCustomizationModal(matchedMenuItem, 'edit', idx);
        }
      });

      row.querySelector('.btn-dec').addEventListener('click', (e) => {
        e.stopPropagation();
        if (cartItem.quantity > 1) {
          cartItem.quantity -= 1;
        } else {
          cart.splice(idx, 1);
        }
        calculateTotals();
        renderSummaryList();
      });

      row.querySelector('.btn-inc').addEventListener('click', (e) => {
        e.stopPropagation();
        cartItem.quantity += 1;
        calculateTotals();
        renderSummaryList();
      });

      row.querySelector('.btn-del').addEventListener('click', (e) => {
        e.stopPropagation();
        cart.splice(idx, 1);
        calculateTotals();
        renderSummaryList();
      });

      summaryItemsList.appendChild(row);
    });
  }

  // --- WELCOME POSTER: TAP ANYWHERE TO START ---
  if (screenWelcome) {
    screenWelcome.addEventListener('click', () => {
      showScreen(screenDining);
    });
  }

  if (optDineIn) {
    optDineIn.addEventListener('click', (e) => {
      e.stopPropagation();
      diningMode = 'dine-in';
      if (menuDiningTag) menuDiningTag.textContent = 'DINE IN';
      showScreen(screenMenu);
    });
  }

  if (optTakeOut) {
    optTakeOut.addEventListener('click', (e) => {
      e.stopPropagation();
      diningMode = 'take-out';
      if (menuDiningTag) menuDiningTag.textContent = 'TAKE OUT';
      showScreen(screenMenu);
    });
  }

  if (btnDiningCancel) {
    btnDiningCancel.addEventListener('click', (e) => {
      e.stopPropagation();
      showScreen(screenWelcome);
    });
  }

  if (btnMenuBack) {
    btnMenuBack.addEventListener('click', () => {
      if (confirm('Start over and reset current order?')) {
        cart = [];
        calculateTotals();
        renderSummaryList();
        toggleTray(false);
        showScreen(screenWelcome);
      }
    });
  }

  // --- CHECKOUT & COUNTER PAYMENT EXECUTION ---
  if (btnProceedCheckout) {
    btnProceedCheckout.addEventListener('click', async () => {
      if (cart.length === 0) return;

      const { subtotal, vat, grandTotal } = calculateTotals();

      try {
        // 1. Commit Order to SQLite with 'pay-at-counter'
        const orderDTO = {
          diningMode: diningMode,
          paymentMethod: 'cashier-counter',
          subtotal: subtotal,
          vat: vat,
          totalAmount: grandTotal,
          items: cart
        };

        console.log('[Kiosk] Registering order in SQLite for cashier counter payment...');
        const createdOrder = await window.kioskAPI.createOrder(orderDTO);
        currentOrderResult = createdOrder;

        // 2. Auto-Print Thermal Receipt for the Cashier
        console.log('[Kiosk] Auto-printing cashier confirmation receipt...');
        const printResult = await window.kioskAPI.printReceipt({
          orderId: createdOrder.id,
          orderNumber: createdOrder.orderNumber,
          diningMode: createdOrder.diningMode,
          paymentMethod: 'PAY AT CASHIER COUNTER',
          subtotal: createdOrder.subtotal,
          vat: createdOrder.vat,
          totalAmount: createdOrder.totalAmount,
          items: cart,
          createdAt: createdOrder.createdAt,
          storeName: 'EXPRESS ORDER KIOSK',
          kioskId: 'COUNTER PAYMENT SLIP'
        });

        lastReceiptText = printResult.receiptText;

        // 3. Update Confirmation Screen
        const dateFormatted = new Date(createdOrder.createdAt).toLocaleString('en-US');
        if (confirmTimestamp) confirmTimestamp.textContent = dateFormatted;
        if (confirmOrderNumber) confirmOrderNumber.textContent = '#' + String(createdOrder.orderNumber).padStart(3, '0');
        if (confirmDiningMode) confirmDiningMode.textContent = createdOrder.diningMode.toUpperCase().replace('-', ' ');

        // 4. Generate and Display Barcode for Cashier Scan
        const barcodeCode = `ORD-${String(createdOrder.orderNumber).padStart(3, '0')}-${createdOrder.id.substring(0, 8).toUpperCase()}`;
        if (barcodeContainer) barcodeContainer.innerHTML = generateBarcodeSVG(barcodeCode, 260, 60);
        if (barcodeLabel) barcodeLabel.textContent = barcodeCode;

        // 5. Show Confirmation Screen with instructions (Receipt prints physically at the kiosk)
        showScreen(screenConfirmed);

        // Start 5-second countdown directly on confirmation screen
        let secondsLeft = 5;
        if (confirmTimer) confirmTimer.textContent = `Returning to start in ${secondsLeft}s...`;
        if (receiptTimerInterval) clearInterval(receiptTimerInterval);
        receiptTimerInterval = setInterval(() => {
          secondsLeft--;
          if (confirmTimer) confirmTimer.textContent = `Returning to start in ${secondsLeft}s...`;
          if (secondsLeft <= 0) {
            clearInterval(receiptTimerInterval);
            showScreen(screenWelcome);
          }
        }, 1000);

        // 6. Reset Cart for Next Customer
        cart = [];
        calculateTotals();
        renderSummaryList();
        toggleTray(false);

        nextOrderNumber = await window.kioskAPI.getNextOrderNumber();
        const nextStr = '#' + String(nextOrderNumber).padStart(3, '0');
        if (menuOrderNum) menuOrderNum.textContent = nextStr;

      } catch (err) {
        console.error('[Kiosk] Checkout Error:', err);
        alert('Order Error: ' + err.message);
      }
    });
  }

  if (btnFinishOrder) {
    btnFinishOrder.addEventListener('click', () => {
      if (receiptTimerInterval) clearInterval(receiptTimerInterval);
      showScreen(screenWelcome);
    });
  }

  // Boot Kiosk Catalog Data
  loadInitialData();
});
