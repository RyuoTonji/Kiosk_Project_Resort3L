import { CartManager } from '../models/cart-manager.js';
import { ScreenRouter } from '../views/screen-router.js';
import { CatalogView } from '../views/catalog-view.js';
import { CustomizationModal } from '../views/customization-modal.js';
import { SummaryTrayView } from '../views/summary-tray-view.js';
import { ConfirmationView } from '../views/confirmation-view.js';

/**
 * KioskApp (Controller Layer)
 * Master controller coordinating models, views, and the window.kioskAPI contextBridge.
 */
export class KioskApp {
  constructor() {
    // 1. Initialize Model
    this.cartManager = new CartManager();

    // 2. Initialize State
    this.diningMode = 'dine-in';
    this.categories = [];
    this.menuItems = [];
    this.nextOrderNumber = 42;

    // 3. Initialize Views
    this.router = new ScreenRouter();

    this.catalogView = new CatalogView({
      onItemSelect: (item) => this.handleProductSelect(item)
    });

    this.customizationModal = new CustomizationModal({
      onConfirm: (data) => this.handleRecipeConfirm(data)
    });

    this.summaryTrayView = new SummaryTrayView({
      onItemEdit: (cartItem, index) => this.handleItemEdit(cartItem, index),
      onIncrement: (index) => this.cartManager.incrementQuantity(index),
      onDecrement: (index) => this.cartManager.decrementQuantity(index),
      onDelete: (index) => this.cartManager.removeItem(index),
      onCheckout: () => this.handleCheckout(),
      onStartOver: () => this.handleStartOver()
    });

    this.confirmationView = new ConfirmationView({
      onFinish: () => this.handleResetToWelcome()
    });

    // 4. Static UI bindings
    this.menuOrderNumEl = document.getElementById('menu-order-num');
    this.menuDiningTagEl = document.getElementById('menu-dining-tag');
    this.screenWelcomeEl = document.getElementById('screen-welcome');
    this.optDineInEl = document.getElementById('opt-dine-in');
    this.optTakeOutEl = document.getElementById('opt-take-out');
    this.btnDiningCancelEl = document.getElementById('btn-dining-cancel');
  }

  /**
   * Initialize application lifecycle, subscribe reactive observers, and load SQLite data.
   */
  async init() {
    console.log("[3L's Beach Resort Kiosk] Initializing OOP Kiosk Application...");

    // Bind reactive updates from cart to tray
    this.cartManager.subscribe((items, totals) => {
      this.summaryTrayView.renderItems(items);
      this.summaryTrayView.updateTotals(totals);
    });

    this.bindStaticNavigation();
    await this.loadCatalogData();

    // Initialize display with empty cart
    this.summaryTrayView.updateTotals(this.cartManager.calculateTotals());
    this.summaryTrayView.renderItems([]);
  }

