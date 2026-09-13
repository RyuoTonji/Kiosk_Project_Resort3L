export interface SystemInfo {
  version: string;
  electronVersion: string;
  nodeVersion: string;
  platform: string;
  arch: string;
  uptime: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number; // Integer centavos (e.g. ₱85.00 = 8500)
  image_url: string | null;
  base_ingredients_json: string;
  active: number;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  name: string;
  included: boolean;
  required: boolean;
  price_delta: number;
}

export interface CreateOrderDTO {
  diningMode: 'dine-in' | 'take-out';
  paymentMethod: 'card' | 'cash';
  subtotal: number;
  vat: number;
  totalAmount: number;
  items: Array<{
    cartItemId: string;
    menuItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    modifiersTotal: number;
    recipe: Record<string, boolean>;
    modifiersSummary?: string[];
  }>;
}

export interface KioskOrder {
  id: string;
  orderNumber: number;
  diningMode: string;
  paymentMethod: string;
  subtotal: number;
  vat: number;
  totalAmount: number;
  itemsRecipeJson: string;
  syncStatus: string;
  createdAt: string;
  syncedAt: string | null;
}

export interface PaymentRequest {
  amount: number;
  orderId: string;
  method: 'card' | 'cash';
}

export interface PaymentResult {
  success: boolean;
  method: 'card' | 'cash';
  transactionId: string;
  authorizationCode?: string;
  message: string;
  timestamp: string;
}

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

export interface KioskAPI {
  ping: () => Promise<string>;
  getSystemInfo: () => Promise<SystemInfo>;
  getCategories: () => Promise<string[]>;
  getMenuItems: (category?: string) => Promise<MenuItem[]>;
  getNextOrderNumber: () => Promise<number>;
  createOrder: (dto: CreateOrderDTO) => Promise<KioskOrder>;
  processPayment: (req: PaymentRequest) => Promise<PaymentResult>;
  printReceipt: (params: PrintReceiptParams) => Promise<PrintResult>;
}

declare global {
  interface Window {
    kioskAPI: KioskAPI;
  }
}
