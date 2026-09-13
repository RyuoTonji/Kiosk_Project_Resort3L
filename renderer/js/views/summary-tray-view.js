import { formatCentavos } from '../utils/formatters.js';

/**
 * SummaryTrayView (View Layer)
 * Manages the bottom expandable order summary tray, itemized row interactions,
 * quantity steppers, live footer financial totals, and checkout trigger.
 */
export class SummaryTrayView {
  /**
   * @param {Object} options
   * @param {Function} options.onItemEdit - Callback to edit an item recipe
   * @param {Function} options.onIncrement - Callback to increment item quantity
   * @param {Function} options.onDecrement - Callback to decrement item quantity
   * @param {Function} options.onDelete - Callback to remove item
   * @param {Function} options.onCheckout - Callback to proceed to cashier counter payment
   * @param {Function} options.onStartOver - Callback to reset order
   */
  constructor({
    onItemEdit,
    onIncrement,
    onDecrement,
    onDelete,
    onCheckout,
    onStartOver
  }) {
    // Tray DOM references
    this.trayHandleBar = document.getElementById('tray-handle-bar');
    this.btnToggleTray = document.getElementById('btn-toggle-tray');
    this.trayToggleIcon = document.getElementById('tray-toggle-icon');
    this.traySummaryCount = document.getElementById('tray-summary-count');
    this.trayQuickTotal = document.getElementById('tray-quick-total');
    this.trayContentBody = document.getElementById('tray-content-body');
    this.summaryItemsList = document.getElementById('summary-items-list');

    // Header & Footer DOM references
    this.headerItemsCount = document.getElementById('header-items-count');
    this.btnMenuBack = document.getElementById('btn-menu-back');
    this.totalSubtotal = document.getElementById('total-subtotal');
    this.totalVat = document.getElementById('total-vat');
    this.totalGrand = document.getElementById('total-grand');
    this.btnProceedCheckout = document.getElementById('btn-proceed-checkout');

    // Callbacks
    this.onItemEdit = onItemEdit;
    this.onIncrement = onIncrement;
    this.onDecrement = onDecrement;
    this.onDelete = onDelete;
    this.onCheckout = onCheckout;
    this.onStartOver = onStartOver;

    this.isExpanded = false;

    this.bindEvents();
  }

  /**
   * Bind static tray handles and footer buttons.
   */
  bindEvents() {
    if (this.trayHandleBar) {
      this.trayHandleBar.addEventListener('click', () => this.toggleTray());
    }

    if (this.btnToggleTray) {
      this.btnToggleTray.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleTray();
      });
    }

    if (this.btnMenuBack) {
      this.btnMenuBack.addEventListener('click', () => {
        if (typeof this.onStartOver === 'function') {
          this.onStartOver();
        }
      });
    }

    if (this.btnProceedCheckout) {
      this.btnProceedCheckout.addEventListener('click', () => {
        if (typeof this.onCheckout === 'function') {
          this.onCheckout();
        }
      });
    }
  }

  /**
   * Toggle expandable tray state.
   * @param {boolean} [forceState]
   */
  toggleTray(forceState) {
    if (typeof forceState === 'boolean') {
      this.isExpanded = forceState;
    } else {
      this.isExpanded = !this.isExpanded;
    }

    if (this.trayContentBody && this.trayToggleIcon) {
      if (this.isExpanded) {
        this.trayContentBody.classList.remove('hidden');
        this.trayToggleIcon.textContent = '▼';
      } else {
        this.trayContentBody.classList.add('hidden');
        this.trayToggleIcon.textContent = '▲';
      }
    }
  }

  /**
   * Render cart items list inside the expandable tray.
   * @param {Array} items
   */
  renderItems(items) {
    if (!this.summaryItemsList) return;
    this.summaryItemsList.innerHTML = '';

    if (!items || items.length === 0) {
      this.summaryItemsList.innerHTML = `
        <div class="text-center py-6 text-xs text-slate-400 font-bold uppercase">
          [ NO ITEMS ADDED YET - TAP ANY ITEM ABOVE ]
        </div>
      `;
      return;
    }

    items.forEach((cartItem, idx) => {
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
        if (typeof this.onItemEdit === 'function') {
          this.onItemEdit(cartItem, idx);
        }
      });

      row.querySelector('.btn-dec').addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof this.onDecrement === 'function') {
          this.onDecrement(idx);
        }
      });

      row.querySelector('.btn-inc').addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof this.onIncrement === 'function') {
          this.onIncrement(idx);
        }
      });

      row.querySelector('.btn-del').addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof this.onDelete === 'function') {
          this.onDelete(idx);
        }
      });

      this.summaryItemsList.appendChild(row);
    });
  }

  /**
   * Update all header and footer financial metric displays.
   * @param {{ subtotal: number, vat: number, grandTotal: number, count: number }} totals
   */
  updateTotals(totals) {
    if (this.totalSubtotal) this.totalSubtotal.textContent = formatCentavos(totals.subtotal);
    if (this.totalVat) this.totalVat.textContent = formatCentavos(totals.vat);
    if (this.totalGrand) this.totalGrand.textContent = formatCentavos(totals.grandTotal);
    if (this.trayQuickTotal) this.trayQuickTotal.textContent = formatCentavos(totals.grandTotal);
    if (this.headerItemsCount) this.headerItemsCount.textContent = totals.count;
    if (this.traySummaryCount) this.traySummaryCount.textContent = totals.count;
    if (this.btnProceedCheckout) this.btnProceedCheckout.disabled = totals.count === 0;
  }
}