  /**
   * Bind static screen navigation events.
   */
  bindStaticNavigation() {
    // Welcome poster tap
    if (this.screenWelcomeEl) {
      this.screenWelcomeEl.addEventListener('click', () => {
        this.router.navigate('dining');
      });
    }

    // Dine In selection
    if (this.optDineInEl) {
      this.optDineInEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setDiningMode('dine-in');
        this.router.navigate('menu');
      });
    }

    // Take Out selection
    if (this.optTakeOutEl) {
      this.optTakeOutEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setDiningMode('take-out');
        this.router.navigate('menu');
      });
    }

    // Dining cancel button
    if (this.btnDiningCancelEl) {
      this.btnDiningCancelEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.router.navigate('welcome');
      });
    }
  }

  /**
   * Set dining mode and update header display.
   * @param {'dine-in' | 'take-out'} mode
   */
  setDiningMode(mode) {
    this.diningMode = mode;
    if (this.menuDiningTagEl) {
      this.menuDiningTagEl.textContent = mode === 'take-out' ? 'TAKE OUT' : 'DINE IN';
    }
  }

  /**
   * Load categories, menu items, and order sequence from SQLite database.
   */
  async loadCatalogData() {
    if (!window.kioskAPI) {
      console.error('[KioskApp] window.kioskAPI bridge is missing!');
      return;
    }

    try {
      // 1. Fetch next sequential order number
      this.nextOrderNumber = await window.kioskAPI.getNextOrderNumber();
      const formattedNum = '#' + String(this.nextOrderNumber).padStart(3, '0');
      if (this.menuOrderNumEl) {
        this.menuOrderNumEl.textContent = formattedNum;
      }

      // 2. Fetch active categories
      this.categories = await window.kioskAPI.getCategories();

      // 3. Fetch active menu catalog
      this.menuItems = await window.kioskAPI.getMenuItems();

      // Populate CatalogView
      this.catalogView.setData(this.categories, this.menuItems);
    } catch (err) {
      console.error('[KioskApp] Failed to load catalog from SQLite:', err);
    }
  }

  /**
   * Handle product card selection to open customization modal.
   * @param {Object} item
   */
  handleProductSelect(item) {
    this.customizationModal.open(item, 'add');
  }

  /**
   * Handle editing an existing item from the summary tray.
   * @param {Object} cartItem
   * @param {number} index
   */
  handleItemEdit(cartItem, index) {
    const matchedMenuItem = this.menuItems.find((m) => m.id === cartItem.menuItemId);
    if (matchedMenuItem) {
      this.customizationModal.open(matchedMenuItem, 'edit', cartItem.recipe, index);
    }
  }

  /**
   * Handle customization modal recipe confirmation.
   * @param {Object} data
   */
  handleRecipeConfirm(data) {
    if (data.mode === 'edit' && data.editIndex >= 0) {
      this.cartManager.updateItem(
        data.editIndex,
        data.recipe,
        data.unitPrice,
        data.modifiersTotal,
        data.modifiersSummary
      );
    } else {
      this.cartManager.addItem(
        data.item,
        data.recipe,
        data.unitPrice,
        data.modifiersTotal,
        data.modifiersSummary
      );
    }
  }

  /**
   * Handle starting over and clearing the cart.
   */
  handleStartOver() {
    if (this.cartManager.getTotalCount() === 0 || confirm('Start over and reset current order?')) {
      this.cartManager.clear();
      this.summaryTrayView.toggleTray(false);
      this.catalogView.resetCategory();
      this.router.navigate('welcome');
    }
  }

  /**
   * Handle checkout transaction pipeline.
   */
  async handleCheckout() {
    const items = this.cartManager.getItems();
    if (items.length === 0) return;

    const { subtotal, vat, grandTotal } = this.cartManager.calculateTotals();

    try {
      // 1. Commit Order to local SQLite database with atomic transaction
      const orderDTO = {
        diningMode: this.diningMode,
        paymentMethod: 'cashier-counter',
        subtotal: subtotal,
        vat: vat,
        totalAmount: grandTotal,
        items: items
      };

      console.log("[3L's Beach Resort Kiosk] Registering order in SQLite for cashier counter payment...");
      const createdOrder = await window.kioskAPI.createOrder(orderDTO);

      // 2. Automatically print 80mm ESC/POS thermal receipt in background
      console.log("[3L's Beach Resort Kiosk] Auto-printing physical receipt slip...");
      await window.kioskAPI.printReceipt({
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        diningMode: createdOrder.diningMode,
        paymentMethod: 'PAY AT CASHIER COUNTER',
        subtotal: createdOrder.subtotal,
        vat: createdOrder.vat,
        totalAmount: createdOrder.totalAmount,
        items: items,
        createdAt: createdOrder.createdAt,
        storeName: "3L'S BEACH RESORT",
        kioskId: 'COUNTER PAYMENT SLIP'
      });

      // 3. Display confirmation screen with barcode and 5-second countdown timer
      this.confirmationView.displayOrder(createdOrder);
      this.router.navigate('confirmed');

      // 4. Reset Cart and collapse tray for next customer
      this.cartManager.clear();
      this.summaryTrayView.toggleTray(false);
      this.catalogView.resetCategory();

      // 5. Update next order sequence display
      this.nextOrderNumber = await window.kioskAPI.getNextOrderNumber();
      if (this.menuOrderNumEl) {
        this.menuOrderNumEl.textContent = '#' + String(this.nextOrderNumber).padStart(3, '0');
      }

    } catch (err) {
      console.error('[KioskApp] Checkout error:', err);
      alert('Order Error: ' + (err.message || err));
    }
  }

  /**
   * Reset kiosk terminal to the welcome poster.
   */
  handleResetToWelcome() {
    this.confirmationView.clearTimer();
    this.router.navigate('welcome');
  }
}
