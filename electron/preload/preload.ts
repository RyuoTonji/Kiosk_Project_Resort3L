import { contextBridge, ipcRenderer } from 'electron';
import type {
  KioskAPI,
  SystemInfo,
  MenuItem,
  CreateOrderDTO,
  KioskOrder,
  PaymentRequest,
  PaymentResult,
  PrintReceiptParams,
  PrintResult
} from './kiosk-api';

/**
 * Sandboxed Electron Preload Bridge
 * Exposes only safe, explicit, white-listed asynchronous methods to the renderer.
 */
const kioskAPI: KioskAPI = {
  ping: (): Promise<string> => {
    return ipcRenderer.invoke('kiosk:ping');
  },
  getSystemInfo: (): Promise<SystemInfo> => {
    return ipcRenderer.invoke('kiosk:get-system-info');
  },
  getCategories: (): Promise<string[]> => {
    return ipcRenderer.invoke('kiosk:get-categories');
  },
  getMenuItems: (category?: string): Promise<MenuItem[]> => {
    return ipcRenderer.invoke('kiosk:get-menu-items', category);
  },
  getNextOrderNumber: (): Promise<number> => {
    return ipcRenderer.invoke('kiosk:get-next-order-number');
  },
  createOrder: (dto: CreateOrderDTO): Promise<KioskOrder> => {
    return ipcRenderer.invoke('kiosk:create-order', dto);
  },
  processPayment: (req: PaymentRequest): Promise<PaymentResult> => {
    return ipcRenderer.invoke('kiosk:process-payment', req);
  },
  printReceipt: (params: PrintReceiptParams): Promise<PrintResult> => {
    return ipcRenderer.invoke('kiosk:print-receipt', params);
  }
};

contextBridge.exposeInMainWorld('kioskAPI', kioskAPI);
