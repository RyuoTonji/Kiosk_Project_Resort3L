import { formatCentavos } from '../utils/formatters.js';

/**
 * CatalogView (View Layer)
 * Manages category selection tabs, product card rendering, and item selection events.
 */
export class CatalogView {
  /**
   * @param {Object} options
   * @param {Function} options.onItemSelect - Callback when a product card or ADD button is clicked
   */
  constructor({ onItemSelect }) {
    this.categoryButtonContainer = document.getElementById('category-button-container');
    this.currentCategoryLabel = document.getElementById('current-category-label');
    this.menuProductGrid = document.getElementById('menu-product-grid');
    this.onItemSelect = onItemSelect;

    this.activeCategory = 'all';
    this.categories = [];
    this.menuItems = [];
  }

  /**
   * Set catalog data and render initial state.
   * @param {string[]} categories
   * @param {Array} menuItems
   */
  setData(categories, menuItems) {
    this.categories = categories || [];
    this.menuItems = menuItems || [];
    this.renderCategories();
    this.renderMenuItems();
  }

  /**
   * Render category sidebar tabs with active resort theme state.
   */
  renderCategories() {
    if (!this.categoryButtonContainer) return;
    this.categoryButtonContainer.innerHTML = '';

    const allCats = ['all', ...this.categories];

    allCats.forEach((cat) => {
      const btn = document.createElement('button');
      const isActive = cat === this.activeCategory;
      btn.className = `w-full py-3 px-3 text-left text-[11px] font-black rounded-2xl border-2 uppercase touch-press transition-all shadow-xs ${
        isActive
          ? 'bg-sky-700 text-white border-sky-800 shadow-md ring-2 ring-amber-400'
          : 'bg-white text-slate-700 border-slate-200 hover:bg-sky-50 hover:border-sky-300'
      }`;
      btn.textContent = cat === 'all' ? '🌴 ALL ITEMS' : `• ${cat.toUpperCase()}`;

      btn.addEventListener('click', () => {
        this.activeCategory = cat;
        if (this.currentCategoryLabel) {
          this.currentCategoryLabel.textContent = `${cat.toUpperCase()} ITEMS`;
        }
        this.renderCategories();
        this.renderMenuItems();
      });

      this.categoryButtonContainer.appendChild(btn);
    });
  }

  /**
   * Render 3-column product cards for current active category.
   */
  renderMenuItems() {
    if (!this.menuProductGrid) return;
    this.menuProductGrid.innerHTML = '';

    const filtered = this.activeCategory === 'all'
      ? this.menuItems
      : this.menuItems.filter((i) => i.category.toLowerCase() === this.activeCategory.toLowerCase());

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

      card.addEventListener('click', () => {
        if (typeof this.onItemSelect === 'function') {
          this.onItemSelect(item);
        }
      });

      this.menuProductGrid.appendChild(card);
    });
  }

  /**
   * Reset category selection to 'all'.
   */
  resetCategory() {
    this.activeCategory = 'all';
    if (this.currentCategoryLabel) {
      this.currentCategoryLabel.textContent = 'ALL ITEMS';
    }
    this.renderCategories();
    this.renderMenuItems();
  }
}
