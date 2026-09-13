import { randomUUID } from 'crypto';
import { getDatabase } from '../sqlite';

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

export class OrderRepository {
  static getNextOrderNumber(): number {
    const db = getDatabase();
    const row = db.prepare(`SELECT value FROM kiosk_settings WHERE key = 'current_order_number'`).get() as { value: string } | undefined;
    return row ? parseInt(row.value, 10) : 42;
  }

  static createOrder(dto: CreateOrderDTO): KioskOrder {
    const db = getDatabase();

    // Atomic SQLite Transaction
    const executeTransaction = db.transaction(() => {
      // 1. Read and lock current sequence
      const settingRow = db.prepare(`
        SELECT value FROM kiosk_settings WHERE key = 'current_order_number'
      `).get() as { value: string } | undefined;

      const currentNum = settingRow ? parseInt(settingRow.value, 10) : 42;
      const assignedOrderNumber = currentNum;
      const nextNum = currentNum >= 999 ? 1 : currentNum + 1; // Cycle 001-999

      // 2. Generate cryptographically secure UUID v4
      const orderId = randomUUID();
      const now = new Date().toISOString();

      // 3. Insert order
      const insertStmt = db.prepare(`
        INSERT INTO kiosk_orders (
          id, order_number, dining_mode, payment_method,
          subtotal, vat, total_amount, items_recipe_json,
          sync_status, created_at
        ) VALUES (
          @id, @order_number, @dining_mode, @payment_method,
          @subtotal, @vat, @total_amount, @items_recipe_json,
          'pending', @created_at
        )
      `);

      insertStmt.run({
        id: orderId,
        order_number: assignedOrderNumber,
        dining_mode: dto.diningMode,
        payment_method: dto.paymentMethod,
        subtotal: dto.subtotal,
        vat: dto.vat,
        total_amount: dto.totalAmount,
        items_recipe_json: JSON.stringify(dto.items),
        created_at: now
      });

      // 4. Update counter in settings
      db.prepare(`
        UPDATE kiosk_settings
        SET value = ?, updated_at = ?
        WHERE key = 'current_order_number'
      `).run(nextNum.toString(), now);

      return {
        id: orderId,
        orderNumber: assignedOrderNumber,
        diningMode: dto.diningMode,
        paymentMethod: dto.paymentMethod,
        subtotal: dto.subtotal,
        vat: dto.vat,
        totalAmount: dto.totalAmount,
        itemsRecipeJson: JSON.stringify(dto.items),
        syncStatus: 'pending',
        createdAt: now,
        syncedAt: null
      };
    });

    return executeTransaction();
  }

  static getOrderById(id: string): KioskOrder | undefined {
    const db = getDatabase();
    const row = db.prepare(`SELECT * FROM kiosk_orders WHERE id = ?`).get(id) as any;
    if (!row) return undefined;

    return {
      id: row.id,
      orderNumber: row.order_number,
      diningMode: row.dining_mode,
      paymentMethod: row.payment_method,
      subtotal: row.subtotal,
      vat: row.vat,
      totalAmount: row.total_amount,
      itemsRecipeJson: row.items_recipe_json,
      syncStatus: row.sync_status,
      createdAt: row.created_at,
      syncedAt: row.synced_at
    };
  }
}
