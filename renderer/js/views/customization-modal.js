import { formatCentavos } from '../utils/formatters.js';

/**
 * CustomizationModal (View Layer)
 * Manages item recipe customizations, toppings checklists, real-time price deltas,
 * and dispatching "ADD ORDER" or "UPDATE ORDER" events.
 */
export class CustomizationModal {
  /**
   * @param {Object} options
   * @param {Function} options.onConfirm - Callback when customer confirms customized recipe
   */
  constructor({ onConfirm }) {
    this.modalEl = document.getElementById('modal-customization');
    this.badgeEl = document.getElementById('cust-modal-badge');
    this.nameEl = document.getElementById('cust-item-name');
    this.priceEl = document.getElementById('cust-unit-price');
    this.listEl = document.getElementById('cust-ingredients-list');
    this.cancelBtn = document.getElementById('cust-btn-cancel');
    this.confirmBtn = document.getElementById('cust-btn-confirm');
    this.onConfirm = onConfirm;

    this.currentItem = null;
    this.currentMode = 'add'; // 'add' | 'edit'
    this.editIndex = -1;
    this.recipeState = {};

    this.bindEvents();
  }

  /**
   * Bind static modal cancel and confirm triggers.
   */
  bindEvents() {
    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => this.close());
    }

    if (this.confirmBtn) {
      this.confirmBtn.addEventListener('click', () => this.handleConfirm());
    }
  }

  /**
   * Open modal for a product.
   * @param {Object} item - Product definition
   * @param {'add' | 'edit'} mode - Mode of operation
   * @param {Record<string, boolean> | null} existingRecipe - Initial recipe if editing
   * @param {number} editIndex - Cart index if editing
   */
  open(item, mode = 'add', existingRecipe = null, editIndex = -1) {
    this.currentItem = item;
    this.currentMode = mode;
    this.editIndex = editIndex;

    let ingredients = [];
    try {
      ingredients = JSON.parse(item.base_ingredients_json);
    } catch (err) {
      console.error('[CustomizationModal] Error parsing ingredients:', err);
    }

    this.recipeState = {};
    if (mode === 'edit' && existingRecipe) {
      this.recipeState = { ...existingRecipe };
    } else {
      ingredients.forEach((ing) => {
        this.recipeState[ing.id] = !!ing.included;
      });
    }

    if (this.nameEl) this.nameEl.textContent = item.name.toUpperCase();
    if (this.badgeEl) {
      this.badgeEl.textContent = mode === 'edit' ? '[ EDIT ORDERED RECIPE ]' : '[ CUSTOMIZE RECIPE ]';
    }
    if (this.confirmBtn) {
      this.confirmBtn.textContent = mode === 'edit' ? 'UPDATE ORDER' : 'ADD ORDER';
    }

    this.renderChecklist(ingredients);
    this.updatePrice(ingredients);

    if (this.modalEl) {
      this.modalEl.classList.remove('hidden');
    }
  }

  /**
   * Close the customization modal.
   */
  close() {
    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
    }
    this.currentItem = null;
    this.editIndex = -1;
  }

  /**
   * Render dynamic ingredients and add-ons checklist.
   * @param {Array} ingredients
   */
  renderChecklist(ingredients) {
    if (!this.listEl) return;
    this.listEl.innerHTML = '';

    ingredients.forEach((ing) => {
      const label = document.createElement('label');
      label.className = 'flex items-center justify-between p-3 border-2 border-slate-200 bg-white hover:bg-sky-50 active:bg-sky-100 rounded-2xl cursor-pointer select-none touch-press transition-colors shadow-2xs';

      const priceBadge = ing.price_delta > 0
        ? `<span class="text-xs font-black font-mono text-sky-900 bg-amber-200 border border-amber-300 px-2 py-0.5 rounded-lg">+${formatCentavos(ing.price_delta)}</span>`
        : (ing.required ? '<span class="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">[ REQUIRED ]</span>' : '');

      label.innerHTML = `
        <div class="flex items-center gap-3">
          <input type="checkbox" ${this.recipeState[ing.id] ? 'checked' : ''} ${ing.required ? 'disabled' : ''} class="w-5 h-5 border-2 border-sky-600 rounded-lg text-sky-600 focus:ring-0 cursor-pointer accent-sky-600">
          <span class="text-xs font-black uppercase text-slate-800">${ing.name}</span>
        </div>
        ${priceBadge}
      `;

      const checkbox = label.querySelector('input');
      checkbox.addEventListener('change', () => {
        this.recipeState[ing.id] = checkbox.checked;
        this.updatePrice(ingredients);
      });

      this.listEl.appendChild(label);
    });
  }

  /**
   * Calculate and update displayed unit price.
   * @param {Array} ingredients
   * @returns {{ modifiersTotal: number, unitPrice: number, modifiersSummary: string[] }}
   */
  updatePrice(ingredients) {
    let modifiersTotal = 0;
    const modifiersSummary = [];

    ingredients.forEach((ing) => {
      const isChecked = !!this.recipeState[ing.id];
      if (ing.price_delta > 0 && isChecked) {
        modifiersTotal += ing.price_delta;
        modifiersSummary.push(`+ ${ing.name} (${formatCentavos(ing.price_delta)})`);
      } else if (!ing.required && !isChecked && ing.included) {
        modifiersSummary.push(`No ${ing.name}`);
      }
    });

    const unitPrice = this.currentItem.price + modifiersTotal;
    if (this.priceEl) {
      this.priceEl.textContent = formatCentavos(unitPrice);
    }

    return { modifiersTotal, unitPrice, modifiersSummary };
  }

  /**
   * Handle confirmation button click.
   */
  handleConfirm() {
    if (!this.currentItem) return;

    let ingredients = [];
    try {
      ingredients = JSON.parse(this.currentItem.base_ingredients_json);
    } catch (e) {}

    const { modifiersTotal, unitPrice, modifiersSummary } = this.updatePrice(ingredients);

    if (typeof this.onConfirm === 'function') {
      this.onConfirm({
        item: this.currentItem,
        recipe: this.recipeState,
        unitPrice: unitPrice,
        modifiersTotal: modifiersTotal,
        modifiersSummary: modifiersSummary,
        mode: this.currentMode,
        editIndex: this.editIndex
      });
    }

    this.close();
  }
}
