/**
 * 3L's Beach Resort — Main Kiosk Application Controller
 * ES Module Architecture for fast touchscreen interaction.
 */

import { store } from './state.js';
import { switchScreen } from './screens.js';
import { RESORT_CATEGORIES, RESORT_CATALOG, RESORT_SERVICES } from './catalog.js';
import { formatCentavos, formatOrderNumber, formatDateTime } from './formatters.js';
import { calculateCartTotals } from './cart.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log("[3L's Beach Resort] Initializing touchscreen kiosk application shell...");

  // --- CACHED DOM ELEMENTS ---
  const screenWelcome = document.getElementById('screen-welcome');
  const btnWelcomeStart = document.getElementById('btn-welcome-start');
  const btnServiceBack = document.getElementById('btn-service-back');
  const serviceFoodDrinks = document.getElementById('service-food-drinks');
  const serviceActivities = document.getElementById('service-resort-activities');
  const headerServiceTag = document.getElementById('header-service-tag');
  const catalogOrderBadge = document.getElementById('catalog-order-badge');
  const langEn = document.getElementById('lang-en');
  const langFil = document.getElementById('lang-fil');

  const categoryContainer = document.getElementById('category-container');
  const categoryActiveIcon = document.getElementById('category-active-icon');
  const categoryActiveTitle = document.getElementById('category-active-title');
  const productGrid = document.getElementById('product-grid');

  const cartFooterPreview = document.getElementById('cart-footer-preview');
  const cartTrayDrawer = document.getElementById('cart-tray-drawer');
  const cartDrawerItems = document.getElementById('cart-drawer-items');
  const footerItemBadge = document.getElementById('footer-item-badge');
  const footerCartSummaryText = document.getElementById('footer-cart-summary-text');
  const footerCartTotal = document.getElementById('footer-cart-total');
  const btnCheckout = document.getElementById('btn-checkout');
  const btnClearCart = document.getElementById('btn-clear-cart');

  const modalCustomization = document.getElementById('modal-customization');
  const modalItemEmoji = document.getElementById('modal-item-emoji');
  const modalItemName = document.getElementById('modal-item-name');
  const modalItemPrice = document.getElementById('modal-item-price');
  const modalModifiersList = document.getElementById('modal-modifiers-list');
  const modalBtnCancel = document.getElementById('modal-btn-cancel');
  const modalBtnApply = document.getElementById('modal-btn-apply');

  const confirmedTimestamp = document.getElementById('confirmed-timestamp');
  const confirmedOrderNumber = document.getElementById('confirmed-order-number');
  const confirmedServiceBadge = document.getElementById('confirmed-service-badge');
  const confirmedTimer = document.getElementById('confirmed-timer');
  const btnFinishOrder = document.getElementById('btn-finish-order');

  let activeCustomizingItem = null;
  let activeModifierState = [];
  let confirmedTimerInterval = null;

  // --- INITIALIZE ORDER SEQUENCE FROM ELECTRON IPC OR LOCAL ---
  async function initOrderSequence() {
    try {
      if (window.kioskAPI && window.kioskAPI.getNextOrderNumber) {
        const num = await window.kioskAPI.getNextOrderNumber();
        store.setOrderNumber(num);
      }
    } catch (err) {
      console.warn('[Kiosk] Local fallback sequence used:', err);
    }
  }

  // --- RENDER FUNCTIONS ---
  function renderHeader() {
    const { orderNumber, serviceType, language } = store.getState();
    if (catalogOrderBadge) catalogOrderBadge.textContent = `#${String(orderNumber).padStart(3, '0')}`;
    if (headerServiceTag) {
      const s = RESORT_SERVICES.find((srv) => srv.id === serviceType);
      headerServiceTag.textContent = s ? s.title : 'Food & Drinks';
    }

    if (langEn && langFil) {
      if (language === 'EN') {
        langEn.className = 'join-item px-3 py-1 text-xs font-black rounded-lg bg-white text-secondary shadow-xs';
        langFil.className = 'join-item px-3 py-1 text-xs font-black rounded-lg text-white/80 hover:text-white';
      } else {
        langFil.className = 'join-item px-3 py-1 text-xs font-black rounded-lg bg-white text-secondary shadow-xs';
        langEn.className = 'join-item px-3 py-1 text-xs font-black rounded-lg text-white/80 hover:text-white';
      }
    }
  }

  function renderCategories() {
    if (!categoryContainer) return;
    categoryContainer.innerHTML = '';
    const { activeCategory } = store.getState();

    RESORT_CATEGORIES.forEach((cat) => {
      const isActive = cat.id === activeCategory;
      const btn = document.createElement('button');
      btn.className = `w-full p-2.5 rounded-2xl flex flex-col items-center justify-center text-center touch-press transition-all border-2 ${
        isActive
          ? 'bg-secondary text-white border-secondary shadow-md font-black'
          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-bold'
      }`;
      btn.innerHTML = `
        <span class="text-2xl mb-1">${cat.icon}</span>
        <span class="text-[11px] leading-tight">${cat.label}</span>
      `;
      btn.addEventListener('click', () => {
        store.setCategory(cat.id);
      });
      categoryContainer.appendChild(btn);
    });

    const currentCat = RESORT_CATEGORIES.find((c) => c.id === activeCategory);
    if (currentCat) {
      if (categoryActiveIcon) categoryActiveIcon.textContent = currentCat.icon;
      if (categoryActiveTitle) categoryActiveTitle.textContent = currentCat.label;
    }
  }

  function renderProductGrid() {
    if (!productGrid) return;
    productGrid.innerHTML = '';
    const { activeCategory } = store.getState();

    const items = RESORT_CATALOG.filter((i) => i.category === activeCategory);

    items.forEach((item) => {
      const card = document.createElement('div');
      card.className =
        'bg-white rounded-2xl border-2 border-slate-200/80 p-3 flex flex-col justify-between shadow-xs hover:border-secondary/40 transition-all touch-press group';

      card.innerHTML = `
        <div>
          <div class="w-full aspect-square rounded-xl bg-gradient-to-tr from-sky-50 to-amber-50 flex items-center justify-center text-4xl mb-2.5 border border-slate-100 group-hover:scale-105 transition-transform">
            ${item.emoji}
          </div>
          <h3 class="text-xs font-black text-neutral uppercase line-clamp-2 leading-tight">${item.name}</h3>
          <p class="text-[10px] text-slate-500 line-clamp-2 mt-0.5">${item.description}</p>
        </div>

        <div class="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
          <span class="text-sm font-black text-amber-600 font-mono tracking-tight">
            ${formatCentavos(item.price)}
          </span>
          <div class="flex items-center gap-1">
            ${
              item.customizable
                ? `<button data-action="customize" class="px-2 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-[10px] font-black text-slate-700 touch-press uppercase">
                    OPT
                   </button>`
                : ''
            }
            <button data-action="add" class="w-8 h-8 rounded-xl bg-primary text-primary-content font-black text-sm flex items-center justify-center shadow-xs touch-press hover:bg-amber-400">
              +
            </button>
          </div>
        </div>
      `;

      // Event listeners for Card actions
      const btnAdd = card.querySelector('[data-action="add"]');
      if (btnAdd) {
        btnAdd.addEventListener('click', (e) => {
          e.stopPropagation();
          store.addToCart(item);
        });
      }

      const btnCustomize = card.querySelector('[data-action="customize"]');
      if (btnCustomize) {
        btnCustomize.addEventListener('click', (e) => {
          e.stopPropagation();
          openCustomizationModal(item);
        });
      }

      // Card tap opens customize if customizable, else adds directly
      card.addEventListener('click', () => {
        if (item.customizable) {
          openCustomizationModal(item);
        } else {
          store.addToCart(item);
        }
      });

      productGrid.appendChild(card);
    });
  }

  function renderCartFooter() {
    const { cart } = store.getState();
    const totals = calculateCartTotals(cart);

    if (footerItemBadge) footerItemBadge.textContent = String(totals.count);
    if (footerCartTotal) footerCartTotal.textContent = formatCentavos(totals.grandTotal);

    if (btnCheckout) {
      btnCheckout.disabled = totals.count === 0;
    }

    if (footerCartSummaryText) {
      if (cart.length === 0) {
        footerCartSummaryText.textContent = 'Your cart is empty';
      } else {
        const summary = cart.map((c) => `${c.emoji} ${c.quantity}`).join('  ');
        footerCartSummaryText.textContent = summary;
      }
    }

    // Render Drawer Items if open
    if (cartDrawerItems) {
      cartDrawerItems.innerHTML = '';
      if (cart.length === 0) {
        cartDrawerItems.innerHTML =
          '<div class="text-center py-4 text-xs font-bold text-slate-400 uppercase">NO ITEMS ADDED YET</div>';
      } else {
        cart.forEach((c) => {
          const row = document.createElement('div');
          row.className = 'flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200';
          row.innerHTML = `
            <div class="flex items-center gap-2">
              <span class="text-xl">${c.emoji}</span>
              <div>
                <div class="text-xs font-black text-neutral">${c.name}</div>
                <div class="text-[10px] text-slate-500 font-mono">${formatCentavos(c.unitPrice)} each</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button data-action="dec" class="w-7 h-7 rounded-lg bg-white border border-slate-300 text-xs font-black touch-press">-</button>
              <span class="text-xs font-black font-mono w-4 text-center">${c.quantity}</span>
              <button data-action="inc" class="w-7 h-7 rounded-lg bg-white border border-slate-300 text-xs font-black touch-press">+</button>
              <button data-action="del" class="w-7 h-7 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-black touch-press">✕</button>
            </div>
          `;

          row.querySelector('[data-action="inc"]').addEventListener('click', () => {
            store.updateCartQuantity(c.cartItemId, 1);
          });
          row.querySelector('[data-action="dec"]').addEventListener('click', () => {
            store.updateCartQuantity(c.cartItemId, -1);
          });
          row.querySelector('[data-action="del"]').addEventListener('click', () => {
            store.removeFromCart(c.cartItemId);
          });

          cartDrawerItems.appendChild(row);
        });
      }
    }
  }

  // --- CUSTOMIZATION MODAL CONTROLLER ---
  function openCustomizationModal(item) {
    activeCustomizingItem = item;
    activeModifierState = (item.modifiers || []).map((m) => ({
      ...m,
      selected: !!m.included
    }));

    if (modalItemEmoji) modalItemEmoji.textContent = item.emoji;
    if (modalItemName) modalItemName.textContent = item.name;

    updateModalPricePreview();
    renderModalModifiers();

    if (modalCustomization) modalCustomization.classList.remove('hidden');
  }

  function renderModalModifiers() {
    if (!modalModifiersList) return;
    modalModifiersList.innerHTML = '';

    activeModifierState.forEach((mod, idx) => {
      const row = document.createElement('label');
      row.className = `flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer select-none touch-press transition-all ${
        mod.selected ? 'bg-amber-50/60 border-primary' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
      }`;

      const deltaBadge =
        mod.priceDelta > 0
          ? `<span class="text-xs font-black font-mono text-amber-700">+${formatCentavos(mod.priceDelta)}</span>`
          : '<span class="text-[10px] font-bold text-slate-400 uppercase">INCLUDED</span>';

      row.innerHTML = `
        <div class="flex items-center gap-3">
          <input type="checkbox" ${mod.selected ? 'checked' : ''} class="checkbox checkbox-primary checkbox-sm rounded-md" />
          <span class="text-xs font-bold text-neutral">${mod.name}</span>
        </div>
        ${deltaBadge}
      `;

      const input = row.querySelector('input');
      input.addEventListener('change', () => {
        activeModifierState[idx].selected = input.checked;
        updateModalPricePreview();
        renderModalModifiers();
      });

      modalModifiersList.appendChild(row);
    });
  }

  function updateModalPricePreview() {
    if (!activeCustomizingItem || !modalItemPrice) return;
    const extra = activeModifierState.reduce((sum, m) => (m.selected && m.priceDelta > 0 ? sum + m.priceDelta : sum), 0);
    modalItemPrice.textContent = formatCentavos(activeCustomizingItem.price + extra);
  }

  function closeModal() {
    if (modalCustomization) modalCustomization.classList.add('hidden');
    activeCustomizingItem = null;
    activeModifierState = [];
  }

  if (modalBtnCancel) modalBtnCancel.addEventListener('click', closeModal);
  if (modalBtnApply) {
    modalBtnApply.addEventListener('click', () => {
      if (!activeCustomizingItem) return;
      store.addToCart(activeCustomizingItem, activeModifierState, 1);
      closeModal();
    });
  }

  // --- CONFIRMATION SCREEN ---
  function showConfirmationScreen() {
    const { orderNumber, serviceType } = store.getState();
    if (confirmedOrderNumber) confirmedOrderNumber.textContent = `#${String(orderNumber).padStart(3, '0')}`;
    if (confirmedTimestamp) confirmedTimestamp.textContent = formatDateTime();
    if (confirmedServiceBadge) {
      const s = RESORT_SERVICES.find((srv) => srv.id === serviceType);
      confirmedServiceBadge.textContent = s ? s.title : 'RESORT ORDER';
    }

    let countdown = 8;
    if (confirmedTimer) confirmedTimer.textContent = `Returning to welcome screen in ${countdown}s...`;

    if (confirmedTimerInterval) clearInterval(confirmedTimerInterval);
    confirmedTimerInterval = setInterval(() => {
      countdown -= 1;
      if (confirmedTimer) confirmedTimer.textContent = `Returning to welcome screen in ${countdown}s...`;
      if (countdown <= 0) {
        clearInterval(confirmedTimerInterval);
        finishAndReset();
      }
    }, 1000);

    store.setScreen('confirmed');
  }

  function finishAndReset() {
    if (confirmedTimerInterval) clearInterval(confirmedTimerInterval);
    store.resetOrder();
    initOrderSequence();
  }

  if (btnFinishOrder) btnFinishOrder.addEventListener('click', finishAndReset);

  // --- BIND TOP & GLOBAL ACTIONS ---
  if (btnWelcomeStart) {
    btnWelcomeStart.addEventListener('click', () => {
      store.setScreen('service-option');
    });
  }
  if (screenWelcome) {
    screenWelcome.addEventListener('click', (e) => {
      // Tap anywhere on welcome screen progresses
      if (e.target.closest('#btn-welcome-start') || e.currentTarget === e.target) {
        store.setScreen('service-option');
      }
    });
  }

  if (btnServiceBack) {
    btnServiceBack.addEventListener('click', () => {
      store.setScreen('welcome');
    });
  }

  if (serviceFoodDrinks) {
    serviceFoodDrinks.addEventListener('click', () => {
      store.setServiceType('food-drinks');
      store.setScreen('catalog');
    });
  }
  if (serviceActivities) {
    serviceActivities.addEventListener('click', () => {
      store.setServiceType('resort-activities');
      store.setScreen('catalog');
    });
  }

  if (langEn) langEn.addEventListener('click', () => store.setLanguage('EN'));
  if (langFil) langFil.addEventListener('click', () => store.setLanguage('FIL'));

  if (cartFooterPreview) {
    cartFooterPreview.addEventListener('click', () => {
      if (cartTrayDrawer) cartTrayDrawer.classList.toggle('hidden');
    });
  }

  if (btnClearCart) {
    btnClearCart.addEventListener('click', () => {
      store.clearCart();
    });
  }

  if (btnCheckout) {
    btnCheckout.addEventListener('click', () => {
      const { cart } = store.getState();
      if (cart.length > 0) {
        showConfirmationScreen();
      }
    });
  }

  // --- STATE SUBSCRIPTION (Observer pattern) ---
  store.subscribe((state, changedKeys) => {
    if (changedKeys.includes('screen')) {
      switchScreen(state.screen);
    }
    if (changedKeys.includes('serviceType') || changedKeys.includes('orderNumber') || changedKeys.includes('language')) {
      renderHeader();
    }
    if (changedKeys.includes('activeCategory')) {
      renderCategories();
      renderProductGrid();
    }
    if (changedKeys.includes('cart')) {
      renderCartFooter();
    }
  });

  // --- INITIAL BOOT ---
  await initOrderSequence();
  renderHeader();
  renderCategories();
  renderProductGrid();
  renderCartFooter();
  switchScreen(store.getState().screen);

  console.log("[3L's Beach Resort] Kiosk shell successfully initialized.");
});
