// 3L's Beach Resort — Production-Grade Touchscreen Kiosk Controller (DaisyUI & Vanilla ES Modules)

// Pure SVG Barcode Generator Utility
function generateBarcodeSVG(codeText, width = 280, height = 65) {
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
      rects += `<rect x="${x}" y="0" width="${barWidth.toFixed(2)}" height="${height}" fill="#0F172A" />`;
    }
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="block">
      <rect width="${width}" height="${height}" fill="#FFFFFF"/>
      ${rects}
    </svg>
  `;
}

// Format integer centavos to Philippine Peso (e.g. 8900 -> ₱89.00)
function formatCentavos(centavos) {
  return '₱' + (centavos / 100).toFixed(2);
}

// Category Metadata Dictionary
const CATEGORY_META = {
  all: { icon: '🏝️', labelEn: 'All Items', labelFil: 'Lahat' },
  refreshments: { icon: '🍹', labelEn: 'Refreshments', labelFil: 'Mga Inumin' },
  meals: { icon: '🍽️', labelEn: 'Beach Meals', labelFil: 'Mga Pagkain' },
  snacks: { icon: '🍟', labelEn: 'Beach Snacks', labelFil: 'Merienda' },
  activities: { icon: '🤿', labelEn: 'Resort Gear', labelFil: 'Mga Gamit & Activities' }
};

document.addEventListener('DOMContentLoaded', async () => {
  console.log("[3L's Beach Resort] Initializing touchscreen kiosk controller...");

  // --- APPLICATION STATE ---
  let diningMode = 'food-drinks'; // 'food-drinks' | 'resort-activities'
  let activeCategory = 'all';
  let categories = [];
  let menuItems = [];
  let cart = []; // Array of ordered items
  let nextOrderNumber = 42;
  let isTrayExpanded = false;
  let currentLanguage = 'EN'; // 'EN' | 'FIL'

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
  const currentCategoryLabel = document.getElementById('current-category-label');
  const categoryButtonContainer = document.getElementById('category-button-container');
  const menuProductGrid = document.getElementById('menu-product-grid');

  const langEn = document.getElementById('lang-en');
  const langFil = document.getElementById('lang-fil');

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
      if (s) {
        s.classList.add('hidden');
        s.classList.remove('active');
      }
    });
    if (screen) {
      screen.classList.remove('hidden');
      screen.classList.add('active');
    }
  }

  // --- LANGUAGE SWITCHER ---
  function setLanguage(lang) {
    currentLanguage = lang;
    if (langEn && langFil) {
      if (lang === 'EN') {
        langEn.className = 'px-2 py-0.5 text-[10px] font-black rounded bg-amber-400 text-slate-950';
        langFil.className = 'px-2 py-0.5 text-[10px] font-black rounded text-sky-300 hover:text-white';
      } else {
        langFil.className = 'px-2 py-0.5 text-[10px] font-black rounded bg-amber-400 text-slate-950';
        langEn.className = 'px-2 py-0.5 text-[10px] font-black rounded text-sky-300 hover:text-white';
      }
    }
    renderCategories();
    renderMenuItems();
  }

  if (langEn) langEn.addEventListener('click', () => setLanguage('EN'));
  if (langFil) langFil.addEventListener('click', () => setLanguage('FIL'));

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

  // --- RENDER CATEGORIES SIDEBAR (DAISYUI TABS) ---
  function renderCategories() {
    if (!categoryButtonContainer) return;
    categoryButtonContainer.innerHTML = '';

    const allCats = ['all', ...categories];

    allCats.forEach((cat) => {
      const meta = CATEGORY_META[cat.toLowerCase()] || { icon: '🌴', labelEn: cat, labelFil: cat };
      const label = currentLanguage === 'FIL' ? meta.labelFil : meta.labelEn;
      const isActive = cat.toLowerCase() === activeCategory.toLowerCase();

      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = `w-full py-3 px-2.5 rounded-xl text-left text-xs font-black uppercase touch-press transition-all flex items-center gap-2 shadow-xs ${
        isActive
          ? 'bg-sky-900 text-amber-300 shadow-md border-2 border-amber-400'
          : 'bg-white hover:bg-sky-100 text-slate-700 border border-sky-200'
      }`;

      btn.innerHTML = `
        <span class="text-base">${meta.icon}</span>
        <span class="leading-tight flex-1 line-clamp-2">${label}</span>
      `;

      btn.addEventListener('click', () => {
        activeCategory = cat;
        if (currentCategoryLabel) {
          currentCategoryLabel.textContent = `${meta.icon} ${label.toUpperCase()}`;
        }
        renderCategories();
        renderMenuItems();
      });

      li.appendChild(btn);
      categoryButtonContainer.appendChild(li);
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
      const meta = CATEGORY_META[item.category.toLowerCase()] || { icon: '🌴', labelEn: item.category };
      const card = document.createElement('div');
      card.className = 'bg-white rounded-2xl border-2 border-sky-200 p-2.5 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-sky-400 cursor-pointer touch-press transition-all group relative overflow-hidden';

      const photoBanner = `
        <div class="w-full aspect-square rounded-xl bg-gradient-to-br from-sky-100 via-sky-50 to-amber-50 border border-sky-100 flex flex-col items-center justify-center text-center p-2 mb-2 group-hover:bg-sky-100 transition-colors relative">
          <span class="text-3xl filter drop-shadow-xs">${meta.icon}</span>
          <span class="text-[9px] font-black text-sky-800 uppercase tracking-widest mt-1">${item.category}</span>
          <div class="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[8px] font-bold">
            READY
          </div>
        </div>
      `;

      card.innerHTML = `
        ${photoBanner}
        <div class="flex-1 flex flex-col justify-between">
          <div>
            <div class="text-[11px] font-black uppercase text-slate-900 line-clamp-2 leading-tight">${item.name}</div>
            <div class="inline-block mt-1 px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-xs font-mono shadow-xs">
              ${formatCentavos(item.price)}
            </div>
          </div>
          <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span class="text-[9px] text-sky-700 font-bold uppercase underline group-hover:text-sky-900">
              Customize
            </span>
            <button class="btn btn-xs btn-primary text-slate-950 font-black touch-press rounded-lg shadow-xs uppercase">
              + ADD
            </button>
          </div>
        </div>
      `;

      // Clicking anywhere on the entire card opens the customization modal!
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
      custModalBadge.textContent = mode === 'edit'
        ? '[ EDIT ORDERED RECIPE ]'
        : '[ CUSTOMIZE YOUR SELECTION ]';
    }
    if (custBtnConfirm) {
      custBtnConfirm.textContent = mode === 'edit'
        ? (currentLanguage === 'FIL' ? 'I-UPDATE' : 'UPDATE ORDER')
        : (currentLanguage === 'FIL' ? 'IDAGDAG SA ORDER' : 'ADD TO ORDER');
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
        label.className = 'flex items-center justify-between p-3 rounded-xl border-2 border-slate-200 bg-white hover:bg-sky-50 cursor-pointer select-none transition-colors shadow-xs';

        const priceBadge = ing.price_delta > 0
          ? `<span class="text-xs font-black font-mono text-emerald-700">+${formatCentavos(ing.price_delta)}</span>`
          : (ing.required ? '<span class="text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded">[ REQUIRED ]</span>' : '');

        label.innerHTML = `
          <div class="flex items-center gap-3">
            <input type="checkbox" ${activeCustomizingRecipe[ing.id] ? 'checked' : ''} ${ing.required ? 'disabled' : ''} class="checkbox checkbox-primary checkbox-sm rounded-md cursor-pointer">
            <span class="text-xs font-bold uppercase text-slate-800">${ing.name}</span>
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
          [ NO ITEMS ADDED YET — TAP ANY ITEM ABOVE ]
        </div>
      `;
      return;
    }

    cart.forEach((cartItem, idx) => {
      const row = document.createElement('div');
      row.className = 'p-3 rounded-2xl border-2 border-sky-200 bg-white hover:bg-sky-50 flex items-center justify-between text-xs cursor-pointer select-none transition-colors group shadow-xs';

      const modHtml = cartItem.modifiersSummary && cartItem.modifiersSummary.length > 0
        ? `<div class="text-[10px] text-sky-700 mt-0.5 font-mono">${cartItem.modifiersSummary.join(', ')}</div>`
        : '';

      row.innerHTML = `
        <div class="flex-1 pr-3 row-clickable">
          <div class="font-black text-slate-900 uppercase flex items-center gap-1.5">
            <span>${cartItem.name}</span>
            <span class="text-[9px] font-bold text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity underline">
              [ Tap line to edit ]
            </span>
          </div>
          <div class="text-[10px] font-mono text-slate-600">${formatCentavos(cartItem.unitPrice)} each</div>
          ${modHtml}
        </div>

        <div class="flex items-center gap-2.5 shrink-0" onclick="event.stopPropagation()">
          <div class="flex items-center rounded-lg border-2 border-slate-300 bg-slate-50 overflow-hidden">
            <button class="btn-dec px-2.5 py-1 font-black touch-press hover:bg-slate-200 text-slate-800">-</button>
            <span class="px-2 font-bold font-mono text-xs text-slate-900">${cartItem.quantity}</span>
            <button class="btn-inc px-2.5 py-1 font-black touch-press hover:bg-slate-200 text-slate-800">+</button>
          </div>
          <div class="w-16 text-right font-black font-mono text-xs text-emerald-800">
            ${formatCentavos(cartItem.unitPrice * cartItem.quantity)}
          </div>
          <button class="btn-del text-red-500 hover:text-red-700 font-bold px-1.5 touch-press">[✕]</button>
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
      diningMode = 'food-drinks';
      if (menuDiningTag) menuDiningTag.textContent = 'FOOD & DRINKS';
      activeCategory = 'refreshments';
      renderCategories();
      renderMenuItems();
      showScreen(screenMenu);
    });
  }

  if (optTakeOut) {
    optTakeOut.addEventListener('click', (e) => {
      e.stopPropagation();
      diningMode = 'resort-activities';
      if (menuDiningTag) menuDiningTag.textContent = 'ACTIVITIES & GEAR';
      activeCategory = 'activities';
      renderCategories();
      renderMenuItems();
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
        // 1. Commit Order to SQLite with 'cashier-counter'
        const orderDTO = {
          diningMode: diningMode,
          paymentMethod: 'cashier-counter',
          subtotal: subtotal,
          vat: vat,
          totalAmount: grandTotal,
          items: cart
        };

        console.log("[3L's Beach Resort] Registering order in SQLite for cashier counter payment...");
        const createdOrder = await window.kioskAPI.createOrder(orderDTO);
        currentOrderResult = createdOrder;

        // 2. Auto-Print Thermal Receipt for the Cashier
        console.log("[3L's Beach Resort] Auto-printing cashier confirmation receipt...");
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
          storeName: "3L's Beach Resort",
          kioskId: '3LS-BEACH-KIOSK-01'
        });

        lastReceiptText = printResult.receiptText;

        // 3. Update Confirmation Screen
        const dateFormatted = new Date(createdOrder.createdAt).toLocaleString('en-US');
        if (confirmTimestamp) confirmTimestamp.textContent = dateFormatted;
        if (confirmOrderNumber) confirmOrderNumber.textContent = '#' + String(createdOrder.orderNumber).padStart(3, '0');
        if (confirmDiningMode) {
          confirmDiningMode.textContent = createdOrder.diningMode === 'resort-activities'
            ? 'ACTIVITIES & GEAR'
            : 'FOOD & DRINKS';
        }

        // 4. Generate and Display Barcode for Cashier Scan
        const barcodeCode = `ORD-${String(createdOrder.orderNumber).padStart(3, '0')}-${createdOrder.id.substring(0, 8).toUpperCase()}`;
        if (barcodeContainer) barcodeContainer.innerHTML = generateBarcodeSVG(barcodeCode, 280, 60);
        if (barcodeLabel) barcodeLabel.textContent = barcodeCode;

        // 5. Show Confirmation Screen with instructions
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

