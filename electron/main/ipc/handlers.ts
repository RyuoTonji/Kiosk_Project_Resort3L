import { ipcMain } from 'electron';
import { MenuRepository } from '../database/repositories/menu.repository';
import { OrderRepository, CreateOrderDTO } from '../database/repositories/order.repository';
import { MockThermalPrinter, PrintReceiptParams } from '../hardware/printer';
import { MockPaymentReader, PaymentRequest } from '../hardware/payment-reader';

const printer = new MockThermalPrinter();
const paymentReader = new MockPaymentReader();

export function registerIpcHandlers(): void {
  // System Diagnostics
  ipcMain.handle('kiosk:ping', async () => 'pong');

  ipcMain.handle('kiosk:get-system-info', async () => ({
    version: '1.0.0',
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    platform: process.platform,
    arch: process.arch,
    uptime: process.uptime(),
  }));

  // Menu Catalog
  ipcMain.handle('kiosk:get-categories', async () => {
    return MenuRepository.getCategories();
  });

  ipcMain.handle('kiosk:get-menu-items', async (_event, category?: string) => {
    return MenuRepository.getMenuItems(category);
  });

  // Order Sequencing & Transaction
  ipcMain.handle('kiosk:get-next-order-number', async () => {
    return OrderRepository.getNextOrderNumber();
  });

  ipcMain.handle('kiosk:create-order', async (_event, dto: CreateOrderDTO) => {
    return OrderRepository.createOrder(dto);
  });

  // Payment Hardware
  ipcMain.handle('kiosk:process-payment', async (_event, req: PaymentRequest) => {
    return paymentReader.processPayment(req);
  });

  // Receipt Printing
  ipcMain.handle('kiosk:print-receipt', async (_event, params: PrintReceiptParams) => {
    return printer.printReceipt(params);
  });
}
