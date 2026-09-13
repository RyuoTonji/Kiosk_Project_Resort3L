/**
 * 3L's Beach Resort — Centralized State Engine
 * Single source of truth for the touchscreen kiosk interface.
 * Implements observer pattern for targeted DOM updates.
 */

import { createCartItem, getModifierConfigKey } from './cart.js';

const initialState = {
  screen: 'welcome', // 'welcome' | 'service-option' | 'catalog' | 'confirmed'
  serviceType: 'food-drinks', // 'food-drinks' | 'resort-activities'
  activeCategory: 'refreshments',
  cart: [],
  selectedItem: null,
  customizationModalOpen: false,
  orderNumber: 42,
  language: 'EN' // 'EN' | 'FIL'
};

class StateStore {
  constructor(initial) {
    this._state = { ...initial };
    this._listeners = new Set();
  }

  getState() {
    return this._state;
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify(changedKeys = []) {
    for (const listener of this._listeners) {
      try {
        listener(this._state, changedKeys);
      } catch (err) {
        console.error('[StateStore] Listener error:', err);
      }
    }
  }

  setScreen(screen) {
    if (this._state.screen === screen) return;
    this._state.screen = screen;
    this._notify(['screen']);
  }

  setServiceType(serviceType) {
    this._state.serviceType = serviceType;
    this._notify(['serviceType']);
  }

  setCategory(category) {
    if (this._state.activeCategory === category) return;
    this._state.activeCategory = category;
    this._notify(['activeCategory']);
  }

  setLanguage(language) {
    if (this._state.language === language) return;
    this._state.language = language;
    this._notify(['language']);
  }

  setOrderNumber(orderNumber) {
    this._state.orderNumber = orderNumber;
    this._notify(['orderNumber']);
  }

  openCustomization(item) {
    this._state.selectedItem = item;
    this._state.customizationModalOpen = true;
    this._notify(['customizationModalOpen', 'selectedItem']);
  }

  closeCustomization() {
    this._state.customizationModalOpen = false;
    this._state.selectedItem = null;
    this._notify(['customizationModalOpen', 'selectedItem']);
  }

  addToCart(menuItem, selectedModifiers = [], quantity = 1) {
    const defaultMods = selectedModifiers.length > 0
      ? selectedModifiers
      : (menuItem.modifiers || []).map((m) => ({ ...m, selected: !!m.included }));

    const newItem = createCartItem(menuItem, defaultMods, quantity);
    const newConfigKey = getModifierConfigKey(newItem.modifiers);

    // Look for matching item with exact identical modifiers
    const existingIndex = this._state.cart.findIndex(
      (c) => c.menuItemId === newItem.menuItemId && getModifierConfigKey(c.modifiers) === newConfigKey
    );

    if (existingIndex >= 0) {
      this._state.cart[existingIndex].quantity += newItem.quantity;
    } else {
      this._state.cart.push(newItem);
    }

    this._notify(['cart']);
  }

  updateCartQuantity(cartItemId, delta) {
    const itemIndex = this._state.cart.findIndex((c) => c.cartItemId === cartItemId);
    if (itemIndex < 0) return;

    const currentQty = this._state.cart[itemIndex].quantity;
    const newQty = currentQty + delta;

    if (newQty <= 0) {
      this._state.cart.splice(itemIndex, 1);
    } else {
      this._state.cart[itemIndex].quantity = newQty;
    }

    this._notify(['cart']);
  }

  removeFromCart(cartItemId) {
    this._state.cart = this._state.cart.filter((c) => c.cartItemId !== cartItemId);
    this._notify(['cart']);
  }

  clearCart() {
    this._state.cart = [];
    this._notify(['cart']);
  }

  resetOrder() {
    this._state.cart = [];
    this._state.serviceType = 'food-drinks';
    this._state.activeCategory = 'refreshments';
    this._state.customizationModalOpen = false;
    this._state.selectedItem = null;
    this._state.screen = 'welcome';
    this._notify(['screen', 'cart', 'serviceType', 'activeCategory', 'customizationModalOpen']);
  }
}

export const store = new StateStore(initialState);
