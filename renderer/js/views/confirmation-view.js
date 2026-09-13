import { generateBarcodeSVG } from '../utils/formatters.js';

/**
 * ConfirmationView (View Layer)
 * Manages order confirmation display, cashier scan barcode SVG generation,
 * fast-food dining notes, and the 5-second auto-reset countdown timer.
 */
export class ConfirmationView {
  /**
   * @param {Object} options
   * @param {Function} options.onFinish - Callback triggered when countdown completes or Finish button is pressed
   */
  constructor({ onFinish }) {
    this.confirmTimestamp = document.getElementById('confirm-timestamp');
    this.confirmOrderNumber = document.getElementById('confirm-order-number');
    this.confirmDiningMode = document.getElementById('confirm-dining-mode');
    this.barcodeContainer = document.getElementById('barcode-container');
    this.barcodeLabel = document.getElementById('barcode-label');
    this.confirmTimer = document.getElementById('confirm-timer');
    this.btnFinishOrder = document.getElementById('btn-finish-order');

    this.onFinish = onFinish;
    this.timerInterval = null;

    this.bindEvents();
  }

  /**
   * Bind finish button.
   */
  bindEvents() {
    if (this.btnFinishOrder) {
      this.btnFinishOrder.addEventListener('click', () => {
        this.clearTimer();
        if (typeof this.onFinish === 'function') {
          this.onFinish();
        }
      });
    }
  }

  /**
   * Display registered order details and start the 5-second auto-reset timer.
   * @param {Object} order - Created order record
   */
  displayOrder(order) {
    this.clearTimer();

    // 1. Format timestamp
    const dateFormatted = order.createdAt
      ? new Date(order.createdAt).toLocaleString('en-US')
      : new Date().toLocaleString('en-US');
    if (this.confirmTimestamp) {
      this.confirmTimestamp.textContent = dateFormatted;
    }

    // 2. Format order sequence number (#042)
    const orderNumStr = '#' + String(order.orderNumber).padStart(3, '0');
    if (this.confirmOrderNumber) {
      this.confirmOrderNumber.textContent = orderNumStr;
    }

    // 3. Format dining mode badge
    if (this.confirmDiningMode) {
      this.confirmDiningMode.textContent = order.diningMode
        ? order.diningMode.toUpperCase().replace('-', ' ')
        : 'DINE IN';
    }

    // 4. Generate optical scanner barcode SVG
    const orderRef = order.id ? order.id.substring(0, 8).toUpperCase() : '00000000';
    const barcodeCode = `ORD-${String(order.orderNumber).padStart(3, '0')}-${orderRef}`;
    if (this.barcodeContainer) {
      this.barcodeContainer.innerHTML = generateBarcodeSVG(barcodeCode, 260, 60);
    }
    if (this.barcodeLabel) {
      this.barcodeLabel.textContent = barcodeCode;
    }

    // 5. Start 5-second auto-reset countdown
    let secondsLeft = 5;
    if (this.confirmTimer) {
      this.confirmTimer.textContent = `Returning to start in ${secondsLeft}s...`;
    }

    this.timerInterval = setInterval(() => {
      secondsLeft--;
      if (this.confirmTimer) {
        this.confirmTimer.textContent = `Returning to start in ${secondsLeft}s...`;
      }
      if (secondsLeft <= 0) {
        this.clearTimer();
        if (typeof this.onFinish === 'function') {
          this.onFinish();
        }
      }
    }, 1000);
  }

  /**
   * Clear active countdown timer.
   */
  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
