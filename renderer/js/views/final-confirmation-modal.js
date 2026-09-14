import { formatCentavos } from '../utils/formatters.js';

/**
 * FinalConfirmationModal (View Layer)
 * Manages the final order review popup before checkout execution,
 * allowing customers to verify their items or go back and modify them.
 */
export class FinalConfirmationModal {
  /**
   * @param {Object} options
   * @param {Function} options.onConfirm - Callback when customer confirms "YES, PLACE ORDER"
   */
  constructor({ onConfirm }) {
    this.modalEl = document.getElementById('modal-final-confirm');
    this.diningModeEl = document.getElementById('final-confirm-dining-mode');
    this.itemsListEl = document.getElementById('final-confirm-items-list');
    this.subtotalEl = document.getElementById('final-confirm-subtotal');
    this.vatEl = document.getElementById('final-confirm-vat');
    this.totalEl = document.getElementById('final-confirm-total');
    this.cancelBtn = document.getElementById('btn-final-cancel');
    this.confirmBtn = document.getElementById('btn-final-confirm');

    this.onConfirm = onConfirm;

    this.bindEvents();
  }

  /**
   * Bind cancel and confirm triggers.
   */
  bindEvents() {
    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => this.close());
    }

    if (this.confirmBtn) {
      this.confirmBtn.addEventListener('click', () => {
        this.close();
        if (typeof this.onConfirm === 'function') {
          this.onConfirm();
        }
      });
    }
  }

  /**
   * Open final confirmation review modal.
   * @param {Array} items - Cart items
   * @param {{ subtotal: number, vat: number, grandTotal: number, count: number }} totals
   * @param {string} diningMode - 'dine-in' | 'take-out'
   */
  open(items, totals, diningMode) {
    if (this.diningModeEl) {
      this.diningModeEl.textContent = diningMode === 'take-out' ? 'TAKE OUT' : 'DINE IN';
    }

    if (this.subtotalEl) this.subtotalEl.textContent = formatCentavos(totals.subtotal);
    if (this.vatEl) this.vatEl.textContent = formatCentavos(totals.vat);
    if (this.totalEl) this.totalEl.textContent = formatCentavos(totals.grandTotal);

    this.renderReviewItems(items);

    if (this.modalEl) {
      this.modalEl.classList.remove('hidden');
    }
  }

  /**
   * Close the modal without submitting the order.
   */
  close() {
    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
    }
  }

  /**
   * Render itemized list with quantities and modifiers for review.
   * @param {Array} items
   */
  renderReviewItems(items) {
    if (!this.itemsListEl) return;
    this.itemsListEl.innerHTML = '';

    items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs';

      const modHtml = item.modifiersSummary && item.modifiersSummary.length > 0
        ? `<div class="text-[10px] text-sky-800 font-bold mt-0.5">${item.modifiersSummary.join(', ')}</div>`
        : '';

      row.innerHTML = `
        <div class="flex-1 pr-2">
          <div class="text-xs font-black text-slate-900 uppercase">
            <span class="inline-block px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded-md font-mono text-[11px] mr-1">${item.quantity}x</span>
            ${item.name}
          </div>
          ${modHtml}
        </div>
        <div class="text-xs font-black font-mono text-sky-900 text-right shrink-0">
          ${formatCentavos(item.unitPrice * item.quantity)}
        </div>
      `;

      this.itemsListEl.appendChild(row);
    });
  }
}
