export interface PrintReceiptParams {
  orderId: string;
  orderNumber: number;
  diningMode: string;
  paymentMethod: string;
  subtotal: number;
  vat: number;
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    modifiersSummary?: string[];
  }>;
  kioskId?: string;
  storeName?: string;
  createdAt?: string;
}

export interface PrintResult {
  success: boolean;
  printerName: string;
  receiptText: string;
  timestamp: string;
  error?: string;
}

export interface IPrinterAdapter {
  printReceipt(params: PrintReceiptParams): Promise<PrintResult>;
}

export class MockThermalPrinter implements IPrinterAdapter {
  private printerName = 'VIRTUAL-THERMAL-ESC-POS-80MM';

  /**
   * Format and generate an 80mm ESC/POS thermal receipt slip.
   * @param params - Receipt parameters including line items and totals
   * @returns Formatted receipt result
   */
  async printReceipt(params: PrintReceiptParams): Promise<PrintResult> {
    const store = params.storeName || "3L's Beach Resort";
    const kiosk = params.kioskId || 'KIOSK-MNL-001';
    const dateStr = params.createdAt ? new Date(params.createdAt).toLocaleString('en-US', { hour12: true }) : new Date().toLocaleString('en-US', { hour12: true });
    const orderNumStr = String(params.orderNumber).padStart(3, '0');
    const modeStr = params.diningMode.toUpperCase().replace('-', ' ');
    const paymentStr = params.paymentMethod.toUpperCase();

    const formatCentavos = (centavos: number) => `PHP ${(centavos / 100).toFixed(2)}`;

    // Build 80mm ASCII formatted thermal receipt
    let receipt = '';
    receipt += '================================================\n';
    receipt += `             ${store}             \n`;
    receipt += `               TERMINAL: ${kiosk}               \n`;
    receipt += '================================================\n';
    receipt += `DATE & TIME: ${dateStr}\n`;
    receipt += `MODE: ${modeStr}\n`;
    receipt += `PAYMENT METHOD: ${paymentStr}\n`;
    receipt += '------------------------------------------------\n';
    receipt += `                ORDER NUMBER                    \n`;
    receipt += `                   #${orderNumStr}                     \n`;
    receipt += '------------------------------------------------\n';
    receipt += 'QTY  ITEM DESCRIPTION                     AMOUNT\n';
    receipt += '------------------------------------------------\n';

    for (const item of params.items) {
      const lineTotal = item.quantity * item.unitPrice;
      const nameCol = item.name.padEnd(32).slice(0, 32);
      const qtyCol = String(item.quantity).padEnd(4);
      const amtCol = formatCentavos(lineTotal).padStart(10);
      receipt += `${qtyCol} ${nameCol} ${amtCol}\n`;

      if (item.modifiersSummary && item.modifiersSummary.length > 0) {
        for (const mod of item.modifiersSummary) {
          receipt += `     * ${mod}\n`;
        }
      }
    }

    receipt += '------------------------------------------------\n';
    receipt += `SUBTOTAL:                          ${formatCentavos(params.subtotal).padStart(13)}\n`;
    receipt += `VAT (12%):                         ${formatCentavos(params.vat).padStart(13)}\n`;
    receipt += '================================================\n';
    receipt += `TOTAL AMOUNT:                      ${formatCentavos(params.totalAmount).padStart(13)}\n`;
    receipt += '================================================\n';
    receipt += `BARCODE: ||| |||| | |||||| ||| || | |||| || ||| \n`;
    receipt += `REF ID:  ${params.orderId}\n`;
    receipt += '------------------------------------------------\n';
    receipt += '         THANK YOU FOR YOUR ORDER!              \n';
    receipt += '       PLEASE CLAIM AT THE PICKUP COUNTER       \n';
    receipt += '================================================\n';

    console.log('\n[Thermal Printer Output Received]:\n' + receipt);

    return {
      success: true,
      printerName: this.printerName,
      receiptText: receipt,
      timestamp: new Date().toISOString()
    };
  }
}
